import mongoose from "mongoose";
import dotenv from "dotenv";
import QuranQuestion from "../src/models/QuranQuestion.js";

const seedInitialQuestions = async () => {
    try {
        const envPath = "c:/Users/acer/Downloads/FaithTech/FaithTech/backend/.env";
        dotenv.config({ path: envPath });
        
        const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:2017/imam";
        await mongoose.connect(MONGO_URI);
        
        console.log("🚀 Seeding Mockup Questions for Juz 1...");

        const mockQuestions = [
            {
                juz: 1,
                subpart: 1,
                question: "Which Surah is known as 'The Opening'?",
                options: ["Al-Baqarah", "Al-Fatiha", "Al-Ikhlas", "An-Nas"],
                correctAnswer: 1,
                type: "MCQ"
            },
            {
                juz: 1,
                subpart: 1,
                question: "How many ayahs are in Surah Al-Fatiha?",
                options: ["5", "6", "7", "8"],
                correctAnswer: 2,
                type: "MCQ"
            },
            {
                juz: 1,
                subpart: 1,
                question: "Complete the Ayah: 'Ihdinas-siratal _______'",
                options: ["Mustaqim", "Alamin", "Rahim", "Malik"],
                correctAnswer: 0,
                type: "MCQ"
            }
        ];

        await QuranQuestion.deleteMany({ juz: 1, subpart: 1 });
        await QuranQuestion.insertMany(mockQuestions);
        
        console.log("✅ Successfully seeded mockup questions!");
    } catch (err) {
        console.error("💥 Seeding Error:", err.message);
    } finally {
        await mongoose.disconnect();
    }
};

seedInitialQuestions();
