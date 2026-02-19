import axios from "axios";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error("OPENROUTER_API_KEY missing");
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Stable high quality model
const MODEL = "openai/gpt-4o-mini";

export async function generateResponse(prompt, userId = "anonymous") {
  try {
    const response = await axios.post(
      OPENROUTER_URL,
      {
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a knowledgeable Islamic assistant grounded in Quran, Sunnah, and classical scholarship. Provide clear, respectful, madhab-aware answers."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.6
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
