const fs = require('fs');
const path = 'c:\\Users\\acer\\Downloads\\FaithTech\\FaithTech\\frontend\\features\\LiveClassRoom.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Scholar Stage - Dual Pane & XP Buttons
const scholarTarget = /const renderScholarStage = \(\) => \{[\s\S]*?return \(\s*<div className="flex flex-col h-full bg-\[#040404\]">[\s\S]*?\{activeSessions\.map\(session => \([\s\S]*?<\/div>\s*\}\)\}\s*<\/div>\s*<\/div>\s*<\/div>\s*\{[\s\S]*?AgoraVideoPane[\s\S]*?<\/div>\s*\}\s*<\/div>/;

const scholarReplacement = `const renderScholarStage = () => {
    if (!currentSession) return null;
    return (
      <div className="flex flex-col h-full bg-[#040404]">
         {/* STUDENT SPEED DOCK */}
         <div className="flex-none p-4 pb-0 z-20">
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 items-center">
              {activeSessions.map(session => (
                <div 
                  key={session._id} 
                  onClick={() => handleSetTurn(session.childId, session.batchId!)}
                  className={\`p-1 rounded-3xl transition-all duration-500 cursor-pointer shrink-0 \${batchState?.activeChildId === session.childId ? 'bg-emerald-500 scale-105 shadow-[0_0_30px_rgba(16,185,129,0.4)]' : 'bg-white/5 opacity-40 hover:opacity-100 hover:scale-105'}\`}
                >
                   <div className="bg-[#111] rounded-[1.4rem] px-6 py-4 flex items-center gap-4">
                      <div className={\`w-10 h-10 rounded-full flex items-center justify-center font-black transition-colors \${batchState?.activeChildId === session.childId ? 'bg-emerald-500 text-black shadow-inner' : 'bg-emerald-900/20 text-emerald-500'}\`}>
                        {session.studentName?.[0] || 'S'}
                      </div>
                      <div className="flex flex-col">
                        <span className={\`text-[10px] font-black uppercase tracking-widest transition-colors \${batchState?.activeChildId === session.childId ? 'text-white' : 'text-gray-400'}\`}>{session.studentName}</span>
                        {batchState?.activeChildId === session.childId && (
                           <span className="text-[8px] text-red-500 font-bold uppercase animate-pulse">Reciting</span>
                        )}
                      </div>
                   </div>
                </div>
              ))}
            </div>
         </div>

         {/* MAIN STAGE (DUAL PANE) */}
         <div className="flex-1 relative flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
            {/* LEFT: VIDEO GRID */}
            <div className={\`flex-1 bg-black rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden relative group transition-all duration-700 \${batchState?.activeChildId ? 'md:flex-[0.4]' : 'md:flex-1'}\`}>
               <AgoraVideoPane
                 appId={currentSession.agoraAppId || ""}
                 token={currentSession.agoraToken || ""}
                 channel={currentSession.channel || currentSession.batchId || ""}
                 uid={getNumericUid(user?.id || '')}
                 role="scholar"
                 layout="grid"
                 scholarId={currentSession.scholarId}
               />
               <div className="absolute top-8 left-8 py-2 px-4 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-2xl flex items-center gap-3 z-30">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] text-white font-black uppercase tracking-widest">Active Class • {activeSessions.length} Participants</span>
               </div>
            </div>

            {/* RIGHT: SYNCED QURAN (Scholar Exclusive follow student) */}
            {batchState?.activeChildId && (
               <div className="flex-1 bg-[#fdfaf3] rounded-[3rem] border border-black/5 shadow-2xl overflow-hidden relative group flex flex-col md:flex-1 animate-in slide-in-from-right duration-700">
                  <div className="absolute top-8 left-8 py-2 px-4 bg-black/5 backdrop-blur-3xl border border-black/10 rounded-2xl flex items-center gap-3 z-30">
                    <BookOpen size={12} className="text-emerald-700" />
                    <span className="text-[9px] text-emerald-900 font-black uppercase tracking-widest">Monitoring Student Quran</span>
                  </div>
                  <QuranPage
                    onBack={() => {}}
                    sessionCurrentSurah={batchState.activeParticipants?.find(p => p.childId === batchState.activeChildId)?.currentSurah}
                    sessionCurrentAyah={batchState.activeParticipants?.find(p => p.childId === batchState.activeChildId)?.currentAyah}
                    onAyahClick={() => {}}
                    readOnly={true}
                  />
               </div>
            )}

            {!isMobile && batchState?.activeChildId && (
               <div className="w-[280px] bg-[#0c0c0c] rounded-[2rem] border border-white/5 p-6 flex flex-col gap-6 shadow-2xl animate-in slide-in-from-right-12 duration-700">
                  <div className="text-center space-y-1">
                     <p className="text-[9px] text-emerald-500/60 font-black uppercase tracking-[0.2em]">Evaluating</p>
                     <h3 className="text-xl font-black text-white truncate px-2">{activeSessions.find(s => s.childId === batchState.activeChildId)?.studentName}</h3>
                  </div>

                  <div className="space-y-4">
                     <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-4 text-center">Class Consensus</p>
                        <div className="flex items-center justify-around gap-2 px-2">
                           <div className="text-center">
                              <span className="text-2xl font-black text-emerald-400">{batchState?.currentPromptAnswers?.filter(a => a.answer === 'yes').length || 0}</span>
                              <p className="text-[9px] text-emerald-500/40 uppercase font-black tracking-tighter mt-1">Perfect</p>
                           </div>
                           <div className="w-px h-6 bg-white/5" />
                           <div className="text-center">
                              <span className="text-2xl font-black text-red-400">{batchState?.currentPromptAnswers?.filter(a => a.answer === 'no').length || 0}</span>
                              <p className="text-[9px] text-red-500/40 uppercase font-black tracking-tighter mt-1">Mistakes</p>
                           </div>
                        </div>
                        
                        {!batchState?.promptEvaluated && (batchState?.currentPromptAnswers?.length || 0) > 0 && (
                           <div className="grid grid-cols-2 gap-2 mt-4">
                              <button onClick={() => handleEvaluatePrompt('yes')} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 py-2 rounded-xl font-black text-[9px] uppercase border border-emerald-500/20 transition-all">Confirm Perfect</button>
                              <button onClick={() => handleEvaluatePrompt('no')} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-xl font-black text-[9px] uppercase border border-red-500/20 transition-all">Confirm Mistake</button>
                           </div>
                        )}
                     </div>

                     <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleScoreRecitation(batchState.activeChildId!, currentSession.batchId!, 4)} className="bg-emerald-500 hover:bg-emerald-400 text-black py-3 rounded-xl font-black text-[9px] uppercase transition-all shadow-lg active:scale-95">Excel (+10)</button>
                        <button onClick={() => handleScoreRecitation(batchState.activeChildId!, currentSession.batchId!, 3)} className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black text-[9px] uppercase transition-all shadow-lg active:scale-95">Good (+7)</button>
                        <button onClick={() => handleScoreRecitation(batchState.activeChildId!, currentSession.batchId!, 2)} className="bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl font-black text-[9px] uppercase transition-all shadow-lg active:scale-95">Avg (+5)</button>
                        <button onClick={() => handleScoreRecitation(batchState.activeChildId!, currentSession.batchId!, 1)} className="bg-red-500/20 hover:bg-red-500/30 text-red-500 py-3 rounded-xl font-black text-[9px] uppercase transition-all shadow-lg active:scale-95 border border-red-500/10">Need (+2)</button>
                        <button onClick={() => handleScoreParticipation(batchState.activeChildId!, currentSession.batchId!)} className="col-span-1 bg-white/10 hover:bg-white/20 text-emerald-400 py-3 rounded-xl font-black text-[9px] uppercase border border-emerald-500/10 transition-all active:scale-95">Partic (+2)</button>
                        <button onClick={() => setShowAssignModal(true)} className="bg-indigo-500 hover:bg-indigo-400 text-white py-3 rounded-xl font-black text-[9px] uppercase flex items-center justify-center gap-2 transition-all active:scale-95"><BookOpen size={14}/> Lesson</button>
                     </div>
                  </div>

                  <button onClick={() => setConfirmEndClass(currentSession.batchId!)} className="mt-auto w-full py-3 text-red-500/60 hover:text-red-400 font-black text-[10px] uppercase tracking-widest transition-colors mb-2">Terminate Classroom</button>
               </div>
            )}
         </div>

         {isMobile && batchState?.activeChildId && (
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-black/80 backdrop-blur-3xl border-t border-white/5 rounded-t-[3rem] z-30 flex flex-col gap-4 animate-in slide-in-from-bottom duration-500">
               <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleScoreRecitation(batchState.activeChildId!, currentSession.batchId!, 4)} className="bg-emerald-500 hover:bg-emerald-400 text-black py-3 rounded-2xl font-black text-[10px] uppercase grow shadow-2xl transition-all">Excel (+10)</button>
                  <button onClick={() => handleScoreRecitation(batchState.activeChildId!, currentSession.batchId!, 3)} className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-2xl font-black text-[10px] uppercase grow shadow-2xl transition-all">Good (+7)</button>
                  <button onClick={() => handleScoreRecitation(batchState.activeChildId!, currentSession.batchId!, 2)} className="bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-2xl font-black text-[10px] uppercase grow shadow-2xl transition-all">Avg (+5)</button>
                  <button onClick={() => handleScoreRecitation(batchState.activeChildId!, currentSession.batchId!, 1)} className="bg-red-500/20 hover:bg-red-500/30 text-red-500 py-3 rounded-2xl font-black text-[10px] uppercase grow shadow-2xl transition-all border border-red-500/10">Need (+2)</button>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => handleScoreParticipation(batchState.activeChildId!, currentSession.batchId!)} className="bg-white/10 text-emerald-400 px-6 py-4 rounded-2xl font-black text-[10px] uppercase border border-white/10 grow">Participation</button>
                  <button onClick={() => setShowAssignModal(true)} className="bg-indigo-500 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase border border-indigo-500/20 shrink-0">Lesson</button>
               </div>
            </div>
         )}`;

const newContent = content.replace(scholarTarget, scholarReplacement);

if (content === newContent) {
    console.error('Replacement failed: Scholar Target not found.');
    process.exit(1);
}

fs.writeFileSync(path, newContent);
console.log('Successfully updated Scholar Stage in LiveClassRoom.tsx');
