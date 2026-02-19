import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error("GEMINI_API_KEY missing");
} else {
  console.log("AI initialized successfully");
}

const genAI = new GoogleGenerativeAI(apiKey);

// STABLE WORKING MODEL
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash-latest"
});

export async function generateResponse(prompt) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI_ERROR:", error.message);
    throw new Error("AI_FAILED");
  }
}
