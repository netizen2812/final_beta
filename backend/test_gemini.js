import axios from 'axios';

const testGemini = async () => {
    const key = "AIzaSyDDuduvku2U0OPOJRayt7mD6Hc4n01Q3nI";
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
