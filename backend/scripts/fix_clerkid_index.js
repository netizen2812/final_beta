
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

async function fix() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const db = mongoose.connection.db;
        const users = db.collection('users');
        
        console.log("Dropping clerkId_1 index...");
        try {
            await users.dropIndex("clerkId_1");
            console.log("✅ Dropped index clerkId_1");
        } catch (e) {
            console.log("⚠️ Index probably doesn't exist or already dropped:", e.message);
        }

        console.log("Creating new sparse unique index on clerkId...");
        await users.createIndex({ clerkId: 1 }, { unique: true, sparse: true });
        console.log("✅ Created sparse unique index clerkId_1");

        await mongoose.disconnect();
    } catch (e) {
        console.error("Fix failed:", e);
    }
}

fix();
