import mongoose from "mongoose";
import dotenv from "dotenv";
import JuzSubpart from "../src/models/JuzSubpart.js";

dotenv.config({ path: "./.env" });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:2017/imam";

const seedJuzSubparts = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB for seeding...");

        await JuzSubpart.deleteMany({}); // Clear existing

        const juzData = [];
        
        // Simulating the 30 Juz division
        // In a real scenario, we'd use exact ayah ranges, 
        // but for the skeleton, we'll divide Juz into 15 parts each.
        for (let j = 1; j <= 30; j++) {
            const parts = [];
            for (let p = 1; p <= 15; p++) {
                parts.push({
                    partNum: p,
                    startAyah: (p - 1) * 10 + 1, // Simplified placeholder logic
                    endAyah: p * 10,
                    surah: "Various", // Placeholder
                    description: `Juz ${j}, Part ${p}`,
                });
            }
            juzData.push({ juz: j, parts });
        }

        await JuzSubpart.insertMany(juzData);
        console.log("Successfully seeded 30 Juz with 15 parts each!");
        
        await mongoose.disconnect();
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
};

seedJuzSubparts();
