import mongoose from "mongoose";

const xpLogSchema = new mongoose.Schema({
    childId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Child",
        required: true,
        index: true
    },
    action: {
        type: String,
        enum: ["recitation", "participation", "session_complete", "revision", "practice", "bonus"],
        required: true
    },
    xpGained: {
        type: Number,
        required: true
    },
    batchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch"
    },
    sessionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session"
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    }
}, { timestamps: true });

const XPLog = mongoose.model("XPLog", xpLogSchema);
export default XPLog;
