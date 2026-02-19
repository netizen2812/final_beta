import express from "express";
import { requireAuth, isAdmin } from "../middleware/authmiddleware.js";
import {
    getAdminStats,
    getAllUsers,
    updateUser,
    resetUserProgress,
    getBatches,
    createBatch,
    updateBatch,
    getSessions,
    createSession,
    forceEndSession
} from "../controller/adminController.js";

const router = express.Router();

// All routes require authentication AND admin role
router.use(requireAuth, isAdmin);

// Analytics
router.get("/stats", getAdminStats);

// User Management
router.get("/users", getAllUsers);
router.patch("/user/:id", updateUser); // specific field updates
router.post("/user/:id/reset-progress", resetUserProgress);

// Batch Management
router.get("/batches", getBatches);
router.post("/batches", createBatch);
router.patch("/batches/:id", updateBatch);

// Session Management
router.get("/sessions", getSessions);
router.post("/sessions", createSession);
router.post("/session/:id/end", forceEndSession);

export default router;
