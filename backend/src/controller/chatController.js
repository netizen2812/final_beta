import { generateImamResponse } from "../services/aiService.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import { trackEvent } from "../services/analyticsService.js";

export const chatWithImam = async (req, res) => {
  try {
    const { prompt, madhab, mood, history, conversationId } = req.body;
    const clerkId = req.auth?.sub;

    if (!clerkId) {
      console.log("❌ Chat Request: Missing req.auth.sub");
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
      // Don't update lastChatDate yet, wait for successful message
    }

    // STRICT LIMIT: Allow max 3 messages
    if (user.dailyChatCount >= 3) {
      // Log attempted breach
      trackEvent(clerkId, 'CHAT_LIMIT_REACHED', { attemptedAt: new Date() });

      return res.json({
        response: "I apologize, but to ensure I can help everyone, I am limited to 3 questions per day. Please come back tomorrow, Insha'Allah.",
      });
    }

    // 3. Generate AI Response
    const response = await generateImamResponse({
      prompt,
      madhab,
      mood,
      history: history || [],
    });

    // 4. Increment Count & Track
    user.dailyChatCount += 1;
    user.lastChatDate = new Date();
    await user.save();

    // Track successful chat
    trackEvent(clerkId, 'CHAT_MESSAGE_SENT', {
      promptLength: prompt.length,
      dailyCount: user.dailyChatCount,
      madhab
    });

    // 5. Persist messages to conversation (non-blocking — don't fail the response if DB write fails)
    if (conversationId) {
      try {
        const conversation = await Conversation.findOne({ _id: conversationId, clerkId });
        if (conversation) {
          const isFirstMessage = conversation.messages.length === 0;

          conversation.messages.push({ role: "user", content: prompt, timestamp: new Date() });
          conversation.messages.push({ role: "model", content: response, timestamp: new Date() });

          // Auto-title from first message
          if (isFirstMessage) {
            conversation.title = prompt.slice(0, 60).trim() + (prompt.length > 60 ? "…" : "");
            trackEvent(clerkId, 'CONVERSATION_STARTED', { conversationId });
          }

          await conversation.save();
        }
      } catch (dbErr) {
        console.error("Conversation save error (non-fatal):", dbErr);
      }
    }

    console.log(`Chat processed for ${user.name}. Count: ${user.dailyChatCount}`);
    res.json({ response });
  } catch (error) {
    console.error("Chat error:", error);
    if (error.message?.includes("429") || error.message?.includes("Quota")) {
      return res.status(429).json({ message: "Daily AI limit reached. Please try again tomorrow." });
    }
    res.status(500).json({ message: "AI processing failed. Please try again." });
  }
};
