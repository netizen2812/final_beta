import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
    try {
        console.log("Testing Gemini Flash Latest...");
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const result = await model.generateContent("Hello, are you working?");
        console.log("✅ Response:", result.response.text());
    } catch (error) {
        console.error("❌ Flash-001 Failed:", error.message);

        try {
            console.log("Testing Gemini-Pro...");
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent("Hello?");
            console.log("✅ Gemini-Pro Response:", result.response.text());
        } catch (e2) {
            console.error("❌ Gemini-Pro Failed:", e2.message);
        }
    }
}

test();
