import { GoogleGenerativeAI } from "@google/generative-ai";

const testSDKTextOnly = async () => {
    const key = "AIzaSyArpcreraul4RRXnhn1n8lceEAa-nD00CQ";
    // Force v1 explicitly if possible, or just default
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
