import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

console.log("Type:", typeof pdf);
console.log("Is Array?", Array.isArray(pdf));
console.dir(pdf, { depth: 2 });

if (typeof pdf === 'function') {
    console.log("It IS a function!");
} else {
    console.log("It is NOT a function.");
}
