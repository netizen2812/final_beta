import React, { useState, memo } from 'react';
import { BookOpen, Award, CheckCircle2 } from 'lucide-react';

interface ScholarControlPanelProps {
  activeChildId: string | null;
  batchId: string;
  activeSessions: any[];
  batchState: any;
  onScoreRecitation: (childId: string, batchId: string, rating: number, correctAnswer?: 'yes' | 'no') => void;
  onScoreParticipation: (childId: string, batchId: string) => void;
  onEvaluatePrompt: (correctAnswer: 'yes' | 'no') => void;
  onSetTurn: (childId: string | null, batchId: string) => void;
  onShowAssignModal: () => void;
  isMobile?: boolean;
}

const ScholarControlPanelComponent: React.FC<ScholarControlPanelProps> = ({
  activeChildId,
  batchId,
  activeSessions,
  batchState,
  onScoreRecitation,
  onScoreParticipation,
  onEvaluatePrompt,
  onSetTurn,
  onShowAssignModal,
  isMobile
}) => {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedCorrectAnswer, setSelectedCorrectAnswer] = useState<'yes' | 'no' | null>(null);

  if (!activeChildId) return null;

  const activeStudentName = activeSessions.find(s => s.childId === activeChildId)?.studentName;

  const handleFinishRecitation = () => {
    if (selectedRating !== null) {
      onScoreRecitation(activeChildId, batchId, selectedRating, selectedCorrectAnswer || undefined);
      // Wait a tiny bit for the XP event to broadcast before shutting the view
      setTimeout(() => {
        onSetTurn(null, batchId);
        setSelectedRating(null);
        setSelectedCorrectAnswer(null);
      }, 500);
    }
  };

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
        
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button 
            onClick={() => setSelectedCorrectAnswer('yes')} 
            className={`py-2 rounded-xl font-black text-[9px] uppercase border transition-all ${selectedCorrectAnswer === 'yes' ? 'bg-emerald-500 text-black border-white shadow-lg' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'}`}
          >
            ✓ Perfect
          </button>
          <button 
            onClick={() => setSelectedCorrectAnswer('no')} 
            className={`py-2 rounded-xl font-black text-[9px] uppercase border transition-all ${selectedCorrectAnswer === 'no' ? 'bg-red-500 text-white border-white shadow-lg' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}
          >
            ✗ Mistake
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setSelectedRating(4)} className={`py-3 rounded-xl font-black text-[9px] uppercase transition-all shadow-lg active:scale-95 ${selectedRating === 4 ? 'bg-emerald-400 text-black ring-2 ring-white shadow-emerald-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>Excel (+10)</button>
        <button onClick={() => setSelectedRating(3)} className={`py-3 rounded-xl font-black text-[9px] uppercase transition-all shadow-lg active:scale-95 ${selectedRating === 3 ? 'bg-emerald-600 text-white ring-2 ring-white shadow-emerald-700/40' : 'bg-emerald-700/20 text-emerald-500 border border-emerald-700/30'}`}>Good (+7)</button>
        <button onClick={() => setSelectedRating(2)} className={`py-3 rounded-xl font-black text-[9px] uppercase transition-all shadow-lg active:scale-95 ${selectedRating === 2 ? 'bg-amber-400 text-black ring-2 ring-white shadow-amber-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>Avg (+5)</button>
        <button onClick={() => setSelectedRating(1)} className={`py-3 rounded-xl font-black text-[9px] uppercase transition-all shadow-lg active:scale-95 ${selectedRating === 1 ? 'bg-red-500 text-white ring-2 ring-white shadow-red-500/40' : 'bg-red-900/10 text-red-400 border border-red-500/30'}`}>Need (+2)</button>
        
        <button onClick={() => onScoreParticipation(activeChildId, batchId)} className="col-span-1 bg-white/5 hover:bg-white/10 text-emerald-300 py-3 rounded-xl font-black text-[9px] uppercase border border-emerald-700/10 transition-all active:scale-95">Partic (+2)</button>
        <button onClick={onShowAssignModal} className="bg-indigo-600/60 hover:bg-indigo-500 text-white py-3 rounded-xl font-black text-[9px] uppercase flex items-center justify-center gap-2 transition-all active:scale-95 border border-indigo-500/30"><BookOpen size={14}/> Lesson</button>
      </div>

      <button 
        disabled={selectedRating === null}
        onClick={handleFinishRecitation}
        className={`w-full py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all duration-500 ${selectedRating !== null ? 'bg-gradient-to-r from-emerald-500 to-emerald-700 text-white shadow-xl shadow-emerald-500/30' : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/5'}`}
      >
        {selectedRating !== null ? <><Award size={16}/> Finish & Award XP</> : 'Select a Score First'}
      </button>
    </div>
  );

  if (isMobile) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-[#011a11]/95 backdrop-blur-3xl border-t border-emerald-700/30 rounded-t-[2.5rem] z-30 flex flex-col gap-3 p-5 animate-in slide-in-from-bottom duration-500">
        <div className="w-12 h-1 bg-emerald-700/40 rounded-full mx-auto mb-2" />
        <div className="grid grid-cols-2 gap-2 mb-2">
          <button 
            onClick={() => setSelectedCorrectAnswer('yes')} 
            className={`py-3 rounded-xl font-black text-[8px] uppercase border transition-all ${selectedCorrectAnswer === 'yes' ? 'bg-emerald-500 text-black border-white' : 'bg-white/5 text-emerald-400 border-white/5'}`}
          >
            ✓ Perfect
          </button>
          <button 
            onClick={() => setSelectedCorrectAnswer('no')} 
            className={`py-3 rounded-xl font-black text-[8px] uppercase border transition-all ${selectedCorrectAnswer === 'no' ? 'bg-red-500 text-white border-white' : 'bg-white/5 text-red-400 border-white/5'}`}
          >
            ✗ Mistake
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2 mb-2">
           {[4,3,2,1].map(r => (
             <button 
               key={r} 
               onClick={() => setSelectedRating(r)}
               className={`py-3 rounded-xl font-black text-[8px] uppercase transition-all ${selectedRating === r ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/40 border border-white/5'}`}
             >
               {r === 4 ? '+10' : r === 3 ? '+7' : r === 2 ? '+5' : '+2'}
             </button>
           ))}
        </div>
        <button 
           disabled={selectedRating === null}
           onClick={handleFinishRecitation}
           className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${selectedRating !== null ? 'bg-emerald-500 text-black' : 'bg-white/5 text-white/10'}`}
        >
          {selectedRating !== null ? <CheckCircle2 size={16}/> : ''} Finish Recitation
        </button>
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

export const ScholarControlPanel = memo(ScholarControlPanelComponent);
