import express from "express";
import { requestAccess, getAccessStatus, listRequests, approveRequest, rejectRequest } from "../controller/accessController.js";
import { requireAuth, isAdmin } from "../middleware/authmiddleware.js";

const router = express.Router();

// User Routes
router.post("/request", requireAuth, requestAccess);
router.get("/status", requireAuth, getAccessStatus);

// Admin Routes
router.get("/admin/requests", requireAuth, isAdmin, listRequests);
router.post("/admin/requests/:id/approve", requireAuth, isAdmin, approveRequest);
router.post("/admin/requests/:id/reject", requireAuth, isAdmin, rejectRequest);

export default router;
