import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Models
import Batch from '../src/models/Batch.js';
import Child from '../src/models/Child.js';
import Session from '../src/models/Session.js';
import LiveScore from '../src/models/LiveScore.js';
import XPLog from '../src/models/XPLog.js';
import QuranProgress from '../src/models/QuranProgress.js';
import ChildActivity from '../src/models/ChildActivity.js';
import QuranAssignment from '../src/models/QuranAssignment.js';

// Load Env
dotenv.config({ path: path.join(__dirname, '../.env') });

async function resetTarbiyah() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error("MONGO_URI is not defined in .env");
        }

        console.log("🚀 Starting Total Tarbiyah Reset...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // 1. Reset Batches
        console.log("📦 Resetting Batches...");
        const batchResult = await Batch.updateMany({}, {
            $set: {
                status: 'upcoming',
                activeChildId: null,
                activeSessionId: null,
                currentPromptAnswers: [],
                promptEvaluated: false,
                pastSessions: [],
                activeParticipants: []
            }
        });
        console.log(`   - Updated ${batchResult.modifiedCount} batches.`);

        // 2. Reset Student Progress (XP, Level, etc.)
        console.log("🧒 Resetting Student Progress...");
        const childResult = await Child.updateMany({}, {
            $set: {
                "child_progress.0": {
                    total_xp: 0,
                    level: 1,
                    badges: [],
                    streak_days: 0,
                    last_active_date: null,
                    total_sessions_attended: 0,
                    total_correct_recitations: 0,
                    attendance: [],
                    completed_quran_parts: []
                }
            }
        });
        console.log(`   - Updated ${childResult.modifiedCount} student profiles.`);

        // 3. Purge Historical Data
        console.log("🗑️ Purging historical documents...");
        
        const sessionCount = await Session.deleteMany({});
        console.log(`   - Deleted ${sessionCount.deletedCount} sessions.`);

        const scoreCount = await LiveScore.deleteMany({});
        console.log(`   - Deleted ${scoreCount.deletedCount} live scores.`);

        const xpLogCount = await XPLog.deleteMany({});
        console.log(`   - Deleted ${xpLogCount.deletedCount} XP logs.`);

        const progressCount = await QuranProgress.deleteMany({});
        console.log(`   - Deleted ${progressCount.deletedCount} Quran progress records.`);

        const activityCount = await ChildActivity.deleteMany({});
        console.log(`   - Deleted ${activityCount.deletedCount} activity logs.`);

        const assignmentCount = await QuranAssignment.deleteMany({});
        console.log(`   - Deleted ${assignmentCount.deletedCount} assignments.`);

        console.log("\n✨ RESET COMPLETE. All Tarbiyah classes are now at 'Session 1' and all XP is 0.");
        process.exit(0);
    } catch (err) {
        console.error("❌ Reset failed:", err);
        process.exit(1);
    }
}

resetTarbiyah();
