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
        console.log("MongoDB connected.");
        
        const Child = (await import('./src/models/Child.js')).default;
        const Batch = (await import('./src/models/Batch.js')).default;
        const { awardXP } = await import("./src/services/gamificationService.js");

        const batchId = '699786283fddf2345971a2aa';
        const syedId = '69c97865a0aab991b223f273';
        const hafeezId = '69ca5eb272687d211b704e04';

        const batch = await Batch.findById(batchId);
        if (!batch) {
            console.log("Batch not found.");
            process.exit(0);
        }

        console.log(`Fixing Batch: ${batch.name}`);
        
        // 1. Mark Session 4 as ended if it's missing endedAt
        let fixCount = 0;
        batch.pastSessions.forEach(s => {
            if (!s.endedAt) {
                s.endedAt = new Date();
                fixCount++;
            }
        });
        
        // 2. Reset Batch status if it's "active" but no activeSessionId
        if (batch.status === 'active' && !batch.activeSessionId) {
            batch.status = 'upcoming';
            console.log("Reset batch status to upcoming");
        } else if (batch.status === 'active' && batch.activeSessionId) {
            // If it's active with an ID, we should probably end it now to clean up
            console.log("Ending active session " + batch.activeSessionId);
            const sess = batch.pastSessions.find(s => s.sessionId === batch.activeSessionId);
            if (sess) sess.endedAt = new Date();
            batch.activeSessionId = null;
            batch.status = 'upcoming';
            batch.activeParticipants = [];
        }

        batch.markModified('pastSessions');
        await batch.save();
        console.log(`Fixed ${fixCount} sessions.`);

        // 3. Award XP for 4 missed sessions (Session 1, 2, 3, 4)
        // Each session_complete = 2 XP
        const studentIds = [syedId, hafeezId];
        for (const childId of studentIds) {
            const child = await Child.findById(childId);
            const currentXP = (child.child_progress && child.child_progress[0]) ? child.child_progress[0].total_xp : 0;
            console.log(`Child: ${child.name}, Current XP: ${currentXP}`);
            
            if (currentXP < 8) { // 4 sessions * 2 XP
                console.log(`Awarding 8 XP to ${child.name}...`);
                await awardXP(childId, "session_complete", { points: 8 }); // Manually give 8 points
            }
        }

        console.log("Cleanup complete.");
        process.exit(0);
    } catch (e) {
        console.error("Error: " + e);
        process.exit(1);
    }
};

run();
