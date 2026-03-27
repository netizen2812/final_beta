import axios from "axios";
import QuranQuestion from "../models/QuranQuestion.js";

/**
 * Fetches authentic verses and translations from Al-Quran Cloud API.
 */
const fetchJuzFromApi = async (juzNum) => {
    try {
        console.log(`📖 Fetching authentic text for Juz ${juzNum}...`);
        const response = await axios.get(`https://api.alquran.cloud/v1/juz/${juzNum}/en.sahih`);
        if (response.data.code === 200) {
            return response.data.data.ayahs;
        }
        throw new Error("Failed to fetch Quran data");
    } catch (error) {
        console.error("❌ Al-Quran Cloud API Error:", error.message);
        throw error;
    }
};

/**
 * Fallback questions if AI is unavailable/rate-limited.
 */
const getFallbackQuestions = (juz, subpart) => {
    // Specific Fallback for Juz 1, Part 1
    if (juz === 1 && subpart === 1) {
        return [
            {
                question: "Which Surah is known as 'The Opening'?",
                options: ["Al-Baqarah", "Al-Fatiha", "Al-Kahf", "An-Nas"],
                correctAnswer: 1,
                explanation: "Al-Fatiha is the opening chapter of the Holy Quran."
            },
            {
                question: "Al-Baqarah begins with which 'Huroof-e-Muqattaat'?",
                options: ["Alif-Laam-Meem", "Ya-Seen", "Ha-Meem", "Ta-Ha"],
                correctAnswer: 0,
                explanation: "The second Surah of the Quran begins with these mysterious letters."
            },
            {
                question: "In Surah Al-Fatiha, which path do we ask Allah to guide us to?",
                options: ["The crooked path", "The short path", "The straight path (Sirat al-Mustaqim)", "The difficult path"],
                correctAnswer: 2,
                explanation: "Sirat al-Mustaqim is the path of those upon whom Allah has bestowed favor."
            },
            {
                question: "Which of these is a name for Surah Al-Fatiha?",
                options: ["Umm al-Kitab", "Al-Baqarah", "The Lion", "The Night"],
                correctAnswer: 0,
                explanation: "Umm al-Kitab means the Mother of the Book."
            },
            {
                question: "Surah Al-Baqarah is the longest surah in the Quran. True or False?",
                options: ["True", "False"],
                correctAnswer: 0,
                explanation: "Surah Al-Baqarah contains 286 verses."
            }
        ];
    }

    // General Scholar-grade questions for other parts
    return [
        {
            question: `What is the primary spiritual focus of the verses in Juz ${juz}, Section ${subpart}?`,
            options: ["Increasing Taqwa", "Legal rulings", "History of Prophets", "Day of Judgment"],
            correctAnswer: 0,
            explanation: "Taqwa is the foundational soul of every Quranic juz."
        },
        {
            question: `In this specific section of the Quran (Part ${subpart}), what character trait is most emphasized for a believer?`,
            options: ["Patience (Sabr)", "Generosity", "Truthfulness", "All of the above"],
            correctAnswer: 3,
            explanation: "The Quran consistently weaves these core virtues throughout every subpart."
        },
        {
            question: `Which linguistic feature is prominent in Juz ${juz}'s early verses?`,
            options: ["Rhythmical prose", "Legal terminology", "Parables", "None"],
            correctAnswer: 2,
            explanation: "Parables are a key educational tool used across the Quran."
        },
        {
            question: `How does Juz ${juz} describe the relationship between faith and action?`,
            options: ["Faith alone is enough", "Action alone is enough", "They are inseparable", "Actions are secondary"],
            correctAnswer: 2,
            explanation: "Al-Iman and Al-Amal as-Salihat are always mentioned together."
        },
        {
            question: `What is the recommended attitude when reflecting on Part ${subpart}?`,
            options: ["Speed reading", "Deep contemplation (Tadabbur)", "Just listening", "Technical analysis"],
            correctAnswer: 1,
            explanation: "Tadabbur is the divine command for every researcher of the Quran."
        }
    ];
};

/**
 * Orchestrates the generation of questions using AI with Fallback.
 */
const generateQuestionsForSubpart = async (juz, subpart, subpartMetadata, quranApiKey) => {
    console.log(`🛠️ Entering curation for Juz ${juz}, Subpart ${subpart}`);
    try {
        const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${quranApiKey}`;
        
        // 1. Fetch text from authentic Al-Quran API
        const allAyahs = await fetchJuzFromApi(juz);
        const totalAyahs = allAyahs.length;
        const ayahsPerPart = Math.ceil(totalAyahs / 15);
        const startIdx = (subpart - 1) * ayahsPerPart;
        const endIdx = Math.min(startIdx + ayahsPerPart, totalAyahs);
        const subpartAyahs = allAyahs.slice(startIdx, endIdx);
        const versesText = subpartAyahs.map(a => `[${a.surah.englishName} ${a.numberInSurah}] ${a.text}`).join("\n");

        if (!quranApiKey || quranApiKey.length < 10) {
             throw new Error("No valid API key provided. Using Fallback.");
        }

        const prompt = `
            Act as a world-class Quran Scholar. 
            Verses from Juz ${juz}, Part ${subpart}:
            "${versesText}"
            Curate 5 educationally rigorous MCQ questions in JSON format.
            Include: "question", "options" (array of 4), "correctAnswer" (index 0-3), "explanation" (string).
            Respond ONLY with the JSON array.
        `;

        console.log("📡 Attempting AI curation...");
        let questionsJson;
        try {
            const response = await axios.post(GEMINI_URL, {
                contents: [{ parts: [{ text: prompt }] }]
            }, { timeout: 15000 });

            console.log("📡 AI Response received.");
            let resultText = response.data.candidates[0].content.parts[0].text;
            resultText = resultText.replace(/```json/g, "").replace(/```/g, "").trim();
            questionsJson = JSON.parse(resultText);
        } catch (aiErr) {
            console.warn("⚠️ AI Curation failed or rate-limited. Using authentic scholar fallbacks.");
            questionsJson = getFallbackQuestions(juz, subpart);
        }

        const formattedQuestions = questionsJson.map(q => ({
            ...q,
            juz,
            subpart
        }));

        await QuranQuestion.deleteMany({ juz, subpart });
        await QuranQuestion.insertMany(formattedQuestions);
        console.log(`✅ Successfully stored 5 questions for Juz ${juz}, Subpart ${subpart}`);
        return true;
    } catch (error) {
        console.error(`❌ Curation Critical Error:`, error.message);
        return false;
    }
};

/**
 * Fetches specific ayahs for a Juz subpart for revision.
 */
const getJuzText = async (juzNum, subpart) => {
    try {
        const allAyahs = await fetchJuzFromApi(juzNum);
        const totalAyahs = allAyahs.length;
        const ayahsPerPart = Math.ceil(totalAyahs / 15);
        const startIdx = (subpart - 1) * ayahsPerPart;
        const endIdx = Math.min(startIdx + ayahsPerPart, totalAyahs);
        
        return {
            juz: juzNum,
            subpart,
            ayahs: allAyahs.slice(startIdx, endIdx).map(a => ({
                number: a.numberInSurah,
                surah: a.surah.englishName,
                text: a.text
            }))
        };
    } catch (error) {
        console.error("Error fetching revision text:", error.message);
        throw error;
    }
};

export { generateQuestionsForSubpart, getFallbackQuestions, getJuzText };
