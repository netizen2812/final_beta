import mongoose from "mongoose";

const quranQuestionSchema = new mongoose.Schema(
    {
        juz: {
            type: Number,
            required: true,
            index: true,
        },
        subpart: {
            type: Number,
            required: true,
            index: true,
        },
        question: {
            type: String,
            required: true,
        },
        options: {
            type: [String],
            required: true,
            validate: [array => array.length >= 2, 'Must have at least 2 options'],
        },
        correctAnswer: {
            type: Number, // Index in the options array
            required: true,
        },
        type: {
            type: String,
            enum: ["MCQ", "TrueFalse", "Memorization"],
            default: "MCQ",
        },
    },
    { timestamps: true }
);

// Index for fast lookup when practicing a specific subpart
quranQuestionSchema.index({ juz: 1, subpart: 1 });

const QuranQuestion = mongoose.model("QuranQuestion", quranQuestionSchema);
export default QuranQuestion;
