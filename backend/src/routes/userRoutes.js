import express from "express";
import { syncUser, heartbeat, updateLanguage } from "../controller/userController.js";
import { requireAuth } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/sync", requireAuth, syncUser);
router.post("/heartbeat", requireAuth, heartbeat);
router.patch("/language", requireAuth, updateLanguage);

export default router;
