import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGO_URI);
console.log("Connected to MongoDB");

const db = mongoose.connection.db;
const result = await db.collection('livesessions').deleteMany({});
console.log(`✅ Deleted ${result.deletedCount} stale live sessions`);

await mongoose.disconnect();
console.log("Done.");
