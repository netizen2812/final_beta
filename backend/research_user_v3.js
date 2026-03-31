import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://imamapp:imamapp2025@imamdb.7un6p.mongodb.net/imamapp?retryWrites=true&w=majority";

async function checkSykes() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;

    const child = await db.collection('children').findOne({ name: /Syed/i });
    console.log("Child Profile:", JSON.stringify(child, null, 2));

    if (child) {
        const activities = await db.collection('childactivities').find({ child_id: child._id }).toArray();
        console.log("Activities Found:", activities.length);
        activities.forEach(a => console.log(`- ${a.date.toDateString()}: ${a.minutes_spent}min, ${a.sessions_attended} sessions`));
        
        const sessions = await db.collection('livesessions').find({ attendedChildren: child._id.toString() }).toArray();
        console.log("Joined Sessions Found:", sessions.length);
    }

    await mongoose.disconnect();
}

checkSykes();
