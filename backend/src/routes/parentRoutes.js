import express from "express";
import {
    getDashboardStats,
    getSettings,
    updateSettings,
    getBadges,
    getReportCard,
    logActivity,
    bulkUpdateCompletion,
    getQuranMeta,
} from "../controller/parentController.js";
import { requireAuth, isParentOfChild } from "../middleware/authmiddleware.js";

const router = express.Router();

// All routes require authentication AND ownership of the child
router.get("/dashboard/:childId", requireAuth, isParentOfChild, getDashboardStats);
router.get("/quran-meta/:juz", requireAuth, getQuranMeta); // Available to all authenticated parents
router.get("/settings/:childId", requireAuth, isParentOfChild, getSettings);
router.put("/settings/:childId", requireAuth, isParentOfChild, updateSettings);
router.get("/badges/:childId", requireAuth, isParentOfChild, getBadges);
router.get("/report/:childId", requireAuth, isParentOfChild, getReportCard);
router.post("/activity/:childId", requireAuth, isParentOfChild, logActivity);
router.post("/completion/:childId", requireAuth, isParentOfChild, bulkUpdateCompletion);

export default router;
