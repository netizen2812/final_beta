import mongoose from "mongoose";

const liveAccessRequestSchema = new mongoose.Schema(
    {
        userId: {
            type: String, // Clerk ID
            required: true,
        },
        childId: {
            type: String, // Optional: if request is for specific child
        },
        email: {
            type: String,
        },
        name: {
            type: String
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        adminNote: {
            type: String,
        },
        reviewedAt: {
            type: Date,
        },
        reviewedBy: {
            type: String, // Admin Clerk ID
        }
    },
    { timestamps: true }
);

const LiveAccessRequest = mongoose.model("LiveAccessRequest", liveAccessRequestSchema);

export default LiveAccessRequest;
