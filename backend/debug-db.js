import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import LiveSession from './src/models/LiveSession.js';

dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
console.log("Connected to MongoDB\n");

// 1. Show ALL users
const users = await User.find({});
console.log("=== ALL USERS IN DATABASE ===");
users.forEach(u => {
    console.log(`  clerkId: ${u.clerkId}`);
    console.log(`  email:   ${u.email}`);
    console.log(`  name:    ${u.name}`);
    console.log(`  role:    ${u.role}`);
    console.log(`  _id:     ${u._id}`);
    console.log("  ---");
});

// 2. Show ALL live sessions
const sessions = await LiveSession.find({});
console.log("\n=== ALL LIVE SESSIONS ===");
sessions.forEach(s => {
    console.log(`  _id:       ${s._id}`);
    console.log(`  parentId:  ${s.parentId}`);
    console.log(`  childId:   ${s.childId}`);
    console.log(`  scholarId: ${s.scholarId}`);
    console.log(`  status:    ${s.status}`);
    console.log(`  surah:     ${s.currentSurah}, ayah: ${s.currentAyah}`);
    console.log("  ---");
});

// 3. Check if scholar exists with correct role
const scholar = await User.findOne({ email: "Scholar1.imam@gmail.com" });
console.log("\n=== SCHOLAR LOOKUP BY EMAIL ===");
if (scholar) {
    console.log("  Found! clerkId:", scholar.clerkId, "role:", scholar.role, "_id:", scholar._id);
} else {
    console.log("  NOT FOUND!");
}

// 4. Check known Clerk IDs from logs
const knownIds = ['user_39ng2YgbB5L3UgXVk3WDR3mRAV2', 'user_39lCJpjLeP917bCPshh8WlRnoJE'];
console.log("\n=== LOOKUP BY KNOWN CLERK IDS ===");
for (const id of knownIds) {
    const u = await User.findOne({ clerkId: id });
    console.log(`  ${id}: ${u ? `found (email: ${u.email}, role: ${u.role})` : 'NOT FOUND'}`);
}

await mongoose.disconnect();
console.log("\nDone!");
