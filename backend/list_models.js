import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
    try {
        console.log("Listing models...");
        // The SDK might not expose listModels directly on genAI instance in all versions.
        // Usually it is genAI.getGenerativeModel... but looking for list.
        // If not available, we can try to fetch via REST using key.

        // Attempt REST call if SDK method is obscure
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();

        if (data.models) {
            console.log("Available Models:");
            data.models.forEach(m => console.log(`- ${m.name} (${m.supportedGenerationMethods})`));
        } else {
            console.log("No models found. Response Data:", JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error("List Models Failed:", error);
    }
}

listModels();
