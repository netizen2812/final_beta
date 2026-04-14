import React from 'react';

interface StudentSpeedDockProps {
  activeSessions: any[];
  activeChildId: string | null;
  onSetTurn: (childId: string, batchId: string) => void;
}

export const StudentSpeedDock: React.FC<StudentSpeedDockProps> = ({
  activeSessions,
  activeChildId,
  onSetTurn
}) => {
  return (
    <div className="flex-none p-4 pb-0 z-20 relative">
      <div className="flex gap-3 overflow-x-auto pb-4 items-center">
        {activeSessions.map(session => (
          <div 
            key={session._id} 
            onClick={() => onSetTurn(session.childId, session.batchId!)}
            className={`shrink-0 cursor-pointer rounded-2xl transition-all duration-500 ${
              activeChildId === session.childId 
                ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-105' 
                : 'bg-white/10 backdrop-blur-xl border border-white/20 opacity-60 hover:opacity-100 hover:scale-105'
            }`}
          >
             <div className="px-5 py-3 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shadow-lg ${
                  activeChildId === session.childId ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {session.studentName?.[0] || 'S'}
                </div>
                <div className="flex flex-col">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    activeChildId === session.childId ? 'text-white' : 'text-emerald-200'
                  }`}>{session.studentName}</span>
                  {activeChildId === session.childId && (
                     <span className="text-[8px] text-emerald-100/70 font-bold uppercase animate-pulse">● Reciting</span>
                  )}
                </div>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
