/**
 * fix_scholar_batch_link.js
 * 
 * Diagnoses and repairs the link between scholar1.imam@gmail.com's User record
 * and any batches that should be assigned to them.
 * 
 * Run: node --env-file=.env scripts/fix_scholar_batch_link.js
 * OR:  MONGO_URI=... node scripts/fix_scholar_batch_link.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// --- Inline models (avoid circular imports in script context) ---
const userSchema = new mongoose.Schema({
    clerkId: String,
    email: { type: String, lowercase: true, trim: true },
    name: String,
    role: String,
}, { timestamps: true });

const batchSchema = new mongoose.Schema({
    name: String,
    scholar: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    scholarEmail: { type: String, lowercase: true, trim: true },
    status: String,
    activeSessionId: String,
    pastSessions: Array,
    students: Array,
}, { timestamps: true, strict: false });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Batch = mongoose.models.Batch || mongoose.model('Batch', batchSchema);

const SCHOLAR_EMAIL = 'scholar1.imam@gmail.com';

async function diagnoseAndFix() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // 1. Find all User records for this scholar
    let users = await User.find({ 
        $or: [
            { email: SCHOLAR_EMAIL },
            { clerkId: { $regex: SCHOLAR_EMAIL } }
        ]
    });

    if (users.length === 0) {
        console.log(`\n👷 PROVISIONING: User record not found. Creating manual record for ${SCHOLAR_EMAIL}...`);
        const newUser = await User.create({
            email: SCHOLAR_EMAIL,
            clerkId: `scholar_placeholder_${SCHOLAR_EMAIL}`,
            name: "Scholar",
            role: "scholar"
        });
        users = [newUser];
        console.log(`  ✅ Created user _id: ${newUser._id}`);
    }

    console.log(`=== USER RECORDS for ${SCHOLAR_EMAIL} ===`);
    users.forEach(u => {
            console.log(`  _id: ${u._id}`);
            console.log(`  email: ${u.email}`);
            console.log(`  clerkId: ${u.clerkId}`);
            console.log(`  role: ${u.role}`);
            console.log(`  isPlaceholder: ${u.clerkId?.includes('scholar_placeholder') ? 'YES ⚠️' : 'NO ✅'}`);
            console.log('');
        });
    // 2. Find all batches – show their scholar field
    const allBatches = await Batch.find({});
    console.log(`\n=== ALL BATCHES (${allBatches.length} total) ===`);
    allBatches.forEach(b => {
        const isLinkedById = users.some(u => u._id.toString() === b.scholar?.toString());
        const isLinkedByEmail = b.scholarEmail === SCHOLAR_EMAIL;
        console.log(`  Batch: "${b.name}" (${b._id})`);
        console.log(`    scholar (ObjectId): ${b.scholar}`);
        console.log(`    scholarEmail: ${b.scholarEmail || '(not set)'}`);
        console.log(`    status: ${b.status}`);
        console.log(`    linked by _id: ${isLinkedById ? '✅ YES' : '❌ NO'}`);
        console.log(`    linked by email: ${isLinkedByEmail ? '✅ YES' : '❌ NO'}`);
        console.log('');
    });

    // 3. AUTO-FIX: Stamp scholarEmail on all batches whose scholar._id matches this user
    const primaryUser = users.find(u => !u.clerkId?.includes('scholar_placeholder')) || users[0];
    if (primaryUser) {
        const batchesToFix = allBatches.filter(b => 
            b.scholar?.toString() === primaryUser._id.toString() && 
            b.scholarEmail !== SCHOLAR_EMAIL
        );

        if (batchesToFix.length > 0) {
            console.log(`\n🔧 FIXING: Stamping scholarEmail on ${batchesToFix.length} batch(es)...`);
            for (const b of batchesToFix) {
                await Batch.updateOne({ _id: b._id }, { $set: { scholarEmail: SCHOLAR_EMAIL } });
                console.log(`  ✅ Fixed batch: "${b.name}"`);
            }
        } else {
            console.log('\n✅ All batches already have correct scholarEmail or are already linked by _id.');
        }

        // 4. If user clerkId is placeholder, warn
        if (primaryUser.clerkId?.includes('scholar_placeholder')) {
            console.log('\n⚠️  WARNING: Scholar user still has a placeholder clerkId!');
            console.log(`   clerkId: ${primaryUser.clerkId}`);
            console.log('   → The scholar MUST log in via the web app to get their real Clerk ID linked.');
            console.log('   → After login, syncUser will update clerkId automatically.');
        }
    }

    console.log('\n=== DIAGNOSIS COMPLETE ===');
    process.exit(0);
}

diagnoseAndFix().catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
});
