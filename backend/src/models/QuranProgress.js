import mongoose from "mongoose";

const quranProgressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true, // One progress doc per user
        },
        readAyahs: {
            type: [String], // Array of strings like "1:1", "1:2"
            default: [],
        },
        activeSeconds: {
            type: Number,
            default: 0,
        },
        streak: {
            type: Number,
            default: 0,
        },
        lastReadDate: {
            type: String, // YYYY-MM-DD
            default: null,
        },
    },
    { timestamps: true }
);

// We keep a single document per user so that fetching is extremely fast.
const QuranProgress = mongoose.model("QuranProgress", quranProgressSchema);

export default QuranProgress;
