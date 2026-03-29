import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from one level up (backend roots)
dotenv.config({ path: path.join(__dirname, '../.env') });

import Child from '../src/models/Child.js';
import ChildActivity from '../src/models/ChildActivity.js';
import ChildBadge from '../src/models/ChildBadge.js';
import ChildSettings from '../src/models/ChildSettings.js';
import LiveScore from '../src/models/LiveScore.js';
import QuranAssignment from '../src/models/QuranAssignment.js';
import QuranProgress from '../src/models/QuranProgress.js';
import Batch from '../src/models/Batch.js';

const resetData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected ✅');

        console.log('Deleting Child profiles...');
        await Child.deleteMany({});
        
        console.log('Deleting Child Activities...');
        await ChildActivity.deleteMany({});
        
        console.log('Deleting Child Badges...');
        await ChildBadge.deleteMany({});
        
        console.log('Deleting Child Settings...');
        await ChildSettings.deleteMany({});
        
        console.log('Deleting Live Scores...');
        await LiveScore.deleteMany({});
        
        console.log('Deleting Quran Assignments...');
        await QuranAssignment.deleteMany({});
        
        console.log('Deleting Quran Progress...');
        await QuranProgress.deleteMany({});

        console.log('Clearing student lists from all Batches...');
        await Batch.updateMany({}, { 
            $set: { 
                students: [], 
                activeParticipants: [],
                activeChildId: null,
                currentPromptAnswers: []
            } 
        });

        console.log('HARD RESET COMPLETED SUCCESSFULLY 🚀');
        process.exit(0);
    } catch (error) {
        console.error('Error during reset:', error);
        process.exit(1);
    }
};

resetData();
