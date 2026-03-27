import mongoose from "mongoose";

const quranAssignmentSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Child",
            required: true,
            index: true,
        },
        scholarId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        juz: {
            type: Number,
            required: true,
        },
        subpart: {
            type: Number,
            required: true,
        },
        ayahRange: {
            type: String, // e.g. "1-15"
        },
        status: {
            type: String,
            enum: ["assigned", "practicing", "completed"],
            default: "assigned",
        },
        practiceScore: {
            type: Number,
            default: 0,
        },
        practiceCount: {
            type: Number,
            default: 0,
        },
        completedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

const QuranAssignment = mongoose.model("QuranAssignment", quranAssignmentSchema);
export default QuranAssignment;
