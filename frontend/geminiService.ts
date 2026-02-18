import axios from "axios";
import { Madhab } from "./types";
import { useAuth } from "@clerk/clerk-react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";


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

    return response.data.response;
  } catch (error) {
    console.error("Backend chat failed:", error);
    return "I am reflecting on this. Allah knows best.";
  }
};