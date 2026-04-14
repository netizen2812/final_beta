import React from 'react';
import { BookOpen } from 'lucide-react';

interface ScholarControlPanelProps {
  activeChildId: string | null;
  batchId: string;
  activeSessions: any[];
  batchState: any;
  onScoreRecitation: (childId: string, batchId: string, rating: number) => void;
  onScoreParticipation: (childId: string, batchId: string) => void;
  onEvaluatePrompt: (correctAnswer: 'yes' | 'no') => void;
  onShowAssignModal: () => void;
  isMobile?: boolean;
}

export const ScholarControlPanel: React.FC<ScholarControlPanelProps> = ({
  activeChildId,
  batchId,
  activeSessions,
  batchState,
  onScoreRecitation,
  onScoreParticipation,
  onEvaluatePrompt,
  onShowAssignModal,
  isMobile
}) => {
  if (!activeChildId) return null;

  const activeStudentName = activeSessions.find(s => s.childId === activeChildId)?.studentName;

  const renderButtons = () => (
    <div className="space-y-4">
      <div className="p-4 bg-white/5 border border-emerald-700/20 rounded-2xl">
        <p className="text-[9px] text-emerald-400/60 font-bold uppercase tracking-widest mb-3 text-center">Class Consensus</p>
        <div className="flex items-center justify-around gap-2 px-2">
          <div className="text-center">
            <span className="text-2xl font-black text-emerald-400">{batchState?.currentPromptAnswers?.filter((a: any) => a.answer === 'yes').length || 0}</span>
            <p className="text-[9px] text-emerald-500/50 uppercase font-black tracking-tighter mt-1">Perfect</p>
          </div>
          <div className="w-px h-6 bg-emerald-700/30" />
          <div className="text-center">
            <span className="text-2xl font-black text-red-400">{batchState?.currentPromptAnswers?.filter((a: any) => a.answer === 'no').length || 0}</span>
            <p className="text-[9px] text-red-400/50 uppercase font-black tracking-tighter mt-1">Mistakes</p>
          </div>
        </div>
        
        {!batchState?.promptEvaluated && (batchState?.currentPromptAnswers?.length || 0) > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button onClick={() => onEvaluatePrompt('yes')} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 py-2 rounded-xl font-black text-[9px] uppercase border border-emerald-500/30 transition-all">✓ Perfect</button>
            <button onClick={() => onEvaluatePrompt('no')} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-xl font-black text-[9px] uppercase border border-red-500/20 transition-all">✗ Mistake</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => onScoreRecitation(activeChildId, batchId, 4)} className="bg-emerald-500 hover:bg-emerald-400 text-black py-3 rounded-xl font-black text-[9px] uppercase transition-all shadow-lg shadow-emerald-500/20 active:scale-95">Excel (+10)</button>
        <button onClick={() => onScoreRecitation(activeChildId, batchId, 3)} className="bg-emerald-700 hover:bg-emerald-600 text-white py-3 rounded-xl font-black text-[9px] uppercase transition-all shadow-lg active:scale-95">Good (+7)</button>
        <button onClick={() => onScoreRecitation(activeChildId, batchId, 2)} className="bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl font-black text-[9px] uppercase transition-all shadow-lg shadow-amber-500/20 active:scale-95">Avg (+5)</button>
        <button onClick={() => onScoreRecitation(activeChildId, batchId, 1)} className="bg-red-900/30 hover:bg-red-800/40 text-red-400 py-3 rounded-xl font-black text-[9px] uppercase transition-all active:scale-95 border border-red-700/30">Need (+2)</button>
        <button onClick={() => onScoreParticipation(activeChildId, batchId)} className="col-span-1 bg-white/10 hover:bg-white/20 text-emerald-300 py-3 rounded-xl font-black text-[9px] uppercase border border-emerald-700/20 transition-all active:scale-95">Partic (+2)</button>
        <button onClick={onShowAssignModal} className="bg-indigo-600/60 hover:bg-indigo-500 text-white py-3 rounded-xl font-black text-[9px] uppercase flex items-center justify-center gap-2 transition-all active:scale-95 border border-indigo-500/30"><BookOpen size={14}/> Lesson</button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-[#011a11]/95 backdrop-blur-3xl border-t border-emerald-700/30 rounded-t-[2.5rem] z-30 flex flex-col gap-3 p-5 animate-in slide-in-from-bottom duration-500">
        <div className="w-12 h-1 bg-emerald-700/40 rounded-full mx-auto mb-1" />
        <div className="grid grid-cols-2 gap-2">
           <button onClick={() => onScoreRecitation(activeChildId, batchId, 4)} className="bg-emerald-500 text-black py-3 rounded-2xl font-black text-[10px] uppercase transition-all active:scale-95">Excel (+10)</button>
           <button onClick={() => onScoreRecitation(activeChildId, batchId, 3)} className="bg-emerald-700 text-white py-3 rounded-2xl font-black text-[10px] uppercase transition-all active:scale-95">Good (+7)</button>
        </div>
        <div className="flex gap-2">
           <button onClick={() => onScoreParticipation(activeChildId, batchId)} className="bg-white/10 text-emerald-300 px-6 py-3 rounded-2xl font-black text-[10px] uppercase border border-emerald-700/20 grow">Participation</button>
           <button onClick={onShowAssignModal} className="bg-indigo-600/60 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase border border-indigo-500/30 shrink-0">Lesson</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[280px] bg-[#022c22]/80 backdrop-blur-xl rounded-[2rem] border border-emerald-700/30 p-6 flex flex-col gap-5 shadow-2xl animate-in slide-in-from-right-12 duration-700">
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent -mx-6 mb-1" />
      <div className="text-center space-y-1">
        <p className="text-[9px] text-emerald-400/60 font-black uppercase tracking-[0.2em]">Now Evaluating</p>
        <h3 className="text-lg font-serif font-bold text-white truncate px-2">{activeStudentName}</h3>
      </div>
      {renderButtons()}
    </div>
  );
};
