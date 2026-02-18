import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";
import dotenv from 'dotenv'
dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ============================= */
/* FIQH CONTEXT                  */
/* ============================= */

const FIQH_BOOK_CONTEXT = {
  HANAFI: `Hanafi Principles: Primary sources are Quran, Sunnah, statements of Companions, consensus, analogy (Qiyaas), discretion (Istihsaan), then customs (Urf). Known for Hypothetical Fiqh and Istihsaan (departing from precedent for stronger reasons). Minimum menstruation 3 days, Maximum 10.`,

  MALIKI: `Maliki Principles: Prioritizes Quran, Sunnah, statements of Companions, and uniquely the Practice of People of Madina. Uses Masaalih Mursalah (public interest) and Sadd adh-dharaai (blocking means to forbidden acts). Prefers apparent Quranic text over single Hadith if not reinforced.`,

  SHAFI: `Shafi'i Principles: Quran and Sunnah have equal rank. Rejects tacit consensus; requires total scholar consensus. Rejects Istihsaan as subjective. Analogy (Qiyaas) is the sole method for ijtihaad when text is absent.`,

  HANBALI: `Hanbali Principles: Strictly based on Hadith. Prefers statements of Companions; if they differ, chooses closest to Quran/Sunnah. Prefers weak Hadith over analogy. Uses Istishab (presumption of continuity).`,
};

/* ============================= */
/* QURAN CONTEXT FETCH           */
/* ============================= */

async function fetchQuranicContext(query) {
  try {
    const response = await fetch(
      `https://api.alquran.cloud/v1/search/${encodeURIComponent(
        query
      )}/all/en.sahih`
    );

    const data = await response.json();

    if (
      data &&
      data.code === 200 &&
      data.data &&
      data.data.results &&
      data.data.results.length > 0
    ) {
      return data.data.results
        .slice(0, 3)
        .map(
          (r) =>
            `Quran ${r.surah.number}:${r.numberInSurah} - "${r.text}"`
        )
        .join("\n");
    }
  } catch (e) {
    console.error("Quran API error", e);
  }

  return "";
}


import { getIslamicContext } from "./ragService.js";

/* ============================= */
/* MAIN IMAM RESPONSE FUNCTION   */
/* ============================= */

export async function generateImamResponse({
  prompt,
  madhab,
  mood,
  history,
}) {
  // Fetch Context via RAG
  const groundedContext = await getIslamicContext(prompt, madhab);

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

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
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
    // console.log("Gemini response:", response.text());
    return response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
