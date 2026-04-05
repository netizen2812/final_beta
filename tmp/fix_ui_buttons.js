const fs = require('fs');
const path = 'c:\\Users\\acer\\Downloads\\FaithTech\\FaithTech\\frontend\\features\\LiveClassRoom.tsx';
let content = fs.readFileSync(path, 'utf8');

// Desktop buttons
const desktopTarget = /<div className="grid grid-cols-2 gap-2">\s*<button onClick={() => handleScoreRecitation\(batchState.activeChildId!, currentSession.batchId!, 3\)}[\s\S]*?<button onClick={() => setShowAssignModal\(true\)} className="col-span-2 bg-indigo-500 hover:bg-indigo-400 text-white py-3 rounded-xl font-black text-\[9px\] uppercase flex items-center justify-center gap-2 transition-all active:scale-95"><BookOpen size={14}\/> Setup Lesson<\/button>\s*<\/div>/;
const desktopReplacement = `<div className="grid grid-cols-2 gap-2">
                         <button onClick={() => handleScoreRecitation(batchState.activeChildId!, currentSession.batchId!, 3)} className="bg-emerald-500 hover:bg-emerald-400 text-black py-3 rounded-xl font-black text-[9px] uppercase transition-all shadow-lg active:scale-95">Award +10 XP</button>
                         <button onClick={() => handleScoreRecitation(batchState.activeChildId!, currentSession.batchId!, 2)} className="bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl font-black text-[9px] uppercase transition-all shadow-lg active:scale-95">Award +7 XP</button>
                         <button onClick={() => handleScoreParticipation(batchState.activeChildId!, currentSession.batchId!)} className="bg-white/10 hover:bg-white/20 text-emerald-400 py-3 rounded-xl font-black text-[9px] uppercase border border-emerald-500/10 transition-all active:scale-95">Award +2 Participation XP</button>
                         <button onClick={() => setShowAssignModal(true)} className="bg-indigo-500 hover:bg-indigo-400 text-white py-3 rounded-xl font-black text-[9px] uppercase flex items-center justify-center gap-2 transition-all active:scale-95"><BookOpen size={14}/> Setup Lesson</button>
                      </div>`;

// Mobile buttons
const mobileTarget = /\{isMobile && batchState\?.activeChildId && \(\s*<div className="fixed bottom-0 left-0 right-0 p-6 bg-black\/80 backdrop-blur-3xl border-t border-white\/5 rounded-t-\[3rem\] z-30 flex items-center gap-4 animate-in slide-in-from-bottom duration-500">[\s\S]*?<\/div>\s*\)\}/;
const mobileReplacement = `{isMobile && batchState?.activeChildId && (
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-black/80 backdrop-blur-3xl border-t border-white/5 rounded-t-[3rem] z-30 flex flex-col gap-4 animate-in slide-in-from-bottom duration-500">
               <div className="flex gap-2">
                  <button onClick={() => handleScoreRecitation(batchState.activeChildId!, currentSession.batchId!, 3)} className="bg-emerald-500 hover:bg-emerald-400 text-black py-4 rounded-2xl font-black text-[10px] uppercase grow shadow-2xl transition-all">Award +10 XP</button>
                  <button onClick={() => handleScoreRecitation(batchState.activeChildId!, currentSession.batchId!, 2)} className="bg-amber-500 hover:bg-amber-400 text-black py-4 rounded-2xl font-black text-[10px] uppercase grow shadow-2xl transition-all">Award +7 XP</button>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => handleScoreParticipation(batchState.activeChildId!, currentSession.batchId!)} className="bg-white/10 text-emerald-400 px-6 py-4 rounded-2xl font-black text-[10px] uppercase border border-white/10 grow">Award +2 Participation XP</button>
                  <button onClick={() => setShowAssignModal(true)} className="bg-indigo-500 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase border border-indigo-500/20 shrink-0">Lesson</button>
               </div>
            </div>
          )}`;

const newContent = content.replace(desktopTarget, desktopReplacement).replace(mobileTarget, mobileReplacement);

if (content === newContent) {
    console.error('Replacement failed: Target not found.');
    process.exit(1);
}

fs.writeFileSync(path, newContent);
console.log('Successfully updated LiveClassRoom.tsx');
