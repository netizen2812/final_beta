import express from "express";
import {
    getChildren,
    createChild,
    updateChild,
    deleteChild,
    updateProgress,
} from "../controller/childController.js";
import { requireAuth } from "../middleware/authmiddleware.js";

const router = express.Router();

// All routes require authentication
router.get("/", requireAuth, getChildren);
router.post("/", requireAuth, createChild);
router.put("/:childId", requireAuth, updateChild);
router.delete("/:childId", requireAuth, deleteChild);
router.put("/:childId/progress", requireAuth, updateProgress);

export default router;
