import Conversation from "../models/Conversation.js";

// GET /api/conversations — list user's conversations (title + id only)
export const listConversations = async (req, res) => {
    try {
        const clerkId = req.auth?.userId;
        if (!clerkId) return res.status(401).json({ message: "Unauthorized" });

        const conversations = await Conversation.find(
            { clerkId },
            { title: 1, createdAt: 1, updatedAt: 1, "messages": { $slice: -1 } }
        ).sort({ updatedAt: -1 }).limit(50);

        res.json(conversations);
    } catch (err) {
        console.error("listConversations error:", err);
        res.status(500).json({ message: "Failed to fetch conversations" });
    }
};

// POST /api/conversations — create new conversation
export const createConversation = async (req, res) => {
    try {
        const clerkId = req.auth?.userId;
        if (!clerkId) return res.status(401).json({ message: "Unauthorized" });

        const conversation = await Conversation.create({ clerkId, messages: [] });
        res.status(201).json(conversation);
    } catch (err) {
        console.error("createConversation error:", err);
        res.status(500).json({ message: "Failed to create conversation" });
    }
};

// GET /api/conversations/:id — load messages for a conversation
export const getConversation = async (req, res) => {
    try {
        const clerkId = req.auth?.userId;
        if (!clerkId) return res.status(401).json({ message: "Unauthorized" });

        const conversation = await Conversation.findOne({ _id: req.params.id, clerkId });
        if (!conversation) return res.status(404).json({ message: "Conversation not found" });

        res.json(conversation);
    } catch (err) {
        console.error("getConversation error:", err);
        res.status(500).json({ message: "Failed to fetch conversation" });
    }
};

// DELETE /api/conversations/:id — delete a conversation
export const deleteConversation = async (req, res) => {
    try {
        const clerkId = req.auth?.userId;
        if (!clerkId) return res.status(401).json({ message: "Unauthorized" });

        await Conversation.findOneAndDelete({ _id: req.params.id, clerkId });
        res.json({ message: "Deleted" });
    } catch (err) {
        console.error("deleteConversation error:", err);
        res.status(500).json({ message: "Failed to delete conversation" });
    }
};
