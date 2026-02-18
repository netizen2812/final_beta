import express from "express";
import {
    getDashboardStats,
    getSettings,
    updateSettings,
    getBadges,
    getReportCard,
    logActivity,
} from "../controller/parentController.js";
import { requireAuth } from "../middleware/authmiddleware.js";

const router = express.Router();

// All routes require authentication
router.get("/dashboard/:childId", requireAuth, getDashboardStats);
router.get("/settings/:childId", requireAuth, getSettings);
router.put("/settings/:childId", requireAuth, updateSettings);
router.get("/badges/:childId", requireAuth, getBadges);
router.get("/report/:childId", requireAuth, getReportCard);
router.post("/activity/:childId", requireAuth, logActivity);

export default router;
