import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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
import tarbiyahRoutes from "./routes/tarbiyahRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import accessRoutes from "./routes/accessRoutes.js";

// Connect to database
connectDB().then(async () => {
  try {
    // Log AI Provider Info
    console.log("AI provider: OpenRouter");
    console.log("Model: openai/gpt-4o-mini");

    const Lesson = (await import("./models/Lesson.js")).default;
    const { standardLessons } = await import("./data/lessons.js");

    console.log(`🌱 Checking ${standardLessons.length} standard lessons...`);

    for (const lesson of standardLessons) {
      await Lesson.updateOne(
        { id: lesson.id },
        { $set: lesson },
        { upsert: true }
      );
    }
    console.log("✅ Standard lessons synced successfully.");
  } catch (err) {
    console.error("Seeding error:", err);
  }
});

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "https://tryimam.vercel.app",
  "https://imam.vercel.app",
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
app.use(express.json());

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
app.use("/api/tarbiyah", tarbiyahRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/live/access", accessRoutes);

console.log("✅ All routes registered:");
console.log("   - GET /ai-test (OpenRouter Verification)");
console.log("   - POST /api/chat");
console.log("   - /api/users/*");
console.log("   - /api/live/*");
console.log("   - /api/parent/*");
console.log("   - /api/child/*");
console.log("   - /api/tarbiyah/*");

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`🚀 Deployment Trigger: ${new Date().toISOString()}`);
});
