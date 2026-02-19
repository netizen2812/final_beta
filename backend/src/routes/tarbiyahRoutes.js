import express from "express";
import { getParentDashboard, updateParentSettings, updateLessonProgress, startLesson, getLessons } from "../controller/tarbiyahController.js";
import { requireAuth } from "../middleware/authmiddleware.js";

const router = express.Router();

// Parent Dashboard routes
router.get("/parent/dashboard/:childUserId", requireAuth, getParentDashboard);
router.patch("/parent/settings/:childUserId", requireAuth, updateParentSettings);

// Progress routes
router.post("/start", requireAuth, startLesson);
router.post("/progress", requireAuth, updateLessonProgress);

// Content routes
router.get("/list", getLessons); // Public or protected? Let's make it public for now or require auth if needed. The frontend sends token, so we can requireAuth if strict. But let's leave open for simplicity or add requireAuth if frontend sends it. Frontend DOES send token.
// Actually, let's keep it simple.


export default router;
