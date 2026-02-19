import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";
import dotenv from 'dotenv';
import { getIslamicContext } from "./ragService.js";

dotenv.config();

// Configuration
const REQUIRED_KEY = process.env.GEMINI_API_KEY; // Strict check on boot
const PREFERRED_MODELS = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];
const TIMEOUT_MS = 10000; // 10 seconds

let activeModelName = null;
let genAI = null;

/* ============================= */
/* INITIALIZATION                */
/* ============================= */

export async function initializeAI() {
  if (!REQUIRED_KEY) {
    console.warn("⚠️  [AI SERVICE] GEMINI_API_KEY missing. AI features disabled.");
    return false;
  }

  // Initialize SDK
  genAI = new GoogleGenerativeAI(REQUIRED_KEY);

  // Dynamic Model Discovery
  try {
    console.log("🔍 [AI SERVICE] Discovering available models...");
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${REQUIRED_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Model list failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const availableModels = (data.models || [])
      .filter(m => m.supportedGenerationMethods.includes("generateContent"))
      .map(m => m.name.replace("models/", "")); // Start with bare name

    console.log(`📋 [AI SERVICE] Available: ${availableModels.join(", ")}`);

    // Select Best Match
    activeModelName = PREFERRED_MODELS.find(bg => availableModels.includes(bg)) || availableModels[0];

    if (activeModelName) {
      console.log(`✅ [AI SERVICE] Selected Model: ${activeModelName}`);
      return true;
    } else {
      console.error("❌ [AI SERVICE] No compatible text generation models found.");
      return false;
    }

  } catch (error) {
    console.error("❌ [AI SERVICE] Initialization Failed:", error.message);
    // Fallback if list fails but key might work
    activeModelName = "gemini-1.5-flash";
    console.log(`⚠️ [AI SERVICE] Fallback forced to: ${activeModelName}`);
    return true;
  }
}

/* ============================= */
/* CORE GENERATION               */
/* ============================= */

export async function generateImamResponse({
  prompt,
  madhab,
  mood,
  history,
}) {
  if (!genAI || !activeModelName) {
    throw new Error("AI Service not initialized or disabled.");
  }

  // Fetch Context via RAG
  let groundedContext = "";
  try {
    groundedContext = await getIslamicContext(prompt, madhab);
  } catch (err) {
    console.error("⚠️ [RAG] Context fetch failed, proceeding without it:", err.message);
  }

  const isFirstMessage = history.length === 0;

  const systemInstruction = `You are an AI Imam, a spiritual guide rooted in Islamic knowledge.

${isFirstMessage
      ? 'OPENING LINE: You MUST begin your response with: "I’m here to help, guided by the Quran, Sunnah, and your chosen school of thought."'
      : "Do NOT repeat the standard opening line."}

STRICT GUIDELINES:
1. **Source-Based**: Base your answers ONLY on the provided Context (Quran, Book) and general Islamic knowledge.
2. **Madhhab-Specific**: You must prioritize the ruling of the **${madhab}** school. If the provided text mentions it, USE IT.
3. **Uncertainty**: If the answer is not clear or requires a Fatwa, say "I cannot provide a specific fatwa on this. Please consult a local scholar. Allah knows best."
4. **Tone**: The user is feeling **${mood}**. Respond with a **${mood?.toLowerCase()}** and empathetic tone.

CONTEXT PROVIDED:
${groundedContext}

FORMATTING:
- Keep it concise (max 3-4 paragraphs).
- Use **Bold** for key terms.
- end with "Allah knows best."`;

  // Safe Wrapper with Retry
  return await safeGenerate(systemInstruction, history, prompt, 1);
}

/* ============================= */
/* HELPER: RETRY & TIMEOUT       */
/* ============================= */

async function safeGenerate(systemInstruction, history, prompt, retriesLeft) {
  try {
    // Timeout Promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Request timed out")), TIMEOUT_MS)
    );

    // Generation Promise
    const generatePromise = (async () => {
      const model = genAI.getGenerativeModel({
        model: activeModelName,
        systemInstruction: systemInstruction
      });

      const chat = model.startChat({
        history: history.map((h) => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.text }],
        })),
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        },
      });

      const result = await chat.sendMessage(prompt);
      const response = await result.response;
      return response.text();
    })();

    // Race
    return await Promise.race([generatePromise, timeoutPromise]);

  } catch (error) {
    logAIError(error, activeModelName, prompt.length);

    if (retriesLeft > 0 && isRetryable(error)) {
      console.log(`🔄 [AI SERVICE] Retrying... (${retriesLeft} left)`);
      return safeGenerate(systemInstruction, history, prompt, retriesLeft - 1);
    }

    throw error; // Propagate to controller for safe JSON response
  }
}

function isRetryable(error) {
  const msg = error.message.toLowerCase();
  return msg.includes("503") || msg.includes("timeout") || msg.includes("fetch failed");
}

function logAIError(error, model, promptLen) {
  console.error(JSON.stringify({
    event: "AI_ERROR",
    timestamp: new Date().toISOString(),
    model: model,
    promptLength: promptLen,
    errorMessage: error.message
  }));
}
