import mongoose from "mongoose";

const childActivitySchema = new mongoose.Schema({
    child_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Child',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: () => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            return today;
        }
    },
    minutes_spent: {
        type: Number,
        default: 0
    },
    sessions_attended: {
        type: Number,
        default: 0
    },
    topics_studied: {
        type: Map,
        of: Number,
        default: {}
    }
}, { timestamps: true });

// Ensure one entry per child per day
childActivitySchema.index({ child_id: 1, date: 1 }, { unique: true });

const ChildActivity = mongoose.model("ChildActivity", childActivitySchema);

export default ChildActivity;
