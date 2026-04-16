
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const UserSchema = new mongoose.Schema({
    clerkId: String,
    email: String,
    name: String,
    role: { type: String, default: 'parent' },
    features: {
        liveAccess: { type: Boolean, default: false },
        aiPremiumUntil: { type: Date, default: null }
    },
    processedPayments: [String]
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

const recoveries = [
    { email: 'kakul.alam@gmail.com', paymentId: 'pay_SZo3IOJHiUdmTC', name: 'Kakul Alam' },
    { email: 'burhanuddin110709@gmail.com', paymentId: 'pay_SZssJSe0SCP4t3', name: 'Burhanuddin' },
    { email: 'colombowalahussain@gmail.com', paymentId: 'pay_SZtSPPfD7KxGJ1', name: 'Colombo Wala Hussain' },
    { email: 'void@razorpay.com', paymentId: 'pay_Sb2flnai8Yrb1Z', name: 'Razorpay Test User' }
];

async function runRecovery() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB for Recovery");

        for (const item of recoveries) {
            console.log(`\nProcessing: ${item.email}...`);
            
            const result = await User.findOneAndUpdate(
                { email: item.email.toLowerCase() },
                {
                    $set: { 
                        "features.liveAccess": true,
                        role: 'parent',
                        name: item.name // Set name if possible
                    },
                    $addToSet: { processedPayments: item.paymentId }
                },
                { 
                    upsert: true, // Create if not exists!
                    new: true 
                }
            );

            console.log(`✅ Recovered: ${result.email} | Access: ${result.features.liveAccess} | Payment: ${result.processedPayments.slice(-1)}`);
        }

        await mongoose.disconnect();
        console.log("\n🚀 Recovery Complete.");
    } catch (e) {
        console.error("Recovery failed:", e);
    }
}

runRecovery();
