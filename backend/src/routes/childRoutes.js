import express from "express";
import {
    getChildren,
    createChild,
    updateChild,
    deleteChild,
    updateProgress,
} from "../controller/childController.js";
import { requireAuth, isParentOfChild } from "../middleware/authmiddleware.js";

const router = express.Router();

// All routes require authentication
router.get("/", requireAuth, getChildren);
router.post("/", requireAuth, createChild);
router.put("/:childId", requireAuth, isParentOfChild, updateChild);
router.delete("/:childId", requireAuth, isParentOfChild, deleteChild);
router.put("/:childId/progress", requireAuth, isParentOfChild, updateProgress);

export default router;
