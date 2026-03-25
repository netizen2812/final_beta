import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Child from './src/models/Child.js';
import Batch from './src/models/Batch.js';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI) {
    console.error("Missing MONGODB_URI in .env");
    process.exit(1);
}

const runReset = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected. Resetting student gamification data...");

        // 1. Reset all Child Profiles: 0 XP, Level 1, clear attendance
        const childUpdateRes = await Child.updateMany({}, {
            $set: {
                child_progress: [{
                    total_xp: 0,
                    level: 1,
                    badges: [],
                    streak_days: 0,
                    last_active_date: null,
                    total_sessions_attended: 0,
                    total_correct_recitations: 0
                }],
                attendance: []
            }
        });
        console.log(`Reset ${childUpdateRes.modifiedCount} child profiles to Level 1, 0 XP, and empty attendance.`);

        // 2. Reset all Batches to "upcoming" and clear their past data
        const batchUpdateRes = await Batch.updateMany({}, {
            $set: {
                status: 'upcoming',
                activeParticipants: [],
                activeChildId: null,
                activeSessionId: null,
                pastSessions: [],
                currentPromptAnswers: [],
                promptEvaluated: false
            }
        });
        console.log(`Reset ${batchUpdateRes.modifiedCount} batches back to 'upcoming' fresh state.`);

        console.log("Data reset complete. Exiting...");
        process.exit(0);

    } catch (err) {
        console.error("Error during reset:", err);
        process.exit(1);
    }
};

runReset();
