
import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend root (one level up from src)
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log("API Key present:", !!process.env.GEMINI_API_KEY);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


async function test() {
  try {
    console.log("Listing models options...");
    // Try to find a list method if possible, or just try variations
    const models = ["gemini-1.5-flash", "gemini-1.5-flash-001", "models/gemini-1.5-flash", "gemini-2.0-flash-exp"];
    
    for (const modelName of models) {
        console.log(`Testing model: ${modelName}`);
        try {
            const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ role: "user", parts: [{ text: "Hello" }] }],
            });
            console.log(`Success with ${modelName}:`, response);
            break; 
        } catch (e) {
            console.log(`Failed with ${modelName}: ${e.message}`);
             if (e.status) console.log(`Status: ${e.status}`);
        }
    }

  } catch (error) {
    console.error("Global Error:", error);
  }
}

test();

