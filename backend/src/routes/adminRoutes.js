import express from "express";
import { requireAuth, isAdmin } from "../middleware/authmiddleware.js";
import { getAdminStats, getLiveSessions, forceEndSession, getAllUsers, updateUserStatus } from "../controller/adminController.js";

const router = express.Router();

// All routes require authentication AND admin role
router.use(requireAuth, isAdmin);

router.get("/stats", getAdminStats);
router.get("/sessions", getLiveSessions);
router.post("/session/:id/end", forceEndSession);

// User Management
router.get("/users", getAllUsers);
router.patch("/user/:id/access", updateUserStatus);

export default router;
