import express from "express";
import {
    getScholarSessions, getScholarStatus,
    createBatch, getAdminBatches, updateBatch, deleteBatch, startBatch, joinBatch, getMySessions,
    addStudentToBatch, removeStudentFromBatch, getBatchSessions, debugBatch, debugAllBatches,
    batchPing, updateBatchProgress, updatePosition, leaveBatch, getBatchActiveParticipants,
    getBatchState, selectTurn, scoreRecitation, scoreParticipation, getLeaderboard,
    submitPrompt, evaluatePrompt, getScholarBatches, endBatch, getBatchAttendance, getBatchStudents,
    emergencyLinkRestore, forceEndBatch
} from "../controller/liveController.js";
import { requireAuth, isAdmin, isScholar } from "../middleware/authmiddleware.js";
import { canAccessBatch } from "../middleware/batchAccess.js";

const router = express.Router();

// Daily.co Webhook (Unauthenticated)
router.post("/webhook/daily", (req, res, next) => {
    // Basic verification could go here if we had a secret
    next();
}, (req, res, next) => {
    import("../controller/liveController.js").then(m => m.handleDailyWebhook(req, res)).catch(next);
});

// Helper: Scholar Status
router.get("/scholar/status", requireAuth, getScholarStatus);

// SCHOLAR: My Batches
router.get("/scholar/batches", requireAuth, isScholar, getScholarBatches);

// USER: My Sessions
router.get("/my-sessions", requireAuth, getMySessions);

// USER: Join Batch
router.post("/:id/join", requireAuth, joinBatch);

// DEBUG: Check Batch Status (Admin Only)
router.get("/:id/debug", requireAuth, isAdmin, debugBatch);

// LIVE PRESENCE
router.post("/ping", requireAuth, batchPing);
router.post("/update-progress", requireAuth, updateBatchProgress);
router.post("/update-position", requireAuth, updatePosition);
router.post("/leave", requireAuth, leaveBatch);
router.get("/batch/:id/participants", requireAuth, canAccessBatch, getBatchActiveParticipants);
router.get("/batch/:id/students", requireAuth, canAccessBatch, getBatchStudents);

// CLASSROOM STATE & SCORING
router.get("/batch/:id/state", requireAuth, canAccessBatch, getBatchState);
router.get("/batch/:id/attendance/:childId", requireAuth, canAccessBatch, getBatchAttendance);
router.post("/batch/:id/select-turn", requireAuth, isScholar, selectTurn);
router.post("/batch/:id/set-turn", requireAuth, isScholar, selectTurn); // Alias for backward compatibility
router.post("/batch/:id/score-recitation", requireAuth, isScholar, scoreRecitation);

router.post("/batch/:id/score-participation", requireAuth, isScholar, scoreParticipation);
router.post("/batch/:id/submit-prompt", requireAuth, submitPrompt);
router.post("/batch/:id/evaluate-prompt", requireAuth, isScholar, evaluatePrompt);
router.get("/batch/:id/leaderboard", requireAuth, canAccessBatch, getLeaderboard);

// ADMIN: Batch Management
router.post("/admin/batch", requireAuth, isAdmin, createBatch);
router.get("/admin/batches", requireAuth, isAdmin, getAdminBatches);
router.patch("/admin/batch/:id", requireAuth, isAdmin, updateBatch);
router.delete("/admin/batch/:id", requireAuth, isAdmin, deleteBatch);
router.post("/admin/batch/:id/add-student", requireAuth, isAdmin, addStudentToBatch);
router.post("/admin/batch/:id/remove-student", requireAuth, isAdmin, removeStudentFromBatch);
router.post("/admin/batch/:id/force-end", requireAuth, isAdmin, forceEndBatch);
router.post("/admin/emergency-link-restore", requireAuth, isAdmin, emergencyLinkRestore);

// DEBUG
router.get("/debug/batches", requireAuth, isAdmin, debugAllBatches);

// SCHOLAR: Start Batch
router.post("/:id/start", requireAuth, isScholar, startBatch);

// SCHOLAR: End Batch
router.post("/batch/:id/end", requireAuth, isScholar, endBatch);

// SCHOLAR: Batch Observation
router.get("/batch/:id/sessions", requireAuth, isScholar, getBatchSessions);

// SCHOLAR: Common
router.get("/scholar/sessions", requireAuth, isScholar, getScholarSessions); // for scholar dashboard

console.log("✅ Live routes loaded successfully");

export default router;
