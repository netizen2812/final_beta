import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
    },
    name: {
      type: String,
    },
    lastHeartbeat: {
      type: Date,
      default: Date.now
    },

    role: {
      type: String,
      enum: ["scholar", "parent", "student", "admin"],
      default: "parent",
      set: v => v ? v.toLowerCase() : v // Normalize to lowercase
    },

    xp: {
      type: Number,
      default: 0,
    },

    // Rate Limiting for Chat
    dailyChatCount: {
      type: Number,
      default: 0,
    },
    lastChatDate: {
      type: Date,
      default: null,
    },

    // Feature Flags / Permissions
    features: {
      liveAccess: {
        type: Boolean,
        default: false
      }
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
