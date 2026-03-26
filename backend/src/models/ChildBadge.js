import mongoose from "mongoose";

const childBadgeSchema = new mongoose.Schema({
    child_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    emoji: {
        type: String
    },
    earned_at: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const ChildBadge = mongoose.model("ChildBadge", childBadgeSchema);

export default ChildBadge;
