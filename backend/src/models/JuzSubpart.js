import mongoose from "mongoose";

const juzSubpartSchema = new mongoose.Schema(
    {
        juz: {
            type: Number,
            required: true,
            unique: true, // One entry per Juz (1-30)
        },
        parts: [{
            partNum: Number,
            startAyah: Number,
            endAyah: Number,
            description: String,
            surah: String, // e.g. "Al-Baqarah"
        }],
    },
    { timestamps: true }
);

const JuzSubpart = mongoose.model("JuzSubpart", juzSubpartSchema);
export default JuzSubpart;
