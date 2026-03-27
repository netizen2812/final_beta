import express from "express";
import { 
    createAssignment, 
    getActiveAssignment, 
    updateProgress, 
    markCompleted,
    batchCreateAssignments,
    getRevisionText
} from "../controller/QuranAssignmentController.js";

const router = express.Router();

// Scholar routes
router.post("/assign", createAssignment);
router.post("/batch-assign", batchCreateAssignments);
router.patch("/:assignmentId/complete", markCompleted);

// Student/Child routes
router.get("/child/:childId/active", getActiveAssignment);
router.get("/juz/:juz/subpart/:subpart", getRevisionText);
router.patch("/:assignmentId/progress", updateProgress);

export default router;
