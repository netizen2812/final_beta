import mongoose from "mongoose";

const mcqSchema = new mongoose.Schema({
    q: { type: String, required: true },
    options: [{ type: String, required: true }],
    answer: { type: String, required: true },
    reference: { type: String, required: true }
});

const lessonSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true }, // Keeping numeric ID for now to match frontend logic
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    type: { type: String, required: true }, // Ramadan, Stories, etc.
    duration: { type: String, required: true },
    // Icon handling: We'll store a string identifier for the icon (e.g., "Moon", "Sun")
    // The frontend will map this string to the actual Lucide component.
    iconName: { type: String, required: true },
    color: { type: String, required: true },
    locked: { type: Boolean, default: true },
    progress: { type: Number, default: 0 },
    stars: { type: Number, default: 0 },
    description: { type: String, required: true },
    xpReward: { type: Number, default: 50 },
    videoUrl: { type: String, required: true },
    mcqs: [mcqSchema]
}, { timestamps: true });

const Lesson = mongoose.model("Lesson", lessonSchema);

export default Lesson;
