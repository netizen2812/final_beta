import express from "express";
import { 
    createAssignment, 
    getActiveAssignment, 
    updateProgress, 
    markCompleted,
    batchCreateAssignments,
    getRevisionText,
    completeRevision,
    getBatchAssignmentsStatus
} from "../controller/QuranAssignmentController.js";

import { requireAuth, isScholar, isParentOfChild } from "../middleware/authmiddleware.js";

const router = express.Router();

// Apply auth to all routes
router.use(requireAuth);

// Scholar routes (Restricted to Scholar/Admin)
router.post("/assign", isScholar, createAssignment);
router.post("/batch-assign", isScholar, batchCreateAssignments);
router.patch("/:assignmentId/complete", isScholar, markCompleted);
router.get("/batch/:batchId", isScholar, getBatchAssignmentsStatus); 

// Student/Child routes (Requires Auth, but parents/children can access)
router.get("/child/:childId/active", getActiveAssignment);
router.get("/juz/:juz/subpart/:subpart", getRevisionText);
router.patch("/:assignmentId/progress", updateProgress);
router.post("/:assignmentId/complete-revision", completeRevision);

export default router;
