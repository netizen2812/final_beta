import mongoose from 'mongoose';
import Batch from './src/models/Batch.js';
import dotenv from 'dotenv';
dotenv.config();

async function fixBatchStatuses() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const result = await Batch.updateMany(
            { activeSessionId: null, status: 'active' },
            { $set: { status: 'upcoming' } }
        );

        console.log(`Updated ${result.modifiedCount} batches from 'active' to 'upcoming'`);
        process.exit(0);
    } catch (err) {
        console.error("Fix error:", err);
        process.exit(1);
    }
}

fixBatchStatuses();
