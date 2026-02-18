import mongoose from "mongoose";

const analyticsEventSchema = new mongoose.Schema(
    {
        userId: {
            type: String, // Clerk ID or ObjectID string
            required: true,
            index: true,
        },
        eventType: {
            type: String,
            required: true,
            index: true, // e.g., 'LESSON_COMPLETE', 'CHAT_SENT', 'CHILD_CREATED'
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        timestamp: {
            type: Date,
            default: Date.now,
            index: true,
        },
    },
    { timestamps: true } // Adds createdAt/updatedAt automatically
);

// TTL Index: Auto-delete events after 90 days to manage cost/storage
analyticsEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const AnalyticsEvent = mongoose.model("AnalyticsEvent", analyticsEventSchema);

export default AnalyticsEvent;
