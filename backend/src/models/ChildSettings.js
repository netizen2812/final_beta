import mongoose from "mongoose";

const childSettingsSchema = new mongoose.Schema(
    {
        child_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Child",
            required: true,
            unique: true,
        },
        daily_limit_minutes: {
            type: Number,
            default: 45,
        },
        age_filter: {
            type: String,
            enum: ["5-7 Years", "8-10 Years", "11-13 Years", "Teens"],
            default: "8-10 Years",
        },
        topics_enabled: {
            type: Map,
            of: Boolean,
            default: {
                History: true,
                Quran: true,
                Arabic: true,
                Character: true,
            },
        },
        report_email_enabled: {
            type: Boolean,
            default: true,
        },
        weekend_buffer_enabled: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const ChildSettings = mongoose.model("ChildSettings", childSettingsSchema);

export default ChildSettings;
