import mongoose from "mongoose";

const quizAttemptSchema = new mongoose.Schema({
    attemptedAt: {
        type: Date,
        default: Date.now,
    },
    completedAt: {
        type: Date,
        default: null,
    },
    score: {
        type: Number,
        default: 0,
    },
});

const tarbiyahProgressSchema = new mongoose.Schema(
    {
        childUserId: {
            type: String,
            required: true,
            index: true,
            ref: "User",
        },
        lessonId: {
            type: String,
            required: true,
        },
        lessonTitle: {
            type: String,
            required: true,
        },
        badge: {
            type: String,
            default: "",
        },
        videoWatchedAt: {
            type: Date,
            default: null,
        },
        quizAttempts: [quizAttemptSchema],
        completedAt: {
            type: Date,
            default: null,
        },
        xpEarned: {
            type: Number,
            default: 0,
        },
        // Track when a child enters the lesson to calculate duration on exit
        activeSessionStart: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// Compound index for efficient queries
tarbiyahProgressSchema.index({ childUserId: 1, lessonId: 1 }, { unique: true });
tarbiyahProgressSchema.index({ childUserId: 1, completedAt: -1 });

const TarbiyahProgress = mongoose.model("TarbiyahProgress", tarbiyahProgressSchema);

export default TarbiyahProgress;
