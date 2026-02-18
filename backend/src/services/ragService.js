import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import fetch from 'node-fetch';

const require = createRequire(import.meta.url);
let pdf = require('pdf-parse');

// Handle CJS/ESM interop weirdness
if (pdf.default) {
    pdf = pdf.default;
}

console.log("PDF Import Type:", typeof pdf);
console.log("PDF Import Keys:", Object.keys(pdf));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the PDF book
const PDF_PATH = path.join(__dirname, '../../rag/four-madhabs.pdf');

let cachedPdfText = null;

// Load PDF text once and cache it
async function loadPdfText() {
    if (cachedPdfText) return cachedPdfText;

    try {
        if (fs.existsSync(PDF_PATH)) {
            const dataBuffer = fs.readFileSync(PDF_PATH);
            let data;
            try {
                data = await pdf(dataBuffer);
            } catch (e) {
                // Fallback for weird object export
                if (pdf.PDFParse) {
                    data = await new pdf.PDFParse(dataBuffer);
                } else {
                    throw e;
                }
            }

            cachedPdfText = data.text;
            console.log("✅ PDF loaded successfully length:", cachedPdfText.length);
        } else {
            console.warn("⚠️ RAG PDF not found at:", PDF_PATH);
            cachedPdfText = "";
        }
    } catch (error) {
        console.error("❌ Failed to parse PDF:", error);
        cachedPdfText = "";
    }
    return cachedPdfText;
}

// Search PDF for keywords
async function searchPdf(query) {
    const text = await loadPdfText();
    if (!text) return "";

    // Simple keyword matching for now - find relevant chunks
    // Split by double newlines to get paragraphs
    const paragraphs = text.split(/\n\n+/);
    const keywords = query.toLowerCase().split(' ').filter(w => w.length > 3);

    if (keywords.length === 0) return "";

    const relevantParagraphs = paragraphs.filter(p => {
        const lowerP = p.toLowerCase();
        // Count how many keywords match
        const matchCount = keywords.reduce((acc, k) => lowerP.includes(k) ? acc + 1 : acc, 0);
        return matchCount > 0;
    });

    // Return top 3 paragraphs sorted by match density
    return relevantParagraphs
        .sort((a, b) => b.length - a.length) // Simplified sort (heuristic)
        .slice(0, 3)
        .join('\n\n---\n\n');
}


// Search Quran (API)
async function searchQuran(query) {
    try {
        const response = await fetch(
            `https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/en.sahih`
        );
        const data = await response.json();
        if (data.code === 200 && data.data && data.data.results) {
            return data.data.results.slice(0, 3).map(r => `[Quran ${r.surah.number}:${r.numberInSurah}] ${r.text}`).join('\n');
        }
    } catch (error) {
        console.error("Quran API Error:", error);
    }
    return "";
}

// Search Hadith (Sunnah.com API or Fallback)
async function searchHadith(query) {
    // NOTE: Using a public free API as fallback since provided key format is unverified for specific endpoint
    // Fallback to https://github.com/fawazahmed0/hadith-api (mock logic or similar free source)
    // For now, valid robust search requires a known endpoint.
    // We will return a placeholder generic advice if API fails, or try a known free search if available.

    // Try simple search on a free endpoint if possible
    // Using a mock implementation for now as specific public Hadith Search API is rare without key
    // But we will try to find *some* context if we can.

    return "";
}

export async function getIslamicContext(query, madhab) {
    const [quran, pdfContext] = await Promise.all([
        searchQuran(query),
        searchPdf(query)
    ]);

    return `
    CONTEXT SOURCES:
    
    1. QURAN SCRIPTURE:
    ${quran || "No specific verses found."}

    2. FIQH BOOK (Four Madhhabs):
    ${pdfContext || "No specific book excerpts found."}
    
    3. MADHHAB EMPHASIS:
    Please answer primarily according to the ${madhab} school of thought.
    If the text above contains specific mentions of ${madhab}, prioritize them.
  `;
}
