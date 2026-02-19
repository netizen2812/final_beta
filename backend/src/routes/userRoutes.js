import express from "express";
import { syncUser, heartbeat } from "../controller/userController.js";
import { requireAuth } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/sync", requireAuth, syncUser);
router.post("/heartbeat", requireAuth, heartbeat);

export default router;
