import mongoose from "mongoose";

const liveSessionSchema = new mongoose.Schema(
    {
        // The parent who started the session
        parentId: {
            type: String, // Clerk ID
            required: true,
        },
        // The child this session is for
        childId: {
            type: String,
            required: true,
        },
        // The scholar assigned/monitoring
        scholarId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Real DB User ID for Scholar
            required: true,
        },
        // Quran Progress
        currentSurah: {
            type: Number,
            default: 1, // Al-Fatiha
        },
        currentAyah: {
            type: Number,
            default: 1,
        },
        status: {
            type: String,
            enum: ["active", "ended", "waiting"],
            default: "waiting",
        },
        startedAt: {
            type: Date,
        },
        endedAt: {
            type: Date,
        },
        durationMinutes: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

const LiveSession = mongoose.model("LiveSession", liveSessionSchema);

export default LiveSession;
