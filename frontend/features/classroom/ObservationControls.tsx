import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';

interface ObservationControlsProps {
  batchId: string;
  childId: string;
  batchState: any;
  onSubmitPrompt: (childId: string, batchId: string, answer: 'yes' | 'no') => void;
}

export const ObservationControls: React.FC<ObservationControlsProps> = ({
  batchId,
  childId,
  batchState,
  onSubmitPrompt
}) => {
  const [hasVoted, setHasVoted] = useState(false);

  // Reset vote status if activeChildId changes (new turn)
  const currentTurnId = batchState?.activeChildId;
  const [lastTurnId, setLastTurnId] = useState<string | null>(null);

  if (currentTurnId !== lastTurnId) {
    setLastTurnId(currentTurnId);
    setHasVoted(false);
  }

  const handleVote = (answer: 'yes' | 'no') => {
    onSubmitPrompt(childId, batchId, answer);
    setHasVoted(true);
  };

  if (hasVoted) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex flex-col items-center gap-3 animate-in fade-in duration-500">
        <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-emerald-950 shadow-lg">
          <CheckCircle size={28} />
        </div>
        <div className="text-center">
          <p className="text-white font-bold">Vote Recorded!</p>
          <p className="text-emerald-400/60 text-[10px] uppercase font-black tracking-widest mt-1">Thanks for participating</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#022c22]/60 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-700">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-serif font-bold text-white">How is it sounding? 🎧</h3>
        <p className="text-emerald-400/70 text-sm">Help your classmate by providing feedback.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => handleVote('yes')}
          className="group flex flex-col items-center gap-4 bg-emerald-500/10 hover:bg-emerald-500 hover:text-emerald-950 p-6 rounded-[2rem] border border-emerald-500/30 transition-all duration-300 active:scale-95"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 group-hover:bg-white/20 flex items-center justify-center transition-colors">
            <ThumbsUp size={28} className="text-emerald-400 group-hover:text-emerald-950" />
          </div>
          <span className="font-black text-[10px] uppercase tracking-widest">Perfect!</span>
        </button>

        <button
          onClick={() => handleVote('no')}
          className="group flex flex-col items-center gap-4 bg-red-500/10 hover:bg-red-500 hover:text-white p-6 rounded-[2rem] border border-red-500/30 transition-all duration-300 active:scale-95"
        >
          <div className="w-14 h-14 rounded-2xl bg-red-500/20 group-hover:bg-white/20 flex items-center justify-center transition-colors">
            <ThumbsDown size={28} className="text-red-400 group-hover:text-white" />
          </div>
          <span className="font-black text-[10px] uppercase tracking-widest">Small Mistake</span>
        </button>
      </div>
      
      <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-2xl">
         <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.5)]" />
         <p className="text-[9px] text-amber-200/50 font-bold uppercase tracking-widest">Live: Observation Participation XP Awarded</p>
      </div>
    </div>
  );
};
