import mongoose from "mongoose";

const childProgressSchema = new mongoose.Schema({
    total_xp: {
        type: Number,
        default: 0,
    },
    level: {
        type: Number,
        default: 1,
    },
    badges: {
        type: [String],
        default: [],
    },
    streak_days: {
        type: Number,
        default: 0,
    },
    last_active_date: {
        type: Date,
        default: null,
    },
    total_sessions_attended: {
        type: Number,
        default: 0,
    },
    total_correct_recitations: {
        type: Number,
        default: 0,
    },
    attendance: [{
        batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
        sessionId: { type: String },
        date: { type: Date, default: Date.now },
        status: { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
        type: { type: String } // e.g. 'session_complete'
    }]
});

const childSchema = new mongoose.Schema(
    {
        parent_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        childUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true, // Links to the actual user account for the child
        },
        name: {
            type: String,
            required: true,
        },
        age: {
            type: Number,
            required: true,
        },
        gender: {
            type: String,
            enum: ["Boy", "Girl"],
            required: true,
        },
        daily_limit: {
            type: Number,
            default: 45, // minutes
        },
        learning_level: {
            type: String,
            default: "Beginner",
        },
        batch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Batch" // Active batch assignment
        },
        child_progress: [childProgressSchema],
    },
    { 
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Optimize lookups for ownership checks and child profile access
childSchema.index({ parent_id: 1 });
childSchema.index({ childUserId: 1 });

const Child = mongoose.model("Child", childSchema);

export default Child;
