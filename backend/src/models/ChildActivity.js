import mongoose from "mongoose";

const childActivitySchema = new mongoose.Schema(
    {
        child_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Child",
            required: true,
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        minutes_spent: {
            type: Number,
            default: 0,
        },
        lessons_completed: {
            type: Number,
            default: 0,
        },
        topics_studied: {
            type: Map,
            of: Number, // topic name -> minutes spent
            default: {},
        },
    },
    { timestamps: true }
);

// Index for efficient queries
childActivitySchema.index({ child_id: 1, date: -1 });

const ChildActivity = mongoose.model("ChildActivity", childActivitySchema);

export default ChildActivity;
