import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Fix for ESM __dirname in Node
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import using absolute path
const Batch = (await import('file:///C:/Users/acer/Downloads/FaithTech/FaithTech/backend/src/models/Batch.js')).default;

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const batches = await Batch.find({ name: /Advanced/i });
        console.log('--- ADVANCED BATCHES ---');
        batches.forEach(b => console.log(`ID: ${b._id}, Name: ${b.name}`));
        await mongoose.disconnect();
    } catch (e) {
        console.error(e);
    }
}
run();
