import express from "express";
import {
    startSession, getScholarSessions, getSession, updateAyah, endSession, getScholarStatus,
    createBatch, getAdminBatches, updateBatch, deleteBatch, startBatch, joinBatch, getMySessions,
    addStudentToBatch, removeStudentFromBatch, getBatchSessions, debugBatch, debugAllBatches
} from "../controller/liveController.js";
import { requireAuth, isAdmin } from "../middleware/authmiddleware.js";

const router = express.Router();

// Helper: Scholar Status
router.get("/scholar/status", requireAuth, getScholarStatus);

// USER: My Sessions
router.get("/my-sessions", requireAuth, getMySessions);

// USER: Join Batch
router.post("/:id/join", requireAuth, joinBatch);

// DEBUG: Check Batch Status
router.get("/:id/debug", debugBatch);

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
router.post("/:id/start", requireAuth, startBatch);

// SCHOLAR: Batch Observation
router.get("/batch/:id/sessions", requireAuth, getBatchSessions);

// SCHOLAR: Common / Legacy
router.get("/scholar/sessions", requireAuth, getScholarSessions); // for scholar dashboard
router.post("/start", requireAuth, startSession); // legacy 1-on-1 if still needed
router.get("/:id", requireAuth, getSession);
router.patch("/:id", requireAuth, updateAyah);
router.post("/:id/end", requireAuth, endSession);

console.log("✅ Live routes loaded successfully");

export default router;
