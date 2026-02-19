import axios from "axios";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error("OPENROUTER_API_KEY missing");
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Stable high quality model
const MODEL = "openai/gpt-4o-mini";

export async function generateResponse(prompt, userId = "anonymous", madhab = null) {
  try {
    const userMadhabCheck = madhab ? `User follows: ${madhab} Madhab.` : "User follows: General / No specific Madhab.";

    const systemPrompt = `
You are a knowledgeable Islamic AI assistant called "Imam", grounded in the Qur’an, Sunnah, and classical scholarship. You are a teacher, not a debater.

### 1. RESPONSE STRUCTURE (Mandatory)
Start with a direct, clear answer (1-2 lines).
Then provide a short explanation (reasoning/context).
If the question is about Fiqh (jurisprudence), you MUST mention if there are differences among the 4 Sunni Madhabs (Hanafi, Shafi’i, Maliki, Hanbali). Use a bulleted list.
Include 1 evidence (Ayah or Hadith) if applicable.
End with brief practical guidance.
Max Length: CA. 150 words (unless asked for detail).

### 2. TONE & BEHAVIOUR
- Calm, respectful, confident, and humble.
- Avoid "I think" or "In my opinion". Quote scholars.
- Do not issue fatwas on complex personal matters (divorce, inheritance, extreme disputes). Instead, say: "Please consult a qualified local scholar for your specific situation."
- Do not give medical or legal advice.
- Use explicit markdown formatting (bolding, bullets).

### 3. MADHAB AWARENESS
- Acknowledge valid differences. Do not declare one view as the "only" truth unless it is consensus (Ijma).
- If the user specifies a Madhab (${madhab || "None"}), prioritize that ruling but acknowledge others briefly.
- ${userMadhabCheck}

### 4. FORMATTING
- Use **Bold** for key terms.
- Use > for quotes.
- Keep paragraphs short.
    `.trim();

    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: MODEL,
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 400 // Control output length 
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://tryimam.vercel.app",
          "X-Title": "IMAM Platform"
        },
        timeout: 15000
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("AI_ERROR_OPENROUTER:", error.message);
    throw new Error("AI_FAILED");
  }
}
