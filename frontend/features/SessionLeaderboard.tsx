import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trophy, Loader2, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/clerk-react';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface SessionLeaderboardProps {
  batchId: string;
  sessionId: string;
  onClose?: () => void;
}

const SessionLeaderboard: React.FC<SessionLeaderboardProps> = ({ batchId, sessionId, onClose }) => {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = await getToken();
        // Updated backend handles ?sessionId=...
        const res = await axios.get(`${API_BASE}/api/live/batch/${batchId}/leaderboard?sessionId=${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLeaderboard(res.data.leaderboard || []);
      } catch (e) {
        console.error("Leaderboard fetch failed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [batchId, sessionId, getToken]);

  return (
    <div className="w-full h-full bg-[#f8fafc] flex flex-col items-center py-8">
      <div className="w-full max-w-3xl px-6 flex-1 flex flex-col">
        <div className="bg-emerald-900 text-white p-8 rounded-[2rem] shadow-xl relative overflow-hidden shrink-0 mb-8 border-4 border-emerald-800/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 mb-6 rounded-full bg-amber-500/20 flex items-center justify-center animate-pulse shadow-inner ring-4 ring-amber-500/30">
               <Trophy className="text-amber-400" size={32} />
            </div>
            <h3 className="font-serif text-3xl md:text-4xl font-bold text-white mb-2">Class Leaderboard</h3>
            <p className="text-emerald-200/80 max-w-md mx-auto text-sm md:text-base">
               Results and scores for this specific session.
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-20">
          {loading ? (
             <div className="text-center py-16 bg-white rounded-[2rem] border border-dashed border-emerald-200">
                <Loader2 className="animate-spin mx-auto text-emerald-300 mb-4" size={32} />
                <p className="text-xs font-bold text-emerald-600/60 uppercase tracking-widest">Compiling Scores...</p>
             </div>
          ) : leaderboard && leaderboard.length > 0 ? (
            <div className="space-y-4">
               {leaderboard.map((l, idx) => (
                  <div key={l.childId} className="flex items-center justify-between p-5 rounded-[1.5rem] bg-white shadow-sm border border-slate-100 hover:shadow-md transition-all hover:scale-[1.01]">
                     <div className="flex items-center gap-5">
                        <span className={`font-black text-xl w-8 text-center ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'text-slate-300'}`}>
                           #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-800 text-lg">{l.name}</span>
                     </div>
                     <div className="flex items-center gap-8">
                        <div className="text-right hidden sm:block">
                           <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Recitation</div>
                           <div className="font-bold text-slate-700">{l.recitationScore || 0}</div>
                        </div>
                        <div className="text-right hidden sm:block">
                           <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Participation</div>
                           <div className="font-bold text-slate-700">{l.participationScore || 0}</div>
                        </div>
                        <div className="font-black text-2xl text-emerald-600 bg-emerald-50 border border-emerald-100 px-6 py-2 rounded-xl text-center min-w-[80px]">
                           {l.total || 0}
                        </div>
                     </div>
                  </div>
               ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-slate-200 shadow-sm">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="text-slate-400" size={24} />
               </div>
               <h3 className="text-slate-800 font-bold text-xl mb-2">No Scores Recorded</h3>
               <p className="text-slate-500 max-w-sm mx-auto text-sm">
                  There were no participation or recitation points awarded during this specific session.
               </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionLeaderboard;
