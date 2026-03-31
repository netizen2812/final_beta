import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const logFile = path.join(__dirname, 'output_v2.log');
fs.writeFileSync(logFile, ''); // clear

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        log("MongoDB connected.");
        
        const Child = (await import('./src/models/Child.js')).default;
        const Batch = (await import('./src/models/Batch.js')).default;

        // 1. Get Batch 1
        const batch = await Batch.findOne({ name: /Batch 1/i });
        if (!batch) {
            log("Batch 1 not found.");
            process.exit(0);
        }
        log(`Batch: ${batch.name} (ID: ${batch._id})`);
        log(`- Status: ${batch.status}`);
        log(`- Total Students: ${batch.students.length}`);
        log(`- Past Sessions: ${batch.pastSessions.length}`);

        // 2. Check each session's endedAt and attendance
        for (let i = 0; i < batch.pastSessions.length; i++) {
            const s = batch.pastSessions[i];
            log(`  Session ${i+1}: EndedAt: ${s.endedAt}, AttendedCount: ${s.attendedChildren.length}`);
        }

        // 3. Check all students in this batch
        const students = await Child.find({ _id: { $in: batch.students } });
        log(`\nStudents in Batch:`);
        for (const s of students) {
            log(`- Name: ${s.name}, XP: ${s.total_xp}, ID: ${s._id}`);
        }

    } catch (e) {
        log("Global Error: " + e.stack);
    }
    process.exit(0);
};

run();
