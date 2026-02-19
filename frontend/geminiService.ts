import axios from "axios";
import { Madhab } from "./types";
import { useAuth } from "@clerk/clerk-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
console.log("🔌 API_BASE:", API_BASE);


export const identifyRecitation = async (
  base64Audio: string,
  getToken: () => Promise<string | null>
) => {
  try {
    const token = await getToken();

    const response = await axios.post(
      `${API_BASE}/api/recitation`,
      { base64Audio },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Recitation identification failed:", error);
    return null;
  }
};

/* ========================================= */
/* MAIN IMAM RESPONSE (BACKEND CALL)        */
/* ========================================= */

export const getImamResponse = async (
  prompt: string,
  madhab: Madhab,
  mood: string,
  history: { role: "user" | "model"; text: string }[],
  token: string | null,
  conversationId?: string
) => {
  try {
    const response = await axios.post(
      `${API_BASE}/api/chat`,
      {
        prompt,
        madhab,
        mood,
        history,
        conversationId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // PART 7: FRONTEND RESILIENCE
    // Handle "Hard Fail" 200 responses
    if (response.data.success === false) {
      return response.data.message || "I am currently meditating. Please try again in a moment.";
    }

    return response.data.reply || response.data.response;
  } catch (error: any) {
    console.error("Backend chat failed:", error);

    // Handle 429 (Rate Limit) or legacy 500s
    if (error.response?.data?.message) {
      return error.response.data.message;
    }

    // Fallback for network errors
    return "I am unable to connect to the server at the moment. Please check your connection.";
  }
};