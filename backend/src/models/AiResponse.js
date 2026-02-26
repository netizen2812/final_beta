import mongoose from "mongoose";

const aiResponseSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: true,
            index: true
        },
        language: {
            type: String,
            required: true,
            enum: ['en', 'hi', 'ur', 'ml', 'bn']
        },
        madhab: {
            type: String,
            default: 'General'
        },
        answer: {
            type: String,
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }
);

// Compound index for fast cache lookups
aiResponseSchema.index({ question: 1, language: 1, madhab: 1 });

const AiResponse = mongoose.model("AiResponse", aiResponseSchema);

export default AiResponse;
