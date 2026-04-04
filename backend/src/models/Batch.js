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
    scholarEmail: {
        type: String,
        lowercase: true,
        trim: true
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
        enum: ["active", "archived", "upcoming", "ended"],
        default: "upcoming" // Fix: Default must be upcoming so students see "Class Scheduled" until Scholar actually starts it
    },
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
    },
    dailyRoomName: {
        type: String, // Maps to Daily.co room name for webhooks
        default: null
    },
    pastSessions: [{
        sessionId: { type: String, required: true },
        startedAt: { type: Date, default: Date.now },
        endedAt: { type: Date, default: null },
        attendedChildren: [{ type: String }] // Store as exact string to prevent $addToSet type matching failures!
    }],
    activeParticipants: [{
        childId: { type: String, required: true },
        childName: { type: String, default: 'Student' },
        currentSurah: { type: Number, default: null },
        currentAyah: { type: Number, default: null },
        lastSeen: { type: Date, default: Date.now },
        isActive: { type: Boolean, default: true }
    }]
}, { timestamps: true });

const Batch = mongoose.model("Batch", batchSchema);
export default Batch;
