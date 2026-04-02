import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const batchSchema = new mongoose.Schema({
    name: String,
    dailyRoomName: String
}, { strict: false });

const Batch = mongoose.models.Batch || mongoose.model('Batch', batchSchema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const batches = await Batch.find({});
        console.log('--- ALL BATCHES ---');
        batches.forEach(b => {
            console.log(`ID: ${b._id}, Name: ${b.name}, Room: ${b.dailyRoomName || 'None'}`);
        });
        await mongoose.disconnect();
    } catch (e) {
        console.error('Database error:', e);
    }
}
run();
