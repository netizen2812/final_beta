import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const userSchema = new mongoose.Schema({
    clerkId: String,
    email: String,
    role: String,
    features: { liveAccess: Boolean },
    processedPayments: [String]
});

const User = mongoose.model('User', userSchema);

async function grantVajeehaAccess() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const result = await User.findOneAndUpdate(
            { clerkId: 'user_3Bl8mdqkW2aMbooqCEGE8PivqBz' },
            { 
                $set: { 
                    email: 'vwaheedi@gmail.com', 
                    role: 'parent', 
                    'features.liveAccess': true 
                },
                $addToSet: { 
                    processedPayments: 'pay_SYFwHkgXM3ZAuz' 
                }
            },
            { upsert: true, new: true }
        );
        console.log(`✅ Successfully granted paid access to Vajeeha Waheedi!`);
        console.log(`Clerk ID: ${result.clerkId}`);
        console.log(`Email: ${result.email}`);
        await mongoose.disconnect();
    } catch (err) {
        console.error("Granting access failed:", err);
    }
}

grantVajeehaAccess();
