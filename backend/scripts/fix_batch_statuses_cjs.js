require('dotenv').config();
const mongoose = require('mongoose');

// Define a minimal Schema so we don't have to import the model file which uses ESM
const batchSchema = new mongoose.Schema({
    status: String,
    activeSessionId: String
});

const Batch = mongoose.model('Batch', batchSchema, 'batches');

async function fix() {
    try {
        if (!process.env.MONGO_URI) {
            console.error("MONGO_URI not found in environment");
            process.exit(1);
        }
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

fix();
