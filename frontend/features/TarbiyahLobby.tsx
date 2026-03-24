import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Heart, Sun, Cloud, Play, Lock, Sprout, Star, 
  Trophy, Flame, Target, User, Settings, Clock, CheckCircle, 
  TrendingUp, Shield, Award, Moon, Sparkles, Leaf, Book,
  ChevronLeft, BarChart2, Calendar, Download, Share2
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip as RechartsTooltip } from 'recharts';
import { useChildContext } from '../contexts/ChildContext';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import SessionLeaderboard from './SessionLeaderboard';

// --- DATA & CONSTANTS ---
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// We generate 16 Journey Stages to match the 16 Live Sessions curriculum
const GENERATE_STAGES = () => {
  const themes = [
    { type: 'Theology', icon: <Sun size={24} />, color: 'bg-amber-500/20 text-amber-300 border-amber-500/50' },
    { type: 'Character', icon: <Heart size={24} />, color: 'bg-rose-500/20 text-rose-300 border-rose-500/50' },
    { type: 'Fiqh', icon: <Cloud size={24} />, color: 'bg-blue-500/20 text-blue-300 border-blue-500/50' },
    { type: 'History', icon: <BookOpen size={24} />, color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' },
    { type: 'Stories', icon: <Moon size={24} />, color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50' },
  ];

  return Array.from({ length: 16 }).map((_, i) => {
    const theme = themes[i % themes.length];
    return {
      id: i + 1,
      title: `Live Session ${i + 1}`,
      subtitle: `Mastering ${theme.type}`,
      ...theme
    };
  });
};

const JOURNEY_STAGES = GENERATE_STAGES();

// Dynamic data fetched from API now
const COLORS = ['#10b981', '#fbbf24', '#3b82f6', '#f43f5e', '#8b5cf6'];

const BADGES = [
  { id: 'b1', emoji: '🌅', name: 'Early Bird', desc: 'Completed a lesson before 8 AM.', progress: 100 },
  { id: 'b2', emoji: '📚', name: 'Bookworm', desc: 'Finished 5 History lessons.', progress: 100 },
  { id: 'b3', emoji: '🌙', name: 'Moon Walker', desc: 'Attended a night story session.', progress: 100 },
];

const MovingBackground = React.memo(() => {
  const particles = useMemo(() => {
    return [...Array(60)].map((_, i) => {
      const Icon = [Moon, Star, BookOpen, Book, Cloud, Sprout, Leaf, Sun][i % 8] as any;
      const left = Math.random() * 100;
      const duration = 60 + Math.random() * 60; 
      const delay = Math.random() * 60;
      const size = 20 + Math.random() * 40; 
      const iconColors = ['#34d399', '#6ee7b7', '#fcd34d', '#a7f3d0', '#fbbf24']; 
      const color = iconColors[Math.floor(Math.random() * iconColors.length)];
      
      return { Icon, left, duration, delay, size, color };
    });
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-[#022c22]">
      <style>{`
        @keyframes float-calm {
          0% { transform: translateY(110vh) rotate(0deg); opacity: 0; }
          20% { opacity: 0.3; } 
          80% { opacity: 0.3; }
          100% { transform: translateY(-20vh) rotate(360deg); opacity: 0; }
        }
        .bg-icon-calm {
          position: absolute;
          opacity: 0;
          animation: float-calm linear infinite;
          will-change: transform;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
      
      {particles.map((p, i) => (
        <div 
          key={i} 
          className="bg-icon-calm" 
          style={{ 
            left: `${p.left}%`, 
            animationDuration: `${p.duration}s`, 
            animationDelay: `-${p.delay}s`,
            fontSize: p.size,
            color: p.color
          }}
        >
          <p.Icon size={p.size} strokeWidth={1.5} />
        </div>
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#022c22_95%)]"></div>
    </div>
  );
});

export const TarbiyahLobby = ({ getToken, onJoinSession }: { getToken: any, onJoinSession: (s: any) => void }) => {
  const [view, setView] = useState<'kids' | 'parent'>('kids');
  const [scrollProgress, setScrollProgress] = useState(0);
  const { activeChild } = useChildContext();
  const [batches, setBatches] = useState<any[]>([]);
  const { t } = useTranslation();

  // Fetch enrolled batches
  useEffect(() => {
    const fetchBatches = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const res = await axios.get(`${API_BASE}/api/live/my-sessions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBatches(res.data || []);
      } catch (err) {}
    };
    fetchBatches();
    // Poll every 10s in case a batch goes live
    const interval = setInterval(fetchBatches, 10000);
    return () => clearInterval(interval);
  }, [getToken]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleJoinLive = async () => {
    if (!activeChild) return alert("Select a child first");
    const activeBatch = batches.find(b => b.status === 'active');
    const batchToJoin = activeBatch || batches[0];
    if (!batchToJoin) return alert("No active classes found to join.");

    try {
      const token = await getToken();
      const res = await axios.post(`${API_BASE}/api/live/${batchToJoin._id}/join`, {
        childId: activeChild.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.session) {
         onJoinSession(res.data.session);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to join live session");
    }
  };

  const currentBatchStatus = batches.find(b => b.status === 'active') ? 'active' : 'waiting';

  return (
    <div className="min-h-screen text-white font-sans selection:bg-emerald-500 relative transition-colors duration-1000">
      <MovingBackground />

      {/* Floating View Toggle */}
      <div className="fixed top-20 left-0 w-full z-40 px-4 py-3 pointer-events-none">
        <div className="max-w-5xl mx-auto flex justify-center md:justify-end items-start mt-2 md:mt-0">
          <div className="pointer-events-auto bg-black/40 backdrop-blur-md rounded-full p-1 shadow-lg border border-white/10 inline-flex ring-1 ring-white/5">
            <button 
              onClick={() => setView('kids')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${view === 'kids' ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'text-emerald-200 hover:text-white'}`}
            >
              Kids Map
            </button>
            <button 
              onClick={() => setView('parent')}
              className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${view === 'parent' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'text-indigo-200 hover:text-white'}`}
            >
              Parents Area
            </button>
          </div>
        </div>
      </div>

      {view === 'kids' ? (
        <KidsView 
          scrollProgress={scrollProgress} 
          activeChild={activeChild} 
          onJoinLive={handleJoinLive} 
          currentBatchStatus={currentBatchStatus}
          batches={batches}
        />
      ) : (
        <ParentsView activeChild={activeChild} batches={batches} getToken={getToken} />
      )}
    </div>
  );
};

const KidsView = ({ scrollProgress, activeChild, onJoinLive, currentBatchStatus, batches }: any) => {
  const progress = activeChild?.child_progress?.[0];
  const activeBatch = batches && batches.length > 0 ? batches[0] : null; // Usually the first is their main
  
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // Calculate Map fill percentage
  const totalClassesPassed = activeBatch?.pastSessions?.length || 0;
  const lastUnlockedIndex = Math.min(totalClassesPassed, 15);
  const maxPercentage = (lastUnlockedIndex / (JOURNEY_STAGES.length - 1)) * 100;
  const currentDraw = scrollProgress * 2.0;
  const fillPercentage = Math.min(currentDraw, maxPercentage);

  return (
    <div className="relative z-10 pt-36 pb-20">
      <div className="max-w-3xl mx-auto px-6 mb-16">
        <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl border border-white/20 ring-1 ring-white/10">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 p-1 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                <div className="w-full h-full rounded-full bg-[#022c22] flex items-center justify-center border-4 border-[#064e3b]">
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Level</div>
                    <div className="text-3xl font-black text-white">{progress?.level || 1}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 w-full space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white drop-shadow-md">{activeChild ? activeChild.name + "'s Journey" : "Little Explorer"}</h2>
                  <div className="text-sm text-emerald-200 font-medium">Keep growing your garden of Iman!</div>
                </div>
                <div className="flex items-center gap-2 bg-orange-500/20 px-4 py-2 rounded-full border border-orange-500/30 text-orange-300 font-bold text-sm shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                  <Flame size={18} fill="currentColor" /> {progress?.streak_days || 0} Day Streak
                </div>
              </div>
              
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <span className="text-xs font-bold inline-block text-emerald-300 tracking-wider">
                    {progress?.total_xp || 0} XP
                  </span>
                </div>
                <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-black/40 border border-white/5">
                  <div 
                    style={{ width: `${Math.min(((progress?.total_xp || 0) % 1000) / 10, 100)}%` }} 
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-1000 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/30 w-full" style={{animation: 'shimmer 2s infinite'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-2xl mx-auto px-4 pb-32">
        <h3 className="text-center font-serif text-3xl font-bold text-white mb-16 flex items-center justify-center gap-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-100">
           <Sparkles size={20} className="text-emerald-400" />
           Your Journey to Light
           <Sparkles size={20} className="text-emerald-400" />
        </h3>

        <div className="absolute top-24 bottom-16 left-[2rem] md:left-1/2 w-1 md:-translate-x-1/2 z-0">
          <svg className="h-full w-full overflow-visible" preserveAspectRatio="none">
             <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="2" strokeDasharray="8 8" />
             <line 
                x1="50%" y1="0%" x2="50%" y2={`${fillPercentage}%`} 
                stroke="#34d399" strokeWidth="4" strokeLinecap="round" 
                style={{ filter: 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.8))', transition: 'y2 0.3s ease-out' }}
             />
             {fillPercentage > 0 && (
               <>
                 <circle cx="50%" cy={`${fillPercentage}%`} r="6" fill="#34d399" className="animate-ping" style={{ opacity: 0.5, transition: 'cy 0.3s ease-out' }} />
                 <circle cx="50%" cy={`${fillPercentage}%`} r="3" fill="white" style={{ transition: 'cy 0.3s ease-out' }} />
               </>
             )}
          </svg>
        </div>

        <div className="space-y-24 relative z-10">
          {JOURNEY_STAGES.map((stage, index) => {
            const isRight = index % 2 !== 0;
            const pastSession = activeBatch?.pastSessions?.[index];
            const isCurrent = index === totalClassesPassed;
            const isLocked = index > totalClassesPassed;
            
            // Check Attendance
            let isCompleted = false;
            let isMissed = false;
            if (pastSession) {
               // See if child has a session_complete record for this sessionId
               const attended = activeChild?.attendance?.some((a: any) => 
                   a.type === 'session_complete' && a.details?.sessionId === pastSession.sessionId
               );
               if (attended) isCompleted = true;
               else isMissed = true;
            }

            return (
              <div key={stage.id} className={`flex md:justify-center items-center relative group perspective-1000`}>
                
                <div 
                   onClick={() => {
                      if ((isCompleted || isMissed) && pastSession && activeBatch) {
                        setSelectedSessionId(pastSession.sessionId);
                      } else if (isCurrent) {
                        onJoinLive();
                      }
                   }}
                   className={`
                   absolute left-[2rem] md:left-1/2 -translate-x-1/2 w-14 h-14 rounded-full border-4 border-[#022c22] z-20 flex items-center justify-center shadow-xl transition-all duration-500 cursor-pointer
                   ${isLocked 
                     ? 'bg-gray-800 text-gray-500 border-gray-700' 
                     : isCompleted ? 'bg-emerald-600 text-[#022c22] border-emerald-400 hover:scale-110'
                     : isMissed ? 'bg-red-500 text-white border-red-700 hover:scale-110'
                     : 'bg-gradient-to-br from-emerald-400 to-teal-500 text-[#022c22] scale-110 shadow-[0_0_30px_rgba(52,211,153,0.6)] hover:scale-125'}
                `}>
                   {isLocked ? <Lock size={18} /> : isCompleted ? <CheckCircle size={20} fill="currentColor" className="text-white" /> : isMissed ? <div className="text-xl font-bold">X</div> : <div className="text-xl font-bold">{index + 1}</div>}
                </div>

                <div className={`w-full md:w-[45%] pl-24 md:pl-0 ${isRight ? 'md:ml-auto md:pl-20 text-left' : 'md:mr-auto md:pr-20 md:text-right'}`}>
                   <div className={`
                      backdrop-blur-xl rounded-[2rem] p-6 border transition-all duration-300 relative overflow-hidden group-hover:transform group-hover:scale-[1.03]
                      ${isLocked 
                        ? 'bg-white/5 border-white/5 opacity-60 grayscale-[0.8]' 
                        : isCompleted ? 'bg-white/10 border-emerald-900/50 shadow-lg'
                        : `bg-white/10 border-white/20 shadow-2xl hover:bg-white/15 hover:border-emerald-400/50 hover:shadow-[0_10px_40px_rgba(0,0,0,0.4)]`}
                   `}>
                      <div className={`flex flex-col ${isRight ? '' : 'md:items-end'} mb-3 relative z-10`}>
                        <div className={`inline-flex p-3 rounded-2xl mb-4 ${isLocked ? 'bg-gray-800 text-gray-500' : stage.color} shadow-inner`}>
                           {stage.icon}
                        </div>
                        <h4 className="font-bold text-xl leading-tight text-white mb-1">{stage.title}</h4>
                        <p className="text-sm text-emerald-200/80">{stage.subtitle}</p>
                      </div>

                      {isCurrent ? (
                        <button 
                          onClick={onJoinLive}
                          className={`mt-4 w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all relative z-10 
                            ${currentBatchStatus === 'active' ? 'bg-emerald-500 hover:bg-emerald-400 text-[#022c22] shadow-[0_0_15px_rgba(16,185,129,0.4)] animate-pulse' : 'bg-amber-500 text-[#022c22]'}`}
                        >
                           {currentBatchStatus === 'active' ? 'Join Live Class' : 'Class Scheduled'} <Play size={14} fill="currentColor" />
                        </button>
                      ) : isLocked ? (
                         <div className="mt-4 text-xs text-gray-400 font-bold uppercase tracking-wide flex items-center gap-2 justify-center md:justify-start bg-black/20 py-2 rounded-lg">
                            <Lock size={12} /> Locked
                         </div>
                      ) : isMissed ? (
                         <div className="mt-4 text-xs text-red-400 font-bold uppercase tracking-wide flex items-center gap-2 justify-center md:justify-start bg-red-900/30 py-2 rounded-lg">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> Missed Class
                         </div>
                      ) : (
                         <div className="mt-4 text-xs text-emerald-400 font-bold uppercase tracking-wide flex items-center gap-2 justify-center md:justify-start bg-emerald-900/30 py-2 rounded-lg">
                            <CheckCircle size={12} /> Completed
                         </div>
                      )}
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {selectedSessionId && activeBatch && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
             <div className="flex justify-end p-2 bg-slate-50 border-b border-slate-100">
               <button onClick={() => setSelectedSessionId(null)} className="text-slate-400 hover:text-slate-600 p-2">
                 ✕ Close
               </button>
             </div>
             <div className="flex-1 overflow-y-auto relative h-[600px]">
               <SessionLeaderboard 
                 batchId={activeBatch._id} 
                 sessionId={selectedSessionId} 
                 onClose={() => setSelectedSessionId(null)} 
               />
             </div>
           </div>
         </div>
      )}
    </div>
  );
};

const ParentsView = ({ activeChild, batches, getToken }: any) => {
  const progress = activeChild?.child_progress?.[0] || {};
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboard = async () => {
      if (!activeChild?.id) return;
      try {
        const token = await getToken();
        if (!token) return;
        
        // Fetch specific child dashboard
        const res = await axios.get(`${API_BASE}/api/parent/dashboard/${activeChild.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDashboardData(res.data);
        
        // Fetch top global leaders
        const boardRes = await axios.get(`${API_BASE}/api/live/global-leaderboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGlobalLeaderboard(boardRes.data.leaderboard || []);
      } catch (err) {
        console.error("Failed to load parent dashboard", err);
      }
    };
    fetchDashboard();
  }, [activeChild, getToken]);

  const topicCount = dashboardData?.topicBreakdown || [];
  const weeklyData = dashboardData?.weeklyActivity || [];

  return (
    <div className="pt-32 pb-20 px-4 md:px-8 max-w-6xl mx-auto relative z-10 animate-in fade-in zoom-in-95">
       <div className="mb-12 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
             <Shield size={12} /> Parent Dashboard
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white drop-shadow-md">{activeChild?.name || 'Child'}'s Progress</h1>
          <p className="text-emerald-200 mt-3 text-lg">Monitor growth, set limits, and explore curriculum.</p>
       </div>

       <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-white/10">
             <div className="flex items-center gap-3 mb-3 text-emerald-400">
                <Clock size={20} /> <span className="text-xs font-bold uppercase tracking-wide">Attended</span>
             </div>
             <div className="text-3xl font-bold text-white">{progress.total_sessions_attended || 0}</div>
             <div className="text-xs text-emerald-400 font-medium mt-2">Live Sessions</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-white/10">
             <div className="flex items-center gap-3 mb-3 text-blue-400">
                <Star size={20} /> <span className="text-xs font-bold uppercase tracking-wide">Total XP</span>
             </div>
             <div className="text-3xl font-bold text-white">{progress.total_xp || 0}</div>
             <div className="text-xs text-blue-400 font-medium mt-2">Level {progress.level || 1}</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl shadow-lg border border-white/10">
             <div className="flex items-center gap-3 mb-3 text-amber-500">
                <Flame size={20} /> <span className="text-xs font-bold uppercase tracking-wide">Streak</span>
             </div>
             <div className="text-3xl font-bold text-white">{progress.streak_days || 0}</div>
             <div className="text-xs text-amber-500 mt-2">Days active</div>
          </div>
          <div className="bg-gradient-to-br from-indigo-900 to-[#022c22] backdrop-blur-md p-6 rounded-3xl shadow-lg border border-indigo-500/30">
             <div className="flex items-center gap-3 mb-3 text-indigo-400">
                <Award size={20} /> <span className="text-xs font-bold uppercase tracking-wide">Badges</span>
             </div>
             <div className="text-3xl font-bold text-white">{progress.badges?.length || 0}</div>
             <div className="text-xs text-indigo-400 mt-2">Achievements</div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2rem] shadow-lg border border-white/10">
             <h3 className="font-bold text-white text-lg mb-8 flex justify-between items-center">Topic Focus <BarChart2 size={18} className="text-emerald-400" /></h3>
             {topicCount.length > 0 ? (
               <>
                 <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie data={topicCount} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                             {topicCount.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Pie>
                          <RechartsTooltip contentStyle={{ backgroundColor: '#064e3b', borderColor: '#34d399', color: '#fff' }} />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="flex flex-wrap justify-center gap-4 text-xs font-medium text-gray-300 mt-6">
                    {topicCount.map((item: any, idx: number) => (
                       <div key={item.name} className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full">
                          <span className="w-2 h-2 rounded-full shadow-[0_0_8px]" style={{ backgroundColor: COLORS[idx % COLORS.length], boxShadow: `0 0 8px ${COLORS[idx % COLORS.length]}` }}></span>
                          {item.name} ({item.value}m)
                       </div>
                    ))}
                 </div>
               </>
             ) : (
                <div className="h-64 flex items-center justify-center text-emerald-200/50">No data for this week</div>
             )}
          </div>

          <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2rem] shadow-lg border border-white/10 lg:col-span-2">
             <div className="flex justify-between items-center mb-8">
                <h3 className="font-bold text-white text-lg">Activity Log (Minutes)</h3>
             </div>
             {weeklyData.length > 0 ? (
               <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={weeklyData}>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#34d399', fontWeight: 'bold' }} dy={10} />
                        <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#064e3b', borderColor: '#34d399', color: '#fff', borderRadius: '10px' }} />
                        <Bar dataKey="min" fill="#10b981" radius={[6, 6, 0, 0]} barSize={50} />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
             ) : (
                <div className="h-64 flex items-center justify-center text-emerald-200/50">No activity logged this week</div>
             )}
          </div>
       </div>

       {/* CUMULATIVE GLOBAL PLATFORM LEADERBOARD */}
       <div className="mt-8 bg-white/5 backdrop-blur-md p-8 rounded-[2rem] shadow-lg border border-white/10">
          <div className="flex justify-between items-center mb-8">
             <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Trophy size={20} className="text-amber-400" />
                Global Platform Leaderboard
             </h3>
             <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-3 py-1 text-center rounded-full border border-amber-500/30">Top Explorers</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {globalLeaderboard.map((student, idx) => (
                <div key={student.id || idx} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${student.id === activeChild?.id ? 'bg-indigo-900/40 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                   <div className={`w-10 h-10 rounded-full flex shrink-0 items-center justify-center font-black text-lg shadow-inner ${idx === 0 ? 'bg-amber-400 text-amber-900' : idx === 1 ? 'bg-slate-300 text-slate-800' : idx === 2 ? 'bg-amber-700 text-amber-100' : 'bg-emerald-900 text-emerald-300'}`}>
                      #{idx + 1}
                   </div>
                   <div className="flex-1 min-w-0">
                      <div className="font-bold text-white truncate text-base flex items-center gap-2">
                         {student.name} {student.id === activeChild?.id && <span className="text-[9px] bg-indigo-500 px-2 py-0.5 rounded text-white uppercase tracking-wider">You</span>}
                      </div>
                      <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest mt-0.5">Level {student.level}</div>
                   </div>
                   <div className="text-right shrink-0">
                      <div className="font-black text-amber-400 text-lg">{student.totalXp}</div>
                      <div className="text-[9px] text-white/50 uppercase tracking-widest font-bold">Total XP</div>
                   </div>
                </div>
             ))}
             {globalLeaderboard.length === 0 && (
                <div className="col-span-full text-center py-8 text-white/50 text-sm">Gathering leaderboard heroes...</div>
             )}
          </div>
       </div>
    </div>
  );
};
