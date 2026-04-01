import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { clerkClient } from '@clerk/clerk-sdk-node';
import fs from 'fs';

dotenv.config();

const userSchema = new mongoose.Schema({
    clerkId: String,
    email: String,
    role: String,
    features: { liveAccess: Boolean },
    processedPayments: [String]
});

const User = mongoose.model('User', userSchema);

async function manualSyncAndFix(email) {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to DB. Searching for ${email} in Clerk...`);
        
        // Find the user in Clerk by email
        const usersInClerk = await clerkClient.users.getUserList({
            emailAddress: [email]
        });

        if (!usersInClerk || usersInClerk.length === 0) {
            console.error(`User ${email} NOT FOUND in Clerk!`);
            fs.writeFileSync('manual_fix_result.txt', `User ${email} NOT FOUND in Clerk!`);
            return;
        }

        const clerkUser = usersInClerk[0];
        console.log(`Found clerk user: ${clerkUser.id} (${clerkUser.emailAddresses[0].emailAddress})`);

        // Update/Create in MongoDB
        const updatedUser = await User.findOneAndUpdate(
            { clerkId: clerkUser.id },
            {
                $set: {
                    email: clerkUser.emailAddresses[0].emailAddress.toLowerCase(),
                    clerkId: clerkUser.id,
                    role: 'parent',
                    "features.liveAccess": true
                },
                $addToSet: { processedPayments: "pay_SYFwHkgXM3ZAuz" }
            },
            { upsert: true, new: true }
        );

        console.log(`Successfully fixed user record: ${updatedUser.email}`);
        fs.writeFileSync('manual_fix_result.txt', `Successfully fixed user record: ${updatedUser.email}\nClerkID: ${updatedUser.clerkId}\nAccess: ${updatedUser.features.liveAccess}`);
        
        await mongoose.disconnect();
    } catch (err) {
        console.error("Manual fix failed:", err);
        fs.writeFileSync('manual_fix_result.txt', "Error: " + err.message);
    }
}

manualSyncAndFix('vwaheedi@gmail.com');
