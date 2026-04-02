import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    childId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Child",
        required: true
    },
    childName: String,
    status: {
        type: String,
        enum: ["present", "absent", "late", "excused"],
        default: "present"
    },
    joinedAt: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
    currentSurah: Number,
    currentAyah: Number
});

const sessionSchema = new mongoose.Schema({
    title: String,
    batchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Batch",
        required: true
    },
    scholarId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    scheduledAt: {
        type: Date,
        default: Date.now
    },
    endedAt: Date,
    status: {
        type: String,
        enum: ["scheduled", "live", "completed", "cancelled"],
        default: "live"
    },
    activeChildId: String, // Child whose turn it is
    attendance: [attendanceSchema],
    recordingUrl: String,
    notes: String,
    
    // Classroom state (replicated from Batch for session-specific state)
    currentPromptAnswers: [{
        childId: String,
        answer: { type: String, enum: ['yes', 'no'] }
    }],
    promptEvaluated: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Session = mongoose.model("Session", sessionSchema);
export default Session;
