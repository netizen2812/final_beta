import mongoose from "mongoose";

const liveAttendanceSchema = new mongoose.Schema(
    {
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LiveSession",
            required: true,
        },
        userId: {
            type: String, // Clerk ID of participant (Parent/Scholar)
            required: true,
        },
        childId: {
            type: String, // If a child is participating
        },
        role: {
            type: String,
            enum: ['parent', 'scholar', 'student', 'admin'],
            required: true
        },
        joinTime: {
            type: Date,
            required: true,
        },
        leaveTime: {
            type: Date,
        },
        durationSeconds: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

const LiveAttendance = mongoose.model("LiveAttendance", liveAttendanceSchema);

export default LiveAttendance;
