import express from "express";
import { syncUser } from "../controller/userController.js";
import { requireAuth } from "../middleware/authmiddleware.js";

const router = express.Router();

router.post("/sync",requireAuth,syncUser);

export default router;
