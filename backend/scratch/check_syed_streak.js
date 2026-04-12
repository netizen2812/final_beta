
import mongoose from 'mongoose';
const MONGO_URI = 'mongodb+srv://ramansingh:0vHu07PogDtsIhak@cluster0.odugkxm.mongodb.net/Tarbiyah?appName=IMAMDB';

async function checkStreak() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const Child = mongoose.model('Child', new mongoose.Schema({
            name: String,
            child_progress: [mongoose.Schema.Types.Mixed]
        }));

        const ChildActivity = mongoose.model('ChildActivity', new mongoose.Schema({
            child_id: mongoose.Schema.Types.ObjectId,
            date: Date,
            minutes_spent: Number
        }), 'childactivities');

        const syed = await Child.findOne({ name: 'Syed' });
        if (!syed) {
            console.log('Syed not found');
            return;
        }

        console.log('Syed Progress:', JSON.stringify(syed.child_progress[0], null, 2));

        const activities = await ChildActivity.find({ 
            child_id: syed._id,
            minutes_spent: { $gt: 0 }
        }).sort({ date: -1 }).limit(10);

        console.log('Recent Activity:');
        activities.forEach(a => {
            console.log(`${a.date.toISOString()} - ${a.minutes_spent} minutes`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkStreak();
