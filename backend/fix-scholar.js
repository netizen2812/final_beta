import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import LiveSession from './src/models/LiveSession.js';

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
console.log("Connected to MongoDB\n");

// Step 1: Delete the dummy scholar user
const deleted = await User.deleteOne({ clerkId: 'scholar_default_123' });
console.log("Step 1: Deleted dummy scholar:", deleted.deletedCount);

// Step 2: Fix the REAL scholar user's role
const realScholar = await User.findOneAndUpdate(
    { clerkId: 'user_39ng2YgbB5L3UgXVk3WDR3mRAV2' },
    { role: 'scholar', email: 'Scholar1.imam@gmail.com', name: 'Mualim' },
    { new: true }
);
console.log("Step 2: Updated real scholar:", realScholar?.clerkId, "role:", realScholar?.role, "_id:", realScholar?._id);

// Step 3: Update ALL live sessions to point to the REAL scholar's _id
if (realScholar) {
    const updated = await LiveSession.updateMany(
        {}, // Update all sessions
        { scholarId: realScholar._id }
    );
    console.log("Step 3: Updated", updated.modifiedCount, "sessions to use real scholar _id:", realScholar._id);
}

// Verify
console.log("\n=== VERIFICATION ===");
const users = await User.find({});
console.log("Users:");
users.forEach(u => console.log(`  ${u.email} | role: ${u.role} | clerkId: ${u.clerkId} | _id: ${u._id}`));

const sessions = await LiveSession.find({});
console.log("Sessions:");
sessions.forEach(s => console.log(`  ${s._id} | scholarId: ${s.scholarId} | status: ${s.status}`));

await mongoose.disconnect();
console.log("\nDone!");
