import { generateResponse } from "../services/aiService.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import AiResponse from "../models/AiResponse.js";
import { trackEvent } from "../services/analyticsService.js";

export const chatWithImam = async (req, res) => {
  try {
    const { prompt, history, conversationId, madhab, language } = req.body;
    const clerkId = req.auth?.userId;

    if (!clerkId) {
      console.log("❌ Chat Request: Missing req.auth.userId");
      return res.status(401).json({ message: "Unauthorized: No User ID" });
    }
    console.log(`✅ Chat Request Authenticated for User: ${clerkId}`);

    // 1. Fetch User to check Rate Limit
    let user = await User.findOne({ clerkId });
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2. Check & Reset Rate Limit
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    const lastChatDate = user.lastChatDate ? new Date(user.lastChatDate) : new Date(0);
    const lastChatDay = new Date(lastChatDate);
    lastChatDay.setHours(0, 0, 0, 0); // Normalize last chat to start of day

    // If last chat was BEFORE today (midnight passed), reset count
    if (lastChatDay.getTime() < today.getTime()) {
      user.dailyChatCount = 0;
    }

    // STRICT LIMIT: Allow max 6 messages
    const isPremium = user.features && user.features.aiPremiumUntil && new Date(user.features.aiPremiumUntil) > new Date();

    if (!isPremium && user.dailyChatCount >= 6) {
      trackEvent(clerkId, 'CHAT_LIMIT_REACHED', { attemptedAt: new Date() });
      return res.json({
        success: false,
        message: "PAYWALL_TRIGGER",
        reply: "Daily limit reached."
      });
    }

    // 3. Check AI Response Cache
    const normalizedPrompt = prompt.trim().toLowerCase();
    const userLang = language || 'en';
    try {
      const cached = await AiResponse.findOne({
        question: normalizedPrompt,
        language: userLang,
        madhab: madhab || 'General'
      });
      if (cached) {
        console.log(`Cache hit for: "${normalizedPrompt.substring(0, 30)}..." [${userLang}]`);
        // Still count messages and persist
        user.dailyChatCount += 1;
        user.lastChatDate = new Date();
        await user.save();

        if (conversationId) {
          try {
            const conversation = await Conversation.findOne({ _id: conversationId, clerkId });
            if (conversation) {
              conversation.messages.push({ role: "user", content: prompt, timestamp: new Date() });
              conversation.messages.push({ role: "model", content: cached.answer, timestamp: new Date() });
              if (conversation.messages.length <= 2) {
                conversation.title = prompt.substring(0, 50) + (prompt.length > 50 ? "..." : "");
              }
              await conversation.save();
            }
          } catch (dbErr) {
            console.error("Conversation save error (non-fatal):", dbErr);
          }
        }

        return res.json({ success: true, reply: cached.answer });
      }
    } catch (cacheErr) {
      console.warn("Cache lookup failed (non-fatal):", cacheErr);
    }

    // 4. Generate AI Response (no cache hit)
    // Use OpenRouter Service with RAG Context
    let context = "";
    try {
      const { getIslamicContext } = await import("../services/ragService.js");
      context = await getIslamicContext(prompt, madhab);
    } catch (ragErr) {
      console.warn("RAG Context retrieval failed:", ragErr);
    }

    // Keep only the last 4 messages (2 interactions) to save inference cost
    const recentHistory = Array.isArray(history) ? history.slice(-4) : [];

    const reply = await generateResponse(prompt, clerkId, madhab, context, userLang, recentHistory);

    // 5. Store in cache
    try {
      await AiResponse.create({
        question: normalizedPrompt,
        language: userLang,
        madhab: madhab || 'General',
        answer: reply
      });
    } catch (cacheStoreErr) {
      console.warn("Cache store failed (non-fatal):", cacheStoreErr);
    }

    // 6. Increment Count & Track
    user.dailyChatCount += 1;
    user.lastChatDate = new Date();
    await user.save();

    trackEvent(clerkId, 'CHAT_MESSAGE_SENT', {
      promptLength: prompt.length,
      dailyCount: user.dailyChatCount,
      madhab: madhab
    });

    // 7. Persist messages
    if (conversationId) {
      try {
        const conversation = await Conversation.findOne({ _id: conversationId, clerkId });
        if (conversation) {
          conversation.messages.push({ role: "user", content: prompt, timestamp: new Date() });
          conversation.messages.push({ role: "model", content: reply, timestamp: new Date() });

          // Auto-generate title from first message
          if (conversation.messages.length <= 2) {
            conversation.title = prompt.substring(0, 50) + (prompt.length > 50 ? "..." : "");
          }

          await conversation.save();
        }
      } catch (dbErr) {
        console.error("Conversation save error (non-fatal):", dbErr);
      }
    }

    console.log(`Chat processed for ${user.name}. Count: ${user.dailyChatCount}`);

    // STEP 3 — CHAT CONTROLLER MUST HANDLE FAILURE
    return res.json({ success: true, reply });

  } catch (error) {
    console.error("🔥 [CHAT CONTROLLER CAUGHT ERROR]:", error.message);

    // Never return 500. Return success: false
    return res.json({
      success: false,
      message: "AI temporarily unavailable. Please try again."
    });
  }
};
