import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const logFile = path.join(__dirname, 'output.log');
fs.writeFileSync(logFile, ''); // clear

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        log("MongoDB connected.");
    } catch (err) {
        log("Mongo Error: " + err);
        process.exit(1);
    }
};

const run = async () => {
    try {
        await connectDB();
        
        const User = (await import('./src/models/User.js')).default;
        const Child = (await import('./src/models/Child.js')).default;
        const Batch = (await import('./src/models/Batch.js')).default;

        // 1. Find User
        const user = await User.findOne({ email: 'sarthakjuneja1999@gmail.com' });
        if (!user) {
            log("User not found.");
            process.exit(0);
        }
        log(`User found: ${user.name} (${user.email}), ID: ${user._id}`);

        // 2. Find Children
        const children = await Child.find({ parent_id: user._id });
        log(`\nFound ${children.length} children for this user:`);
        for (const child of children) {
            log(`- Child: ${child.name}, ID: ${child._id}, Total XP: ${child.total_xp || 0}, Level: ${child.level || 1}`);
        }

        // 3. Find Batch
        const allBatches = await Batch.find({});
        log(`\nTotal Batches in system: ${allBatches.length}`);
        
        for (const batch of allBatches) {
            const hasChild = batch.students.some(sId => children.some(c => c._id.toString() === sId.toString()));
            if (hasChild || batch.name.includes("Batch 1") || batch.name.toLowerCase() === "batch 1") {
                log(`\nBatch: ${batch.name} (ID: ${batch._id})`);
                log(`- Status: ${batch.status}`);
                log(`- Enrolled Students: ${batch.students.length}`);
                log(`- Past Sessions length: ${batch.pastSessions ? batch.pastSessions.length : 0}`);
                
                // Check if any of our children attended
                if (batch.pastSessions && batch.pastSessions.length > 0) {
                    batch.pastSessions.forEach((sess, i) => {
                        const attendedChildrenIds = sess.attendedChildren.map(id => id.toString());
                        const myChildrenAttended = children.filter(c => attendedChildrenIds.includes(c._id.toString()));
                        log(`  Session ${i + 1} (${sess.startedAt}): ${sess.attendedChildren.length} total attended. My children attended: ${myChildrenAttended.map(c => c.name).join(', ') || 'None'}`);
                    });
                }
            }
        }
    } catch (e) {
        log("Global Error: " + e.stack);
    }
    process.exit(0);
};

run();
