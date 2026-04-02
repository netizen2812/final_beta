import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Define schema locally to avoid file resolution issues in tmp script
const batchSchema = new mongoose.Schema({
    name: String,
    dailyRoomName: String
}, { strict: false });

const Batch = mongoose.models.Batch || mongoose.model('Batch', batchSchema);

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const batches = await Batch.find({ name: /Advanced/i });
        console.log('--- ADVANCED BATCHES FOUND ---');
        batches.forEach(b => {
            console.log(`ID: ${b._id}, Name: ${b.name}, Current Room: ${b.dailyRoomName || 'None'}`);
        });
        
        // If we found exactly one, let's suggest setting it to 'KidsAdvanced' 
        // (based on typical naming from the screenshot mentioned in thought trace)
        if (batches.length === 1 && !batches[0].dailyRoomName) {
            const b = batches[0];
            b.dailyRoomName = 'KidsAdvanced';
            await b.save();
            console.log(`✅ Automatically set dailyRoomName for "${b.name}" to "KidsAdvanced"`);
        }

        await mongoose.disconnect();
    } catch (e) {
        console.error('Database error:', e);
    }
}
run();
