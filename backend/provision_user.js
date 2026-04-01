import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const userSchema = new mongoose.Schema({
    email: String,
    clerkId: String,
    role: String,
    features: { liveAccess: Boolean }
});

const User = mongoose.model('User', userSchema);

async function provisionVwaheedi() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const result = await User.findOneAndUpdate(
            { email: 'vwaheedi@gmail.com' },
            { 
                $set: { 
                    email: 'vwaheedi@gmail.com', 
                    role: 'parent', 
                    'features.liveAccess': true 
                },
                $setOnInsert: { 
                    clerkId: 'PENDING_SYNC_vwaheedi' 
                }
            },
            { upsert: true, new: true }
        );
        console.log(`Successfully provisioned vwaheedi@gmail.com with liveAccess: ${result.features.liveAccess}`);
        await mongoose.disconnect();
    } catch (err) {
        console.error("Provisioning failed:", err);
    }
}

provisionVwaheedi();
