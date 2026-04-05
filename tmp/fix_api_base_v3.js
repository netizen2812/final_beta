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
const pattern = /const (API_BASE|API_URL) = \(?((import\.meta\.env|\(import\.meta as any\)\.env)\.VITE_API_URL \|\| "http:\/\/localhost:5000")\)?/g;

files.forEach(file => {
    if (path.resolve(file) === path.resolve(apiBaseFile)) return;
    
    let content = fs.readFileSync(file, 'utf8');
    if (content.match(pattern)) {
        console.log(`Updating ${file}`);
        
        let rel = path.relative(path.dirname(file), apiBaseFile).replace(/\\/g, '/').replace(/\.tsx?$/, '');
        if (!rel.startsWith('.')) rel = './' + rel;
        
        // 1. Add import at the top (if not already there)
        if (!content.includes(`import { API_BASE } from '${rel}';`) && !content.includes(`import { API_BASE as API_URL } from '${rel}';`)) {
             // Find first import or start of file
             const match = content.match(/^import /m);
             if (match) {
                 content = `import { API_BASE } from '${rel}';\n` + content;
             } else {
                 content = `import { API_BASE } from '${rel}';\n` + content;
             }
        }
        
        // 2. Replace definition with local constant (preserving any trailing text like + "/api/...")
        let newContent = content.replace(pattern, (match, name) => {
            return `const ${name} = API_BASE`;
        });
        
        if (content !== newContent) {
            fs.writeFileSync(file, newContent);
        }
    }
});
console.log("Finished API_BASE cleanup script (v3).");
