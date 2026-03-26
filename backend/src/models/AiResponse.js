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

// TTL Index: Auto-delete cached responses after 180 days to manage storage
aiResponseSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

const AiResponse = mongoose.model("AiResponse", aiResponseSchema);

export default AiResponse;
