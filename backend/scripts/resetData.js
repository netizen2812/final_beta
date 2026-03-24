import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

import Child from "../src/models/Child.js";
import Batch from "../src/models/Batch.js";
import LiveScore from "../src/models/LiveScore.js";

const resetGamification = async () => {
    try {
        console.log("Connecting to MongoDB format:", process.env.MONGO_URI ? "Found URI" : "No URI");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB.");

        // Reset all Children Gamification Stats
        const childResult = await Child.updateMany({}, {
            $set: {
                "child_progress": [{
                    total_xp: 0,
                    level: 1,
                    badges: [],
                    streak_days: 0,
                    last_active_date: null,
                    total_sessions_attended: 0,
                    total_correct_recitations: 0
                }],
                "attendance": []
            }
        });
        console.log(`🧹 Reset GAMIFICATION and ATTENDANCE for ${childResult.modifiedCount} Children.`);

        // Wipe LiveScores (from previous sessions)
        await LiveScore.deleteMany({});
        console.log(`🧹 Wiped all LiveScore records.`);

        // Wipe Batch pastSessions so they restart from Journey of Light node 1
        const batchResult = await Batch.updateMany({}, {
            $set: {
                pastSessions: [],
                status: 'upcoming',
                activeSessionId: null,
                activeParticipants: [],
                currentPromptAnswers: [],
            }
        });
        console.log(`🧹 Reset ${batchResult.modifiedCount} Batches to start from Session 1.`);

        console.log("🎉 Reset Complete.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Reset Error:", error);
        process.exit(1);
    }
};

resetGamification();
