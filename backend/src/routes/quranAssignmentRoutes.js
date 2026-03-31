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

import { requireAuth, isScholar, isParentOfChild, isOwnerOfAssignment } from "../middleware/authmiddleware.js";

const router = express.Router();

// Apply auth to all routes
router.use(requireAuth);

// Scholar routes (Restricted to Scholar/Admin)
router.post("/assign", isScholar, createAssignment);
router.post("/batch-assign", isScholar, batchCreateAssignments);
router.patch("/:assignmentId/complete", isScholar, markCompleted);
router.get("/batch/:batchId", isScholar, getBatchAssignmentsStatus); 

// Student/Child routes (Restricted to owners: Parent or StudentChild)
router.get("/child/:childId/active", isParentOfChild, getActiveAssignment);
router.get("/juz/:juz/subpart/:subpart", getRevisionText);
router.patch("/:assignmentId/progress", isOwnerOfAssignment, updateProgress);
router.post("/:assignmentId/complete-revision", isOwnerOfAssignment, completeRevision);

export default router;
