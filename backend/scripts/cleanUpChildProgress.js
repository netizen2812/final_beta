import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const cleanUpChildProgress = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        console.log("Resetting all child_progress arrays across all children to 0...");

        const result = await mongoose.connection.db.collection('children').updateMany(
            {},
            { 
                $set: { 
                    "child_progress": [{
                        total_xp: 0,
                        level: 1,
                        badges: [],
                        streak_days: 0,
                        last_active_date: null,
                        total_sessions_attended: 0,
                        total_correct_recitations: 0,
                        attendance: []
                    }] 
                } 
            }
        );

        console.log(`✅ Success! Reset ${result.modifiedCount} child documents to 0 XP and Level 1.`);

        console.log("Also clearing old records in ChildActivity...");
        // This makes sure the Parent Dashboard doesn't show old activity hours either
        const activityResult = await mongoose.connection.db.collection('childactivities').deleteMany({});
        console.log(`✅ Wiped ${activityResult.deletedCount} old ChildActivity daily logs.`);

        console.log("Cleanup complete!");
        process.exit(0);
    } catch (error) {
        console.error("Error during cleanup:", error);
        process.exit(1);
    }
};

cleanUpChildProgress();
