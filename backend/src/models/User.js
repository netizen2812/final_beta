import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    clerkId: {
      type: String,
      unique: true,
      sparse: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
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
      },
      aiPremiumUntil: {
        type: Date,
        default: null
      }
    },

    // Language preference for i18n
    preferredLanguage: {
      type: String,
      enum: ['en', 'hi', 'ur', 'ml', 'bn'],
      default: 'en'
    },

    // Payment Idempotency (Prevent replay attacks)
    processedPayments: [{ type: String }]
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
