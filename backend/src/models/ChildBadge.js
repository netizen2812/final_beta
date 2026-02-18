import mongoose from "mongoose";

const childBadgeSchema = new mongoose.Schema(
    {
        child_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Child",
            required: true,
        },
        badge_id: {
            type: String,
            required: true,
        },
        badge_name: {
            type: String,
            required: true,
        },
        badge_emoji: {
            type: String,
            default: "🏆",
        },
        badge_description: {
            type: String,
            default: "",
        },
        progress: {
            type: Number,
            default: 100, // Percentage
        },
        earned_at: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

// Ensure unique badge per child
childBadgeSchema.index({ child_id: 1, badge_id: 1 }, { unique: true });

const ChildBadge = mongoose.model("ChildBadge", childBadgeSchema);

export default ChildBadge;
