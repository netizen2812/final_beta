import axios from 'axios';
import dotenv from "dotenv";
dotenv.config();

const testGemini = async () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error("❌ No API key found in .env");
        return;
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
    
    try {
        console.log("🚀 Testing Gemini with Header + URL key...");
        const response = await axios.post(url, 
            {
                contents: [{ parts: [{ text: "Say hello" }] }]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': key
                }
            }
        );
        console.log("✅ Success! Response:", response.data.candidates[0].content.parts[0].text);
    } catch (error) {
        console.error("❌ Error Status:", error.response?.status);
        console.error("❌ Error Body:", JSON.stringify(error.response?.data, null, 2));
    }
};

testGemini();
