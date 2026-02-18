import express from "express";
import { getParentDashboard, updateParentSettings, updateLessonProgress } from "../controller/tarbiyahController.js";
import { requireAuth } from "../middleware/authmiddleware.js";

const router = express.Router();

// Parent Dashboard routes
router.get("/parent/dashboard/:childUserId", requireAuth, getParentDashboard);
router.patch("/parent/settings/:childUserId", requireAuth, updateParentSettings);

// Progress routes
router.post("/progress", requireAuth, updateLessonProgress);

export default router;
