import express from "express";
import { startSession, getScholarSessions, getSession, updateAyah, endSession, getScholarStatus } from "../controller/liveController.js";
import { requireAuth } from "../middleware/authmiddleware.js";

const router = express.Router();

// Scholar Status (public check - no auth needed so parent can see before starting)
router.get("/scholar/status", requireAuth, getScholarStatus);

// Parent Routes
router.post("/start", requireAuth, startSession);
router.patch("/:id", requireAuth, updateAyah); // Update surah/ayah
router.post("/:id/end", requireAuth, endSession);

// Scholar Routes
router.get("/scholar/sessions", requireAuth, getScholarSessions);

// Common
router.get("/:id", requireAuth, getSession);

console.log("✅ Live routes loaded successfully");

export default router;
