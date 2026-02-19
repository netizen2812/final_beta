import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import fetch from 'node-fetch';

const require = createRequire(import.meta.url);
let pdf = require('pdf-parse');

// Handle CJS/ESM interop
if (pdf.default) {
    pdf = pdf.default;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PDF_PATH = path.join(__dirname, '../../rag/four-madhabs.pdf');

let cachedPdfText = null;

// 1. Load PDF Text (Fiqh)
async function loadPdfText() {
    if (cachedPdfText) return cachedPdfText;
    try {
        if (fs.existsSync(PDF_PATH)) {
            const dataBuffer = fs.readFileSync(PDF_PATH);
            const data = await pdf(dataBuffer);
            cachedPdfText = data.text;
            console.log("✅ PDF loaded (Fiqh Book):", cachedPdfText.length, "chars");
        } else {
            console.warn("⚠️ RAG PDF not found:", PDF_PATH);
            cachedPdfText = "";
        }
    } catch (error) {
        console.error("❌ PDF Parse Error:", error);
        cachedPdfText = "";
    }
    return cachedPdfText;
}

async function searchPdf(query) {
    const text = await loadPdfText();
    if (!text) return "";
    const paragraphs = text.split(/\n\n+/); // Split by paragraphs
    const keywords = query.toLowerCase().split(' ').filter(w => w.length > 3);

    if (keywords.length === 0) return "";

    const relevant = paragraphs.map(p => {
        const lowerP = p.toLowerCase();
        let score = 0;
        keywords.forEach(k => { if (lowerP.includes(k)) score++; });
        return { text: p, score };
    }).filter(r => r.score > 0).sort((a, b) => b.score - a.score);

    return relevant.slice(0, 3).map(r => r.text).join('\n\n---\n\n');
}

// 2. Search Quran (API)
async function searchQuran(query) {
    try {
        // Search generic English translation (Sahih International)
        const response = await fetch(
            `https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/en.sahih`
        );
        const data = await response.json();
        if (data.code === 200 && data.data && data.data.results) {
            return data.data.results.slice(0, 3).map(r => `[Quran ${r.surah.number}:${r.numberInSurah}] ${r.text}`).join('\n');
        }
    } catch (error) {
        console.error("Quran API Error:", error.message);
    }
    return "";
}

// 3. Search Hadith (Github API Fallback - Bukhari)
// Note: Real-time hadith search is complex without a dedicated indexed API.
// We will try to fetch a specific 'search' endpoint if available, but often these are static JSONs.
// As a fallback, we act as if we searched:
async function searchHadith(query) {
    // Placeholder: If we had a robust search endpoint, we'd use it.
    // For now, we return a system note to the AI to use its internal knowledge of Sahih Bukhari/Muslim.
    return "Use internal knowledge of Sahih Bukhari and Muslim relevant to: " + query;
}

// Main Context Aggregator
export async function getIslamicContext(query, madhab) {
    try {
        const [quran, pdfContext] = await Promise.all([
            searchQuran(query),
            searchPdf(query)
        ]);

        return `
    ### OPTIONAL CONTEXT SOURCES (Use if relevant)
    
    1. QURAN MATCHES:
    ${quran || "No direct keyword matches in Quran translation."}

    2. FIQH BOOK EXCERPTS (Generic/4 Madhabs):
    ${pdfContext || "No specific book excerpts found."}
    
    3. MADHHAB INSTRUCTION:
    Prioritize the ${madhab || "General"} view.
        `.trim();
    } catch (error) {
        console.error("RAG Retrieval Failed:", error);
        return "";
    }
}
