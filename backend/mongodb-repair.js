import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Node SRV lookup issues in some environments
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGO_URI = 'mongodb+srv://netizen2812:Kks7q03F64560uPj@imamdb.h35re.mongodb.net/?appName=IMAMDB';

// Define the absolute minimum schemas with strict: false to allow fields to exist
const childSchema = new mongoose.Schema({
    parent_id: mongoose.Schema.Types.ObjectId,
    childUserId: mongoose.Schema.Types.ObjectId,
    name: String
}, { strict: false });

const userSchema = new mongoose.Schema({
    name: String,
    role: String,
    lastHeartbeat: Date,
    email: String
}, { strict: false });

const Child = mongoose.model('Child', childSchema);
const User = mongoose.model('User', userSchema);

async function repair() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected');

        const orphans = await Child.find({ $or: [{ parent_id: { $exists: false } }, { childUserId: { $exists: false } }] });
        const studentUsers = await User.find({ role: "student" });
        const recentlyActiveParents = await User.find({ role: "parent", lastHeartbeat: { $gt: new Date(Date.now() - 120 * 60 * 1000) } });

        console.log(`POOLS: Orphans=${orphans.length}, Students=${studentUsers.length}, ActiveParents=${recentlyActiveParents.length}`);

        for (const o of orphans) {
            console.log(`Processing orphan: ${o.name} (${o._id})`);
            const studentMatch = studentUsers.find(s => s.name === o.name);
            
            let updated = false;
            if (studentMatch && !o.childUserId) {
                o.childUserId = studentMatch._id;
                updated = true;
                console.log(`  Match found for student user: ${studentMatch._id}`);
            }

            if (recentlyActiveParents.length === 1 && !o.parent_id) {
                o.parent_id = recentlyActiveParents[0]._id;
                updated = true;
                console.log(`  Link restored to single active parent: ${recentlyActiveParents[0].email} (${recentlyActiveParents[0]._id})`);
            }

            if (updated) {
                o.markModified('childUserId');
                o.markModified('parent_id');
                await o.save();
                console.log(`  ✅ SAVED restoration for ${o.name}`);
            } else {
                console.log(`  ❌ Could not auto-restore links for ${o.name}`);
            }
        }

        console.log('--- REPAIR COMPLETE ---');
        process.exit(0);
    } catch (err) {
        console.error('Repair failed:', err);
        process.exit(1);
    }
}

repair();
