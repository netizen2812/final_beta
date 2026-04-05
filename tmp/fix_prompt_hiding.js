const fs = require('fs');
const path = 'c:\\Users\\acer\\Downloads\\FaithTech\\FaithTech\\frontend\\features\\LiveClassRoom.tsx';
let content = fs.readFileSync(path, 'utf8');

// Hide engagement success box
const promptTarget = /const myAnswer = batchState\?\.currentPromptAnswers\?\.find\(a => a\.childId === currentSession\.childId\);\s*if \(batchState\?\.promptEvaluated \|\| myAnswer\) \{[\s\S]*?return \(\s*<div className="bg-\[#111\]\/90 backdrop-blur-3xl p-8 rounded-\[3rem\] border border-emerald-500\/20 shadow-3xl text-center flex flex-col items-center gap-4 animate-in slide-in-from-bottom-12 duration-700">[\s\S]*?<\/div>\s*\);\s*\}/;
const promptReplacement = `const myAnswer = batchState?.currentPromptAnswers?.find(a => a.childId === currentSession.childId);
                  if (batchState?.promptEvaluated || myAnswer) {
                     return null;
                  }`;

let newContent = content.replace(promptTarget, promptReplacement);

if (content === newContent) {
    console.error('Replacement failed: Prompt Target not found.');
    process.exit(1);
}

fs.writeFileSync(path, newContent);
console.log('Successfully updated Prompt Hiding in LiveClassRoom.tsx');
