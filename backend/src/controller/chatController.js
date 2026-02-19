import { generateResponse } from "../services/aiService.js";
import User from "../models/User.js";
import Conversation from "../models/Conversation.js";
import { trackEvent } from "../services/analyticsService.js";

export const chatWithImam = async (req, res) => {
  try {
    const { prompt, history, conversationId } = req.body;
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

    // STRICT LIMIT: Allow max 3 messages
    if (user.dailyChatCount >= 3) {
      trackEvent(clerkId, 'CHAT_LIMIT_REACHED', { attemptedAt: new Date() });
      return res.json({
        success: false,
        message: "I apologize, but to ensure I can help everyone, I am limited to 3 questions per day. Please come back tomorrow, Insha'Allah.",
        reply: "Daily limit reached." // Fallback for frontend
      });
    }

    // 3. Generate AI Response
    // Construct a context-aware prompt if needed, or pass raw prompt
    // The previous service had complex logic. The user wants SIMPLE implementation.
    // We will pass the raw prompt for now, or a simple wrapper.
    const reply = await generateResponse(prompt);

    // 4. Increment Count & Track
    user.dailyChatCount += 1;
    user.lastChatDate = new Date();
    await user.save();

    trackEvent(clerkId, 'CHAT_MESSAGE_SENT', {
      promptLength: prompt.length,
      dailyCount: user.dailyChatCount
    });

    // 5. Persist messages
    if (conversationId) {
      try {
        const conversation = await Conversation.findOne({ _id: conversationId, clerkId });
        if (conversation) {
          conversation.messages.push({ role: "user", content: prompt, timestamp: new Date() });
          conversation.messages.push({ role: "model", content: reply, timestamp: new Date() });
          await conversation.save();
        }
      } catch (dbErr) {
        console.error("Conversation save error (non-fatal):", dbErr);
      }
    }

    console.log(`Chat processed for ${user.name}. Count: ${user.dailyChatCount}`);

    // STEP 2 — CHAT CONTROLLER MUST HANDLE FAILURE
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
