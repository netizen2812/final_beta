import express from "express";
import { requireAuth } from "../middleware/authmiddleware.js";
import {
    listConversations,
    createConversation,
    getConversation,
    deleteConversation,
} from "../controller/conversationController.js";

const router = express.Router();

router.use(requireAuth);

router.get("/", listConversations);
router.post("/", createConversation);
router.get("/:id", getConversation);
router.delete("/:id", deleteConversation);

export default router;
