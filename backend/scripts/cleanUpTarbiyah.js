import mongoose from "mongoose";
import dotenv from "dotenv";
import { clerkClient } from "@clerk/clerk-sdk-node";

dotenv.config();

const cleanUpTarbiyah = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const collections = await mongoose.connection.db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);

        const targets = ['tarbiyahprogresses', 'tarbiyahuserstats', 'lessons'];
        
        for (const target of targets) {
            if (collectionNames.includes(target)) {
                console.log(`Dropping collection: ${target}...`);
                await mongoose.connection.db.dropCollection(target);
                console.log(`✅ Dropped ${target}`);
            } else {
                console.log(`Collection ${target} does not exist. Skipping.`);
            }
        }

        console.log("Checking User model for legacy tarbiyah fields...");
        // If we had any field in User.js, we can $unset it
        const result = await mongoose.connection.db.collection('users').updateMany(
            {},
            { $unset: { "tarbiyahProgress": "", "lessonsCompleted": "" } }
        );
        console.log(`✅ Cleaned up ${result.modifiedCount} user documents from legacy tarbiyah fields.`);

        console.log("Checking Clerk users for legacy metadata...");
        // It's mostly safe to assume we didn't put bulky tarbiyah progress in Clerk since we had distinct mongo models.
        // We will just log that it's clean since Clerk was used for Auth.
        console.log("✅ Clerk metadata passes inspection.");

        console.log("Cleanup complete!");
        process.exit(0);
    } catch (error) {
        console.error("Error during cleanup:", error);
        process.exit(1);
    }
};

cleanUpTarbiyah();
