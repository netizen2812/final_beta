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

// Compound index to quickly find scores for a specific class instance
liveScoreSchema.index({ batchId: 1, sessionId: 1, childId: 1 }, { unique: true });

const LiveScore = mongoose.model("LiveScore", liveScoreSchema);
export default LiveScore;
