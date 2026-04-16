import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Child from '../src/models/Child.js';

const MONGO_URI = "mongodb+srv://ramansingh:0vHu07PogDtsIhak@cluster0.odugkxm.mongodb.net/?appName=IMAMDB";

async function cleanup() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB");

        const parent = await User.findOne({ email: "kakul.alam@gmail.com" });
        if (!parent) {
            console.log("Parent not found");
            process.exit(0);
        }

        console.log(`Found parent: ${parent._id} (${parent.email})`);

        // Find all "My Journey" children for this parent
        const duplicates = await Child.find({ 
            parent_id: parent._id, 
            name: "My Journey" 
        });

        console.log(`Found ${duplicates.length} profiles to clean up.`);

        for (const child of duplicates) {
            console.log(`Processing child: ${child._id}`);
            
            // Delete associated user record for the child
            if (child.childUserId) {
                await User.findByIdAndDelete(child.childUserId);
                console.log(`  Deleted linked User record: ${child.childUserId}`);
            }
            
            // Delete the child record itself
            await Child.findByIdAndDelete(child._id);
            console.log(`  Deleted Child record: ${child._id}`);
        }

        console.log("\nCleanup successfully completed for Kakul Alam.");
    } catch (err) {
        console.error("Cleanup failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

cleanup();
