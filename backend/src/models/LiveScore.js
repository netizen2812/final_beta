import mongoose from "mongoose";

const liveScoreSchema = new mongoose.Schema({
    batchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
        required: true
    },
    sessionId: {
        type: String,
        required: true
    },
    childId: {
        type: String,
        required: true
    },
    recitationScore: {
        type: Number,
        default: 0
    },
    participationScore: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// TTL Index: Auto-delete historical scores after 365 days (1 year) to manage storage
liveScoreSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

const LiveScore = mongoose.model("LiveScore", liveScoreSchema);
export default LiveScore;
