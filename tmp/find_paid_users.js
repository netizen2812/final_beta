import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const userSchema = new mongoose.Schema({
    clerkId: String,
    email: String,
    name: String,
    features: {
        liveAccess: Boolean,
        aiPremiumUntil: Date
    }
}, { collection: 'users' });

const User = mongoose.model('User', userSchema);

async function main() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const now = new Date();
        const paidUsers = await User.find({
            $or: [
                { 'features.liveAccess': true },
                { 'features.aiPremiumUntil': { $gt: now } }
            ]
        });
        
        console.log(`Found ${paidUsers.length} paid users.`);
        paidUsers.forEach(u => {
            console.log(`- ${u.name} (${u.email}) [Live Access: ${u.features?.liveAccess}, AI Premium: ${u.features?.aiPremiumUntil}]`);
        });

    } catch(e) {
        console.error("Error:", e);
    } finally {
        await mongoose.disconnect();
    }
}
main();
