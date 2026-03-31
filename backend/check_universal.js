import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const Child = (await import('./src/models/Child.js')).default;
        
        const childrenWithXP = await Child.find({"child_progress.0.total_xp": { $gt: 0 }});
        console.log(`Total children with XP: ${childrenWithXP.length}`);
        for (const c of childrenWithXP) {
            console.log(`- ${c.name}: ${c.child_progress[0].total_xp} XP`);
        }
        
        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
};

run();
