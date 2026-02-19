import mongoose from "mongoose";

const liveSessionSchema = new mongoose.Schema(
    {
        // Session Details
        title: {
            type: String,
            required: true,
            default: "Live Quran Session"
        },
        description: {
            type: String
        },

        // Schedule
        scheduledStartTime: {
            type: Date,
            required: true
        },
        scheduledEndTime: {
            type: Date,
            required: true
        },

        // The parent who started the session (Legacy support or Host)
        parentId: {
            type: String, // Clerk ID
            // Not required for Batch sessions created by Admin
        },
        // The child this session is for (Legacy 1-on-1 support)
        childId: {
            type: String,
            // Not required for Batch sessions
        },

        // The scholar assigned/monitoring
        scholarId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Real DB User ID for Scholar
            required: true,
        },

        // Access Control
        accessMode: {
            type: String,
            enum: ['open', 'restricted'],
            default: 'restricted'
        },
        allowedParents: [{
            type: String // Clerk IDs
        }],
        allowedChildren: [{
            type: String
        }],
        maxParticipants: {
            type: Number,
            default: 10
        },

        // Quran Progress (Shared)
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
            enum: ["scheduled", "active", "ended", "waiting"],
            default: "scheduled",
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
