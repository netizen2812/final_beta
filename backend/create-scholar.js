import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

// Connect to database
await mongoose.connect(process.env.MONGO_URI);

console.log("Connected to MongoDB");

// Check if scholar exists
let scholar = await User.findOne({ email: 'Scholar1.imam@gmail.com' });

if (scholar) {
    console.log("Scholar already exists:", scholar);
} else {
    // Create the scholar user
    scholar = await User.create({
        clerkId: 'scholar_default_123', // Placeholder Clerk ID
        email: 'Scholar1.imam@gmail.com',
        name: 'Mualim',
        role: 'scholar'
    });
    console.log("✅ Scholar created successfully:", scholar);
}

await mongoose.disconnect();
console.log("Done!");
