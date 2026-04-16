
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        const users = db.collection('users');
        
        const countMissing = await users.countDocuments({ clerkId: { $exists: false } });
        const countNull = await users.countDocuments({ clerkId: null });
        
        console.log(`Users missing clerkId: ${countMissing}`);
        console.log(`Users with clerkId as null: ${countNull}`);

        const indexes = await users.indexes();
        console.log("\nIndexes on users collection:");
        console.log(JSON.stringify(indexes, null, 2));

        await mongoose.disconnect();
    } catch (e) {
        console.error("Check failed:", e);
    }
}

check();
