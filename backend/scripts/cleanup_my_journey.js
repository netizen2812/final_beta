import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/models/User.js";
import Child from "../src/models/Child.js";
import Batch from "../src/models/Batch.js";
import Session from "../src/models/Session.js";

dotenv.config();

const cleanupMyJourney = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const myJourneyChildren = await Child.find({ name: "My Journey" });
        console.log(`Found ${myJourneyChildren.length} children named "My Journey".`);

        if (myJourneyChildren.length === 0) {
            console.log("Nothing to clean up.");
            process.exit(0);
        }

        const childIds = myJourneyChildren.map(c => c._id);
        const studentUserIds = myJourneyChildren.map(c => c.childUserId).filter(id => id != null);

        console.log(`Step 1: Removing "My Journey" references from Batches...`);
        const batchResult = await Batch.updateMany(
            {},
            { 
              $pull: { 
                students: { $in: childIds },
                activeParticipants: { childId: { $in: childIds } },
                currentPromptAnswers: { childId: { $in: childIds } }
              },
              $set: { activeChildId: null } // Reset active turn if it was a My Journey child
            }
        );
        console.log(`✅ Cleaned up student lists in ${batchResult.modifiedCount} batches.`);

        console.log(`Step 2: Removing "My Journey" references from Sessions...`);
        const sessionResult = await Session.updateMany(
            {},
            { $pull: { attendance: { childId: { $in: childIds } } } }
        );
        console.log(`✅ Cleaned up attendance in ${sessionResult.modifiedCount} sessions.`);

        console.log(`Step 3: Deleting Student User accounts (keeping Parents)...`);
        const userDeleteResult = await User.deleteMany({ _id: { $in: studentUserIds }, role: "student" });
        console.log(`✅ Deleted ${userDeleteResult.deletedCount} student user accounts.`);

        console.log(`Step 4: Deleting "My Journey" Child records...`);
        const childDeleteResult = await Child.deleteMany({ _id: { $in: childIds } });
        console.log(`✅ Deleted ${childDeleteResult.deletedCount} child records.`);

        console.log("\nCleanup successful! The platform is now free of generic 'My Journey' placeholders.");
        process.exit(0);
    } catch (error) {
        console.error("Cleanup failed:", error);
        process.exit(1);
    }
};

cleanupMyJourney();
