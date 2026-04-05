import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Trophy, Loader2, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@clerk/clerk-react';
import { MovingBackground } from './TarbiyahLobby';

import { APPLICATION_API_URL } from '../lib/api';

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
        const res = await axios.get(`${APPLICATION_API_URL}/api/live/batch/${batchId}/leaderboard?sessionId=${sessionId}`, {
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
    <div className="w-full h-full bg-[#022c22] flex flex-col items-center py-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-900/40 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-900/30 rounded-full blur-[150px]" />
        <MovingBackground />
      </div>

      <div className="w-full max-w-3xl px-6 flex-1 flex flex-col relative z-10">
        <div className="bg-emerald-950/80 backdrop-blur-xl text-white p-8 rounded-[2rem] shadow-[0_0_50px_rgba(16,185,129,0.15)] relative overflow-hidden shrink-0 mb-8 border border-emerald-500/30">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2" />
          
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
             <div className="text-center py-16 bg-white/5 backdrop-blur-md rounded-[2rem] border border-dashed border-emerald-500/30">
                <Loader2 className="animate-spin mx-auto text-emerald-300 mb-4" size={32} />
                <p className="text-xs font-bold text-emerald-200/60 uppercase tracking-widest">Compiling Scores...</p>
             </div>
          ) : leaderboard && leaderboard.length > 0 ? (
            <div className="space-y-4">
               {leaderboard.map((l, idx) => (
                  <div key={l.childId} className={`flex items-center justify-between p-5 rounded-[1.5rem] border hover:scale-[1.01] transition-all ${idx === 0 ? 'bg-gradient-to-r from-amber-500 to-amber-600 border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.3)]' : 'bg-emerald-950/40 backdrop-blur-md border border-emerald-800/50 hover:border-emerald-500/50'}`}>
                     <div className="flex items-center gap-5">
                        <span className={`font-black text-xl w-8 text-center ${idx === 0 ? 'text-white' : idx === 1 ? 'text-emerald-300' : idx === 2 ? 'text-emerald-400' : 'text-emerald-600'}`}>
                           #{idx + 1}
                        </span>
                        <span className={`font-bold text-lg ${idx === 0 ? 'text-white' : 'text-emerald-50'}`}>{l.name}</span>
                     </div>
                     <div className="flex items-center gap-8">
                        <div className="text-right hidden sm:block">
                           <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${idx === 0 ? 'text-amber-100' : 'text-emerald-300/60'}`}>Recitation</div>
                           <div className={`font-bold ${idx === 0 ? 'text-white' : 'text-emerald-50'}`}>{l.recitationScore || 0}</div>
                        </div>
                        <div className="text-right hidden sm:block">
                           <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${idx === 0 ? 'text-amber-100' : 'text-emerald-300/60'}`}>Participation</div>
                           <div className={`font-bold ${idx === 0 ? 'text-white' : 'text-emerald-50'}`}>{l.participationScore || 0}</div>
                        </div>
                        <div className={`font-black text-2xl px-6 py-2 rounded-xl text-center min-w-[80px] border ${idx === 0 ? 'bg-amber-400 text-amber-900 border-amber-300' : 'bg-emerald-800 text-emerald-300 border-emerald-700/50'}`}>
                           {l.total || 0}
                        </div>
                     </div>
                  </div>
               ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/5 backdrop-blur-md rounded-[2rem] border border-dashed border-emerald-500/30 shadow-sm">
               <div className="w-16 h-16 bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-800">
                  <BookOpen className="text-emerald-400" size={24} />
               </div>
               <h3 className="text-white font-bold text-xl mb-2">No Scores Recorded</h3>
               <p className="text-emerald-200/80 max-w-sm mx-auto text-sm">
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
