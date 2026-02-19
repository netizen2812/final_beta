import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db.js";
import { requireAuth } from "./middleware/authmiddleware.js"
import { chatWithImam } from "./controller/chatController.js";


import userRoutes from "./routes/userRoutes.js";
import liveRoutes from "./routes/liveRoutes.js";
import zakatRoutes from "./routes/zakatRoutes.js";
import parentRoutes from "./routes/parentRoutes.js";
import childRoutes from "./routes/childRoutes.js";
import tarbiyahRoutes from "./routes/tarbiyahRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";


// Connect to database
connectDB();

const app = express();

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000"
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
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

app.post("/api/chat", requireAuth, chatWithImam);
app.use("/api/users", userRoutes);
app.use("/api/live", liveRoutes);
app.use("/api/zakat", zakatRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/child", childRoutes);
app.use("/api/tarbiyah", tarbiyahRoutes);
app.use("/api/conversations", conversationRoutes);

console.log("✅ All routes registered:");
console.log("   - POST /api/chat");
console.log("   - /api/users/*");
console.log("   - /api/live/*");
console.log("   - /api/parent/*");
console.log("   - /api/child/*");
console.log("   - /api/tarbiyah/*");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
