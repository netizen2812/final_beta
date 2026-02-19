import express from "express";
import { requireAuth, isAdmin } from "../middleware/authmiddleware.js";
import { getAdminStats, getLiveSessions, forceEndSession, getAllUsers, updateUser, resetUserProgress } from "../controller/adminController.js";

const router = express.Router();

// All routes require authentication AND admin role
router.use(requireAuth, isAdmin);

router.get("/stats", getAdminStats);
router.get("/sessions", getLiveSessions);
router.post("/session/:id/end", forceEndSession);

// User Management
router.get("/users", getAllUsers);
router.patch("/user/:id", updateUser); // specific field updates
router.post("/user/:id/reset-progress", resetUserProgress);

export default router;
