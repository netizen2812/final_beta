import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
dotenv.config();

import connectDB from "./config/db.js";
import { requireAuth } from "./middleware/authmiddleware.js"
import { chatWithImam } from "./controller/chatController.js";
import { generateResponse } from "./services/aiService.js";

import userRoutes from "./routes/userRoutes.js";
import liveRoutes from "./routes/liveRoutes.js";
import zakatRoutes from "./routes/zakatRoutes.js";
import parentRoutes from "./routes/parentRoutes.js";
import childRoutes from "./routes/childRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import ibadahRoutes from "./routes/ibadahRoutes.js";
import ibadahQuranRoutes from "./routes/ibadahQuranRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import quranAssignmentRoutes from "./routes/quranAssignmentRoutes.js";

// Connect to database
connectDB().then(async () => {
  try {
    // Log AI Provider Info
    console.log("AI provider: OpenRouter");
    console.log("Model: openai/gpt-4o-mini");
  } catch (err) {
    console.error("Seeding error:", err);
  }
});

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://tryimam.vercel.app",
  "https://imam.vercel.app",
  "https://www.imamapp.co",
  "https://imamapp.co",
  "http://localhost:5173",
  "http://localhost:3000"
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
app.use(helmet());
app.use(compression());
app.use(express.json());

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5000, // Increased limits heavily to support polling features
  keyGenerator: (req) => req.auth?.userId || req.ip,
  skip: (req) => req.originalUrl.includes("/api/live") || req.originalUrl.includes("/heartbeat"),
  message: "Too many requests, please try again later"
});

const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 5, 
  keyGenerator: (req) => req.auth?.userId || req.ip,
  message: "AI rate limit reached. Please wait a minute before asking another question."
});

// Live routes are excluded via the skip function in generalLimiter directly
app.use("/api/", generalLimiter);
app.use("/api/chat", aiLimiter);
app.use("/ai-test", aiLimiter);

// Debug: Log all incoming requests
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.path}`);
  next();
});

app.get("/", (req, res) => {
  res.status(200).send("API is running");
});

// STEP 7 — TEST ENDPOINT
app.get("/ai-test", async (req, res) => {
  try {
    const reply = await generateResponse("Say hello in one sentence.");
    res.send(reply);
  } catch (error) {
    res.status(500).send("AI Test Failed: " + error.message);
  }
});

app.post("/api/chat", requireAuth, chatWithImam);
app.use("/api/users", userRoutes);
app.use("/api/live", liveRoutes);
app.use("/api/zakat", zakatRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/child", childRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/ibadah/quran", ibadahQuranRoutes);
app.use("/api/ibadah", ibadahRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/quran/assignments", quranAssignmentRoutes);

console.log("✅ All routes registered:");
console.log("   - GET /ai-test (OpenRouter Verification)");
console.log("   - POST /api/chat");
console.log("   - /api/users/*");
console.log("   - /api/live/*");
console.log("   - /api/parent/*");
console.log("   - /api/child/*");
console.log("   - /api/ibadah/*");

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`🚀 Deployment Trigger: ${new Date().toISOString()}`);

  // Auto-configure Daily.co webhooks (no manual dashboard step needed)
  if (process.env.DAILY_API_KEY) {
    try {
      const { setupDailyWebhook } = await import("./services/dailyService.js");
      const backendUrl = process.env.NODE_ENV === 'production' 
        ? 'https://final-beta.onrender.com' 
        : `http://localhost:${PORT}`;
      await setupDailyWebhook(backendUrl);
    } catch (err) {
      console.warn("Daily.co webhook setup skipped:", err.message);
    }
  }
});
