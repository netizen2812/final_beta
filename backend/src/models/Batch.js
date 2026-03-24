import mongoose from "mongoose";

const batchSchema = new mongoose.Schema({
    name: {
        type: String, // e.g., "Quran Beginners A", "Fiqh Level 1"
        required: true,
        trim: true
    },
    scholar: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Child"
    }],
    schedule: {
        days: [String], // ["Monday", "Wednesday"]
        time: String,   // "18:00 UTC"
        durationMinutes: Number
    },
    level: {
        type: String,
        enum: ["Beginner", "Intermediate", "Advanced"],
        default: "Beginner"
    },
    status: {
        type: String,
        enum: ["active", "archived", "upcoming"],
        default: "active"
    },
    activeParticipants: [{
        childId: String,
        childName: String,
        currentSurah: Number, // Enforce Number
        currentAyah: Number,  // Enforce Number
        lastSeen: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true }
    }],
    activeChildId: {
        type: String, // Tracks whose turn it is
        default: null
    },
    activeSessionId: {
        type: String, // Tracks the current active class session for grouping scores
        default: null
    },
    currentPromptAnswers: [{
        childId: String,
        answer: { type: String, enum: ['yes', 'no'] }
    }],
    promptEvaluated: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Batch = mongoose.model("Batch", batchSchema);
export default Batch;
