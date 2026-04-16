
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
    features: {
        liveAccess: { type: Boolean, default: false },
        aiPremiumUntil: { type: Date, default: null }
    },
    processedPayments: [String]
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);

const targets = [
    'kakul.alam@gmail.com',
    'burhanuddin110709@gmail.com',
    'colombowalahussain@gmail.com',
    'void@razorpay.com'
];

async function audit() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        for (const email of targets) {
            const user = await User.findOne({ email: email.toLowerCase() });
            if (user) {
                console.log(`\nFound User: ${email}`);
                console.log(`- ID: ${user._id}`);
                console.log(`- ClerkID: ${user.clerkId || 'MISSING'}`);
                console.log(`- Live Access: ${user.features?.liveAccess}`);
                console.log(`- Payments: ${user.processedPayments?.length ? user.processedPayments.join(', ') : 'NONE'}`);
                console.log(`- Created: ${user.createdAt}`);
            } else {
                console.log(`\n❌ User NOT FOUND in DB: ${email}`);
            }
        }

        await mongoose.disconnect();
    } catch (e) {
        console.error("Audit failed:", e);
    }
}

audit();
