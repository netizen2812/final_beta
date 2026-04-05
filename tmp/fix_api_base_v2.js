const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve('frontend');
const apiBaseFile = path.join(frontendDir, 'lib', 'api.ts');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('dist') && file !== '.git') {
                results = results.concat(walk(fullPath));
            }
        } else {
            if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
                results.push(fullPath);
            }
        }
    });
    return results;
}

const files = walk(frontendDir);

// Patterns to match:
// 1. const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
// 2. const API_URL = (import.meta as any).env.VITE_API_URL || "http://localhost:5000";
// 3. const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api/analytics";

const pattern = /const (API_BASE|API_URL) = \(?((import\.meta\.env|\(import\.meta as any\)\.env)\.VITE_API_URL \|\| "http:\/\/localhost:5000")\)?/g;

files.forEach(file => {
    // Skip the api.ts file itself
    if (path.resolve(file) === path.resolve(apiBaseFile)) return;
    
    let content = fs.readFileSync(file, 'utf8');
    if (content.match(pattern)) {
        console.log(`Updating ${file}`);
        
        // Calculate relative path to lib/api
        let rel = path.relative(path.dirname(file), apiBaseFile).replace(/\\/g, '/').replace(/\.tsx?$/, '');
        if (!rel.startsWith('.')) rel = './' + rel;
        
        // Replace definition with import
        let newContent = content.replace(pattern, (match, name) => {
            if (name === 'API_URL') {
                return `import { API_BASE as API_URL } from '${rel}'`; // Removed trailing semicolon to handle string concatenation cases better
            } else {
                return `import { API_BASE } from '${rel}'`;
            }
        });
        
        // Fix potential semicolon issues from the previous replacement
        newContent = newContent.replace(/import { API_BASE } from '([^']+)'\s+;\s*\+/g, "import { API_BASE } from '$1';\nconst API_BASE_FULL = API_BASE +");
        
        // If the match was inside a class or function, we should ideally move the import to top,
        // but for now we'll just fix the syntax.
        
        if (content !== newContent) {
            fs.writeFileSync(file, newContent);
        }
    }
});
console.log("Finished API_BASE cleanup script (v2).");
