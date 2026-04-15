
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

async function audit() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const usersWithPayments = await User.find({ 
            processedPayments: { $exists: true, $not: { $size: 0 } } 
        });

        console.log(`\n--- ALL USERS WITH RECORDED PAYMENTS (${usersWithPayments.length}) ---`);
        usersWithPayments.forEach(u => {
            console.log(`- ${u.email} | ID: ${u._id} | Payments: ${u.processedPayments.join(', ')}`);
        });

        await mongoose.disconnect();
    } catch (e) {
        console.error("Audit failed:", e);
    }
}

audit();
