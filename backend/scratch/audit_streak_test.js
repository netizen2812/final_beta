
import mongoose from 'mongoose';
const MONGO_URI = 'mongodb+srv://ramansingh:0vHu07PogDtsIhak@cluster0.odugkxm.mongodb.net/test?appName=IMAMDB';

async function audit() {
    try {
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection.db;
        
        console.log('Connected to:', mongoose.connection.name);

        const childColl = db.collection('children');
        const activityColl = db.collection('childactivities');

        const syed = await childColl.findOne({ name: 'Syed' });
        if (!syed) {
            console.log('Syed not found in test.children');
            const all = await childColl.find({}).toArray();
            console.log('Available children names:', all.map(a => a.name));
            return;
        }

        console.log('--- SYED DATA ---');
        console.log('ID:', syed._id);
        const progress = syed.child_progress?.[0] || {};
        console.log('Streak (DB):', progress.streak_days);
        console.log('Last Active:', progress.last_active_date);

        const recentActivities = await activityColl.find({ 
            child_id: syed._id,
            minutes_spent: { $gt: 0 }
        }).sort({ date: -1 }).limit(10).toArray();

        console.log('\n--- ACTIVITY LOG (Last 10 active days) ---');
        recentActivities.forEach(a => {
            console.log(`${a.date.toISOString().split('T')[0]} - ${a.minutes_spent} min`);
        });

        // Check for specific dates
        const today = new Date();
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }

        console.log('\n--- DAILY BREAKDOWN ---');
        for (const dateStr of dates) {
            const start = new Date(dateStr);
            start.setHours(0,0,0,0);
            const end = new Date(dateStr);
            end.setDate(end.getDate() + 1);
            end.setHours(0,0,0,0);
            
            const dayAct = await activityColl.findOne({
                child_id: syed._id,
                date: { $gte: start, $lt: end },
                minutes_spent: { $gt: 0 }
            });
            console.log(`${dateStr}: ${dayAct ? 'ACTIVE (' + dayAct.minutes_spent + 'm)' : 'INACTIVE'}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
audit();
