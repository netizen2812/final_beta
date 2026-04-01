import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Load local environment config if you want to run this locally
dotenv.config();

// Ensure the necessary environment variables are set before running
const CLERK_DEV_SECRET_KEY = process.env.CLERK_DEV_SECRET_KEY;
const CLERK_PROD_SECRET_KEY = process.env.CLERK_PROD_SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;

if (!CLERK_DEV_SECRET_KEY || !CLERK_PROD_SECRET_KEY || !MONGO_URI) {
    console.error("❌ Missing required environment variables. Please check your .env file.");
    console.error("Required: CLERK_DEV_SECRET_KEY, CLERK_PROD_SECRET_KEY, MONGO_URI");
    process.exit(1);
}

// ---------------------------------------------------------
// 1. Mongoose Models (Simplified for direct string updating)
// ---------------------------------------------------------
const userSchema = new mongoose.Schema({ clerkId: String, email: String, name: String }, { strict: false });
const User = mongoose.model("User", userSchema);

const conversationSchema = new mongoose.Schema({ clerkId: String }, { strict: false });
const Conversation = mongoose.model("Conversation", conversationSchema);

const analyticsEventSchema = new mongoose.Schema({ userId: String }, { strict: false });
const AnalyticsEvent = mongoose.model("AnalyticsEvent", analyticsEventSchema);

const liveAccessRequestSchema = new mongoose.Schema({ userId: String, reviewedBy: String }, { strict: false });
const LiveAccessRequest = mongoose.model("LiveAccessRequest", liveAccessRequestSchema);

// ---------------------------------------------------------
// 2. Clerk API Helpers
// ---------------------------------------------------------
async function fetchClerkUsers(secretKey) {
    let allUsers = [];
    let offset = 0;
    const limit = 500;
    let hasMore = true;

    while (hasMore) {
        const response = await fetch(`https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}`, {
            headers: { Authorization: `Bearer ${secretKey}` },
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Failed to fetch users from Clerk: ${errText}`);
        }

        const users = await response.json();
        if (users.length === 0) {
            hasMore = false;
        } else {
            allUsers = allUsers.concat(users);
            offset += limit;
        }
    }

    return allUsers;
}

async function createClerkProdUser(secretKey, devUser) {
    const primaryEmailObj = devUser.email_addresses.find(e => e.id === devUser.primary_email_address_id);
    const primaryEmail = primaryEmailObj ? primaryEmailObj.email_address : null;

    if (!primaryEmail) {
        console.warn(`⚠️ Skipping user ${devUser.id}: No primary email address found.`);
        return null;
    }

    const payload = {
        email_address: [primaryEmail],
        first_name: devUser.first_name || "",
        last_name: devUser.last_name || "",
        public_metadata: devUser.public_metadata || {},
        private_metadata: devUser.private_metadata || {},
        unsafe_metadata: devUser.unsafe_metadata || {},
        skip_password_checks: true,
        skip_password_requirement: true, // Allow users to sign-in via SSO still
    };

    // If user had a password setup, we can't migrate the actual password hash easily via API without enabling custom hashing logic.
    // Best practice for Prod is forcing a password reset or trusting OAuth if they used Google.

    let response = await fetch("https://api.clerk.com/v1/users", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${secretKey}`,
        },
        body: JSON.stringify(payload),
    });

    if (response.ok) {
        const prodUser = await response.json();
        console.log(`✅ Created Prod User: ${primaryEmail} (Old ID: ${devUser.id} -> New ID: ${prodUser.id})`);
        return { oldId: devUser.id, newId: prodUser.id, email: primaryEmail };
    }

    // Handle case where user already exists in Prod
    if (response.status === 422) {
        const errorData = await response.json();
        const isDuplicate = errorData.errors?.some(e => e.code === "form_identifier_exists");

        if (isDuplicate) {
            console.log(`ℹ️ User already exists in Prod: ${primaryEmail}. Fetching their existing Prod ID...`);
            // Fetch the existing user by email
            const fetchResp = await fetch(`https://api.clerk.com/v1/users?email_address=${encodeURIComponent(primaryEmail)}`, {
                headers: { Authorization: `Bearer ${secretKey}` }
            });
            const existingUsers = await fetchResp.json();

            if (existingUsers && existingUsers.length > 0) {
                console.log(`🔗 Mapped existing Prod User: ${primaryEmail} (Old ID: ${devUser.id} -> New ID: ${existingUsers[0].id})`);
                return { oldId: devUser.id, newId: existingUsers[0].id, email: primaryEmail };
            }
        }
    }

    const errText = await response.text();
    console.error(`❌ Failed to create user ${primaryEmail}:`, errText);
    return null;
}

