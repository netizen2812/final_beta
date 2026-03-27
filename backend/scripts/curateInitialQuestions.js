import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import { generateQuestionsForSubpart } from "../src/services/QuranQuestionService.js";

const curateInitialQuestions = async () => {
    try {
        const envPath = "c:/Users/acer/Downloads/FaithTech/FaithTech/backend/.env";
        dotenv.config({ path: envPath });
        
        const key = process.env.GEMINI_API_KEY;
        const MONGO_URI = process.env.MONGO_URI;
        
        if (!MONGO_URI) {
            console.error("❌ MONGO_URI not found in .env. Checking for MONGODB_URI fallback...");
            const fallbackUri = process.env.MONGODB_URI;
            if (!fallbackUri) throw new Error("No MongoDB URI found in .env file");
            await mongoose.connect(fallbackUri);
        } else {
            console.log("🔗 Connecting to MongoDB...");
            await mongoose.connect(MONGO_URI);
        }
        
        console.log("🚀 Starting AUTHENTIC AI Question Curation for All 30 Juz...");
        console.log("🔑 API Key check:", !!key);

        for (let juz = 1; juz <= 30; juz++) {
            for (let subpart = 1; subpart <= 15; subpart++) {
                console.log(`\n📦 Curating Juz ${juz}, Subpart ${subpart}...`);
                
                const success = await generateQuestionsForSubpart(juz, subpart, {}, key);
                
                if (success) {
                    console.log(`✅ Success for Juz ${juz}, Part ${subpart}`);
                } else {
                    console.log(`⚠️ Skip/Fail for Juz ${juz}, Part ${subpart}. Moving to next...`);
                }

                // Small delay to avoid hitting API rate limits too hard
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            console.log(`\n--- Completed Juz ${juz} ---\n`);
        }

        console.log("✨ All 30 Juz Curation Attempted!");
    } catch (err) {
        console.error("💥 Critical Execution Error:", err.message);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from MongoDB");
    }
};

curateInitialQuestions();
