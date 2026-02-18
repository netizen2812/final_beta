import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    role: { type: String, enum: ["user", "model"], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

const conversationSchema = new mongoose.Schema(
    {
        clerkId: { type: String, required: true, index: true },
        title: { type: String, default: "New Conversation" },
        messages: [messageSchema],
    },
    { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
