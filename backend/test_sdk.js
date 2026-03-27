import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const testSDKTextOnly = async () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("❌ No API key found in .env");
        return;
    }
    const genAI = new GoogleGenerativeAI(key);
    
    try {
        console.log("🚀 Testing with standard 'gemini-1.5-flash'...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("hello");
        console.log("✅ Success! Response:", result.response.text());
    } catch (error) {
        console.error("❌ SDK Error:", error.message);
    }
};

testSDKTextOnly();