// ---------------------------------------------------------
// 3. Execution Script
// ---------------------------------------------------------
async function runMigration() {
    console.log("🚀 Starting Clerk Dev -> Prod Migration Script...");

    try {
        // Phase 1: Connect to MongoDB
        console.log("📦 Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ MongoDB Connected.");

        // Phase 2: Fetch Dev Users
        console.log("\n📥 Fetching users from Clerk Development environment...");
        const devUsers = await fetchClerkUsers(CLERK_DEV_SECRET_KEY);
        console.log(`✅ Retrieved ${devUsers.length} users from Dev.`);

        if (devUsers.length === 0) {
            console.log("No users found to migrate. Exiting.");
            process.exit(0);
        }

        // Phase 3: Sync Users to Prod
        console.log("\n📤 Syncing users to Clerk Production environment...");
        const userMapping = [];

        for (const devUser of devUsers) {
            const mapping = await createClerkProdUser(CLERK_PROD_SECRET_KEY, devUser);
            if (mapping) {
                userMapping.push(mapping);
            }
            // Clerk rate limit prevention
            await new Promise((resolve) => setTimeout(resolve, 200));
        }

        // Save mapping to file as a backup
        const mappingFilePath = path.join(process.cwd(), "clerk_user_mapping.json");
        fs.writeFileSync(mappingFilePath, JSON.stringify(userMapping, null, 2));
        console.log(`\n💾 Saved user mapping to ${mappingFilePath}`);

        // Phase 4: Update MongoDB
        console.log("\n🔄 Updating MongoDB records with new Clerk IDs...");

        for (const { oldId, newId, email } of userMapping) {
            if (oldId === newId) {
                continue; // In rare cases if they match, no update needed
            }

            console.log(`🔄 Processing MongoDB updates for ${email} (${oldId} -> ${newId})...`);

            // 1. Update User Collection
            const userResult = await User.updateMany({ clerkId: oldId }, { $set: { clerkId: newId } });
            if (userResult.modifiedCount > 0) console.log(`   - Updated ${userResult.modifiedCount} User document(s)`);

            // 2. Update Conversation Collection
            const convoResult = await Conversation.updateMany({ clerkId: oldId }, { $set: { clerkId: newId } });
            if (convoResult.modifiedCount > 0) console.log(`   - Updated ${convoResult.modifiedCount} Conversation document(s)`);

            // 3. Update AnalyticsEvent Collection
            const analyticsResult = await AnalyticsEvent.updateMany({ userId: oldId }, { $set: { userId: newId } });
            if (analyticsResult.modifiedCount > 0) console.log(`   - Updated ${analyticsResult.modifiedCount} AnalyticsEvent document(s)`);

            // 4. Update LiveAccessRequest Collection (userId and reviewedBy fields)
            const liveReqUserIdResult = await LiveAccessRequest.updateMany({ userId: oldId }, { $set: { userId: newId } });
            if (liveReqUserIdResult.modifiedCount > 0) console.log(`   - Updated ${liveReqUserIdResult.modifiedCount} LiveAccessRequest document(s) (userId)`);

            const liveReqReviewedByResult = await LiveAccessRequest.updateMany({ reviewedBy: oldId }, { $set: { reviewedBy: newId } });
            if (liveReqReviewedByResult.modifiedCount > 0) console.log(`   - Updated ${liveReqReviewedByResult.modifiedCount} LiveAccessRequest document(s) (reviewedBy admin)`);
        }

        console.log("\n🎉 Migration Complete! All user linkages have been updated to Production identifiers.");

    } catch (error) {
        console.error("💥 Migration failed fatally:", error);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 MongoDB Disconnected.");
        process.exit(0);
    }
}

runMigration();
