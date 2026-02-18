import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Connect to database
await mongoose.connect(process.env.MONGO_URI);

console.log("Connected to MongoDB");

// Update all users with uppercase PARENT to lowercase parent
const result = await mongoose.connection.db.collection('users').updateMany(
    { role: 'PARENT' },
    { $set: { role: 'parent' } }
);

console.log(`Updated ${result.modifiedCount} users from PARENT to parent`);

// Also check for SCHOLAR
const result2 = await mongoose.connection.db.collection('users').updateMany(
    { role: 'SCHOLAR' },
    { $set: { role: 'scholar' } }
);

console.log(`Updated ${result2.modifiedCount} users from SCHOLAR to scholar`);

await mongoose.disconnect();
console.log("Done!");
