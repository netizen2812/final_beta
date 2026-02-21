import express from "express";
import { requireAuth } from "../middleware/authmiddleware.js";
import { ingestEvent, getAggregatedMetrics } from "../controller/analyticsController.js";

const router = express.Router();

router.post("/event", requireAuth, ingestEvent);
router.get("/metrics", requireAuth, getAggregatedMetrics);

export default router;
