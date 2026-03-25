import mongoose from "mongoose";

const accessRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User' // Links to clerkId
    },
    userEmail: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending"
    }
  },
  { timestamps: true }
);

export default mongoose.models.AccessRequest || mongoose.model("AccessRequest", accessRequestSchema);
