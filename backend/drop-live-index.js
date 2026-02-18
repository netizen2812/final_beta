import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
console.log("Connected to MongoDB");

const db = mongoose.connection.db;
const collection = db.collection('livesessions');

// List current indexes
const indexes = await collection.indexes();
console.log("Current indexes:", indexes.map(i => i.name));

// Drop the stale sessionId_1 index if it exists
try {
    await collection.dropIndex('sessionId_1');
    console.log("✅ Dropped stale index: sessionId_1");
} catch (err) {
    if (err.code === 27) {
        console.log("ℹ️ Index sessionId_1 does not exist — nothing to drop.");
    } else {
        console.error("❌ Error dropping index:", err.message);
    }
}

// Verify
const remaining = await collection.indexes();
console.log("Remaining indexes:", remaining.map(i => i.name));

await mongoose.disconnect();
console.log("Done.");
