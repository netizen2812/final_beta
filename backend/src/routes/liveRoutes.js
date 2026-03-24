import express from "express";
import {
    startSession, getScholarSessions, getSession, updateAyah, endSession, getScholarStatus,
    createBatch, getAdminBatches, updateBatch, deleteBatch, startBatch, joinBatch, getMySessions,
    addStudentToBatch, removeStudentFromBatch, getBatchSessions, debugBatch, debugAllBatches,
    batchPing, updateBatchProgress, updatePosition, leaveBatch, getBatchActiveParticipants,
    getBatchState, selectTurn, scoreRecitation, scoreParticipation, getLeaderboard,
    submitPrompt, evaluatePrompt, getScholarBatches, endBatch, getBatchAttendance
} from "../controller/liveController.js";
import { requireAuth, isAdmin, isScholar } from "../middleware/authmiddleware.js";

const router = express.Router();

// Helper: Scholar Status
router.get("/scholar/status", requireAuth, getScholarStatus);

// SCHOLAR: My Batches
router.get("/scholar/batches", requireAuth, isScholar, getScholarBatches);

// USER: My Sessions
router.get("/my-sessions", requireAuth, getMySessions);

// USER: Join Batch
router.post("/:id/join", requireAuth, joinBatch);

// DEBUG: Check Batch Status
router.get("/:id/debug", debugBatch);

// LIVE PRESENCE
router.post("/ping", requireAuth, batchPing);
router.post("/update-progress", requireAuth, updateBatchProgress);
router.post("/update-position", requireAuth, updatePosition);
router.post("/leave", requireAuth, leaveBatch);
router.get("/batch/:id/participants", requireAuth, getBatchActiveParticipants);

// CLASSROOM STATE & SCORING
router.get("/batch/:id/state", requireAuth, getBatchState);
router.get("/batch/:id/attendance", requireAuth, getBatchAttendance);
router.post("/batch/:id/select-turn", requireAuth, isScholar, selectTurn);
router.post("/batch/:id/score-recitation", requireAuth, isScholar, scoreRecitation);
router.post("/batch/:id/score-participation", requireAuth, scoreParticipation);
router.post("/batch/:id/submit-prompt", requireAuth, submitPrompt);
router.post("/batch/:id/evaluate-prompt", requireAuth, isScholar, evaluatePrompt);
router.get("/batch/:id/leaderboard", requireAuth, getLeaderboard);

// ADMIN: Batch Management
router.post("/admin/batch", requireAuth, isAdmin, createBatch);
router.get("/admin/batches", requireAuth, isAdmin, getAdminBatches);
router.patch("/admin/batch/:id", requireAuth, isAdmin, updateBatch);
router.delete("/admin/batch/:id", requireAuth, isAdmin, deleteBatch);
router.post("/admin/batch/:id/add-student", requireAuth, isAdmin, addStudentToBatch);
router.post("/admin/batch/:id/remove-student", requireAuth, isAdmin, removeStudentFromBatch);

// DEBUG
router.get("/debug/batches", requireAuth, isAdmin, debugAllBatches);

// SCHOLAR: Start Batch
router.post("/:id/start", requireAuth, isScholar, startBatch);

// SCHOLAR: End Batch
router.post("/batch/:id/end", requireAuth, isScholar, endBatch);

// SCHOLAR: Batch Observation
router.get("/batch/:id/sessions", requireAuth, isScholar, getBatchSessions);

// SCHOLAR: Common / Legacy
router.get("/scholar/sessions", requireAuth, isScholar, getScholarSessions); // for scholar dashboard
router.post("/start", requireAuth, startSession); // legacy 1-on-1 if still needed
router.get("/:id", requireAuth, getSession);
router.patch("/:id", requireAuth, updateAyah);
router.post("/:id/end", requireAuth, endSession);

console.log("✅ Live routes loaded successfully");

export default router;
