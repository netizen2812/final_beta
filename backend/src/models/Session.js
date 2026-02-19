import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
    childId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Child"
    },
    status: {
        type: String,
        enum: ["present", "absent", "late", "excused"],
        default: "absent"
    },
    joinedAt: Date
});

const sessionSchema = new mongoose.Schema({
    title: String, // Optional override, e.g. "Special Ramadan Prep"
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
        required: true
    },
    status: {
        type: String,
        enum: ["scheduled", "live", "completed", "cancelled"],
        default: "scheduled"
    },
    attendance: [attendanceSchema],
    recordingUrl: String,
    notes: String
}, { timestamps: true });

const Session = mongoose.model("Session", sessionSchema);
export default Session;
