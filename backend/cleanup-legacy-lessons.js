import 'dotenv/config';
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error("Missing MONGO_URI in .env");
    process.exit(1);
}

async function cleanup() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected to MongoDB");
        const db = mongoose.connection.db;

        // 1. Drop ChildBadge collection (badges system)
        try {
            await db.dropCollection("childbadges");
            console.log("🗑️  Dropped: childbadges");
        } catch (e) { console.log("⚠️  childbadges not found (already clean)"); }

        // 2. Drop ChildActivity collection (legacy activity tracking)
        try {
            await db.dropCollection("childactivities");
            console.log("🗑️  Dropped: childactivities");
        } catch (e) { console.log("⚠️  childactivities not found (already clean)"); }

        // 3. Drop AccessRequest collection (legacy access request system)
        try {
            await db.dropCollection("accessrequests");
            console.log("🗑️  Dropped: accessrequests");
        } catch (e) { console.log("⚠️  accessrequests not found (already clean)"); }

        // 4. Clear lesson progress from Child documents
        // The child_progress array may have lesson-related data (quiz scores, lesson completions)
        const childrenResult = await db.collection("children").updateMany(
            {},
            { 
                $unset: { 
                    "lesson_progress": "",
                    "quiz_scores": "",
                    "completed_lessons": "",
                    "badges": "",
                    "daily_quests": ""
                }
            }
        );
        console.log(`🧹 Cleaned lesson fields from ${childrenResult.modifiedCount} child documents`);

        // 5. List all remaining collections for verification
        const collections = await db.listCollections().toArray();
        console.log("\n📋 Remaining collections:");
        for (const col of collections) {
            const count = await db.collection(col.name).countDocuments();
            console.log(`   ${col.name}: ${count} documents`);
        }

        console.log("\n✅ Legacy lesson/quiz/badge cleanup complete!");
    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

cleanup();
