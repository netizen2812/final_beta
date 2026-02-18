import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const pdfModule = require('pdf-parse');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PDF_PATH = path.join(__dirname, 'rag/four-madhabs.pdf');

async function testPdf() {
    try {
        console.log("Reading PDF from:", PDF_PATH);
        if (!fs.existsSync(PDF_PATH)) {
            console.error("PDF not found!");
            return;
        }
        const buffer = fs.readFileSync(PDF_PATH);

        console.log("Attempt 1: pdfModule(buffer)");
        try {
            const data = await pdfModule(buffer);
            console.log("✅ Success! Length:", data.text.length);
            return;
        } catch (e) {
            console.log("❌ Failed:", e.message);
        }

        console.log("Attempt 2: pdfModule.PDFParse(buffer)");
        try {
            // Check if it's a function or class
            if (typeof pdfModule.PDFParse === 'function') {
                // Try as function
                // But wait, usually main export is the function. 
                // If previous debug showed it's a class/function "class (anonymous)"
                // Maybe it needs 'new'? 
                // But pdf-parse main usage is usually a promise returning function.
            }
            // Let's try calling it if possible, or new.
            // But actually, maybe the library I installed is NOT 'pdf-parse' but something else?
            // "pdf-parse" v1.1.1 source exports a function that returns a Promise.
            // Why did require return an object?

            // Maybe it is `import * as pdf` issue?
            // In CJS, `require` returns `module.exports`.
        } catch (e) {
            console.log("❌ Failed:", e.message);
        }

    } catch (err) {
        console.error("Global Error:", err);
    }
}

testPdf();
