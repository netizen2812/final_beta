import mongoose from "mongoose";

const tarbiyahUserStatsSchema = new mongoose.Schema(
    {
        childUserId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        dailyLimitMinutes: {
            type: Number,
            default: 45,
        },
        contentFilter: {
            type: String,
            default: "Age: 5-8 Years",
        },
        reportCardEnabled: {
            type: Boolean,
            default: true,
        },
        totalXP: {
            type: Number,
            default: 0,
        },
        level: {
            type: Number,
            default: 1,
        },
        lessonsCompleted: {
            type: Number,
            default: 0,
        },
        badgesEarned: {
            type: [String],
            default: [],
        },
        lastActivityAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

const TarbiyahUserStats = mongoose.model("TarbiyahUserStats", tarbiyahUserStatsSchema);

export default TarbiyahUserStats;
