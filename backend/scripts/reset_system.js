import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/imam";

async function resetSystem() {
    try {
        console.log('🚀 Starting system reset...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;

        // 1. Wipe Collections
        const collectionsToClear = [
            'batches',
            'livescores',
            'sessions',
            'quranassignments',
            'quranprogresses',
            'childactivities',
            'childbadges',
            'airesponses',
            'analytics_events',
            'conversations'
        ];

        for (const collectionName of collectionsToClear) {
            const result = await db.collection(collectionName).deleteMany({});
            console.log(`🧹 Cleared collection: ${collectionName} (${result.deletedCount} documents)`);
        }

        // 2. Reset Student Progress (Total XP/Level)
        const childResult = await db.collection('children').updateMany(
            {},
            {
                $set: {
                    child_progress: [{
                        level: 1,
                        total_xp: 0,
                        current_xp: 0,
                        streak_days: 0,
                        last_activity: new Date()
                    }],
                    daily_xp_history: []
                }
            }
        );
        console.log(`👶 Reset progress for ${childResult.matchedCount} students`);

        // 3. Optional: Reset User context (Hearbeats)
        await db.collection('users').updateMany(
            {},
            { $set: { lastHeartbeat: new Date(0) } }
        );
        console.log('👤 Reset user heartbeats');

        console.log('\n✨ SYSTEM RESET COMPLETE ✨');
        console.log('All historical class, batch, and XP data has been wiped.');
        
        await mongoose.disconnect();
        process.exit(0);

    } catch (error) {
        console.error('❌ Reset failed:', error);
        process.exit(1);
    }
}

resetSystem();
