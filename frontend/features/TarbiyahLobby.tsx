import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Heart, Sun, Cloud, Play, Lock, Sprout, Star, 
  Trophy, Flame, Target, User, Settings, Clock, CheckCircle, 
  TrendingUp, Shield, Award, Moon, Sparkles, Leaf, Book,
  ChevronLeft, BarChart2, Calendar, Download, Share2, Users, ChevronDown, ShieldCheck, Loader2, Crown, ChevronRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip as RechartsTooltip } from 'recharts';
import { useChildContext } from '../contexts/ChildContext';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import SessionLeaderboard from './SessionLeaderboard';
import { loadRazorpayScript } from '../utils/razorpay';
import { TarbiyahOnboarding } from './TarbiyahOnboarding';
import QuranPracticeModule from './QuranPracticeModule';
import ScholarQuranManager from './ScholarQuranManager';

// --- DATA & CONSTANTS ---
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

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
const COLORS = ['#10b981', '#fbbf24', '#3b82f6', '#f43f5e', '#8b5cf6'];

export const MovingBackground = React.memo(() => {
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

export const TarbiyahLobby = ({ 
  getToken, 
  onJoinSession,
  userRole = 'parent',
  scholarBatches = [],
  onScholarJoinSession
}: { 
  getToken: any, 
  onJoinSession: (s: any) => void,
  userRole?: 'parent' | 'scholar',
  scholarBatches?: any[],
  onScholarJoinSession?: (b: any) => void
}) => {
  const [view, setView] = useState<'kids' | 'parent' | 'scholar_journey' | 'scholar_dashboard'>(
     userRole === 'scholar' ? 'scholar_journey' : 'kids'
  );
  const [targetBatchId, setTargetBatchId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { activeChild } = useChildContext();
  const [batches, setBatches] = useState<any[]>([]);
  const [accessStatus, setAccessStatus] = useState<any>(null);
  const [showQuranPractice, setShowQuranPractice] = useState(false);
  const [showJoinChoice, setShowJoinChoice] = useState(false);
  const [showScholarManage, setShowScholarManage] = useState<any>(null); // To store batch for scholar managemnt
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        
        const [batchesRes, accessRes] = await Promise.all([
           axios.get(`${API_BASE}/api/live/my-sessions`, { headers: { Authorization: `Bearer ${token}` } }),
           axios.get(`${API_BASE}/api/live/access/status`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        setBatches(batchesRes.data || []);
        setAccessStatus(accessRes.data);
      } catch (err) {}
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
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
    if (!batchToJoin) return alert("Payment verified! Your batch assignment is pending. Please wait for an Admin to assign your classes.");

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

      <div className="fixed top-20 left-0 w-full z-40 px-4 py-3 pointer-events-none">
        <div className="max-w-5xl mx-auto flex justify-center md:justify-end items-start mt-2 md:mt-0">
          <div className="pointer-events-auto bg-black/40 backdrop-blur-md rounded-full p-1 shadow-lg border border-white/10 inline-flex ring-1 ring-white/5">
            {userRole === 'scholar' ? (
              <>
                <button onClick={() => setView('scholar_journey')} className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${view === 'scholar_journey' ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'text-emerald-200 hover:text-white'}`}>Class Journey</button>
                <button onClick={() => setView('scholar_dashboard')} className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${view === 'scholar_dashboard' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'text-indigo-200 hover:text-white'}`}>Scholar Dashboard</button>
              </>
            ) : (
              <>
                <button onClick={() => setView('kids')} className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${view === 'kids' ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'text-emerald-200 hover:text-white'}`}>Kids Map</button>
                <button onClick={() => setView('parent')} className={`px-6 py-2 rounded-full text-xs font-bold transition-all ${view === 'parent' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'text-indigo-200 hover:text-white'}`}>Parents Area</button>
              </>
            )}
          </div>
        </div>
      </div>

      {userRole === 'scholar' ? (
        view === 'scholar_journey' ? (
          <ScholarJourneyView scrollProgress={scrollProgress} batches={scholarBatches} onJoinSession={onScholarJoinSession!} initialBatchId={targetBatchId} />
        ) : (
          <ScholarDashboardView 
            batches={scholarBatches} 
            onJoinSession={(batch: any) => { setTargetBatchId(batch._id); setView('scholar_journey'); }} 
            getToken={getToken}
            setShowScholarManage={setShowScholarManage}
          />
        )
      ) : (
        view === 'kids' ? (
          <KidsView 
            scrollProgress={scrollProgress} 
            activeChild={activeChild} 
            onJoinLive={handleJoinLive} 
            currentBatchStatus={currentBatchStatus} 
            batches={batches} 
            accessStatus={accessStatus} 
            getToken={getToken} 
            setShowQuranPractice={setShowQuranPractice}
            setShowJoinChoice={setShowJoinChoice}
          />
        ) : (
          <ParentsView activeChild={activeChild} batches={batches} getToken={getToken} />
        )
      )}

      {showQuranPractice && activeChild && (
        <div className="fixed inset-0 z-[110] bg-[#022c22]/95 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-4xl relative">
            <button onClick={() => setShowQuranPractice(false)} className="absolute -top-12 right-0 text-white/60 hover:text-white font-bold flex items-center gap-2">✕ Close Practice</button>
            <QuranPracticeModule childId={activeChild.id} onComplete={() => {}} />
          </div>
        </div>
      )}

      {showJoinChoice && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
           <div className="bg-[#052e16] border border-emerald-500/30 rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl relative overflow-hidden text-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />
              <h3 className="text-3xl font-serif font-bold text-white mb-2">Class is LIVE!</h3>
              <p className="text-emerald-200 mb-8">Choose how you want to participate today</p>
              
              <div className="grid grid-cols-1 gap-4">
                 <button 
                   onClick={() => { setShowJoinChoice(false); handleJoinLive(); }}
                   className="flex items-center gap-4 p-5 bg-emerald-500 hover:bg-emerald-400 text-[#022c22] rounded-2xl transition-all group"
                 >
                    <div className="bg-white/20 p-3 rounded-xl"><Users size={24} /></div>
                    <div className="text-left">
                       <div className="font-bold text-lg">Observe & Participate</div>
                       <div className="text-xs font-medium opacity-80">Join the live session with the teacher</div>
                    </div>
                 </button>

                 <button 
                   onClick={() => { setShowJoinChoice(false); setShowQuranPractice(true); }}
                   className="flex items-center gap-4 p-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all group"
                 >
                    <div className="bg-white/20 p-3 rounded-xl"><BookOpen size={24} /></div>
                    <div className="text-left">
                       <div className="font-bold text-lg">Practice Assignment</div>
                       <div className="text-xs font-medium opacity-80">Complete your Juz MCQ curation</div>
                    </div>
                 </button>

                 <button 
                   onClick={() => setShowJoinChoice(false)}
                   className="mt-4 text-emerald-400 font-bold py-2"
                 >
                    Maybe Later
                 </button>
              </div>
           </div>
        </div>
      )}

      {showScholarManage && (
         <div className="fixed inset-0 z-[130] bg-[#022c22]/95 backdrop-blur-2xl flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-5xl bg-black/40 border border-emerald-500/20 rounded-[3rem] p-1 shadow-2xl relative">
                <button 
                   onClick={() => setShowScholarManage(null)} 
                   className="absolute -top-12 right-4 text-white hover:text-emerald-400 font-bold flex items-center gap-2"
                >
                    ✕ Close Portal
                </button>
                <div className="p-6 md:p-8">
                    <ScholarQuranManager batchId={showScholarManage._id} batchName={showScholarManage.name} />
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

const KidsView = ({ scrollProgress, activeChild, onJoinLive, currentBatchStatus, batches, accessStatus, getToken, setShowQuranPractice, setShowJoinChoice }: any) => {
  const [isLoading, setIsLoading] = useState(false);
  const progress = activeChild?.child_progress?.[0];
  const activeBatch = batches && batches.length > 0 ? batches[0] : null;
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const hasActiveSession = activeBatch?.status === 'active' && activeBatch?.pastSessions?.length > 0 && !activeBatch.pastSessions[activeBatch.pastSessions.length - 1].endedAt;
  const hasPremium = accessStatus?.hasAccess || (batches && batches.length > 0);

  let totalClassesPassed = 0;
  if (!hasPremium) totalClassesPassed = -1;
  else if (activeBatch?.pastSessions?.length) totalClassesPassed = hasActiveSession ? activeBatch.pastSessions.length - 1 : activeBatch.pastSessions.length;

  const lastUnlockedIndex = Math.max(0, Math.min(totalClassesPassed, 15));
  const maxPercentage = (lastUnlockedIndex / (JOURNEY_STAGES.length - 1)) * 100;
  const currentDraw = scrollProgress * 2.0;
  const fillPercentage = Math.min(currentDraw, maxPercentage);

  if (!hasPremium) return <TarbiyahOnboarding getToken={getToken} />;

  const handleRequestAccess = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const res = await loadRazorpayScript();
      if (!res) { alert("Razorpay SDK failed to load."); setIsLoading(false); return; }
      const { data: order } = await axios.post(`${API_BASE}/api/payment/create-order`, { planType: 'TARBIYAH_LIFETIME' }, { headers: { Authorization: `Bearer ${token}` } });
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Imam",
        description: "Lifetime Tarbiyah Access",
        order_id: order.id,
        handler: async function (response: any) {
             await axios.post(`${API_BASE}/api/payment/verify`, { ...response, planType: 'TARBIYAH_LIFETIME' }, { headers: { Authorization: `Bearer ${token}` } });
             alert("Payment successful! Please wait for an Admin to assign your batch!");
             window.location.reload();
        },
        theme: { color: "#052e16" }
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) { alert("Payment initiation failed."); } finally { setIsLoading(false); }
  };

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
                <div className="flex mb-2 items-center justify-between"><span className="text-xs font-bold inline-block text-emerald-300 tracking-wider">{progress?.total_xp || 0} XP</span></div>
                <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-black/40 border border-white/5">
                  <div style={{ width: `${Math.min(((progress?.total_xp || 0) % 1000) / 10, 100)}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-1000 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/30 w-full" style={{animation: 'shimmer 2s infinite'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-2xl mx-auto px-4 pb-32">
        <h3 className="text-center font-serif text-3xl font-bold text-white mb-16 flex items-center justify-center gap-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-100 italic drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">Your Journey to Light</h3>
        <div className="absolute top-24 bottom-16 left-[2rem] md:left-1/2 w-1 md:-translate-x-1/2 z-0">
          <svg className="h-full w-full overflow-visible">
             <defs>
               <filter id="glow">
                 <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                 <feMerge>
                   <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
                 </feMerge>
               </filter>
             </defs>
             <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="2" strokeDasharray="8 8" />
             <line x1="50%" y1="0%" x2="50%" y2={`${fillPercentage}%`} stroke="#10b981" strokeWidth="6" strokeLinecap="round" filter="url(#glow)" className="drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
          </svg>
        </div>
        <div className="space-y-24 relative z-10">
          {JOURNEY_STAGES.map((stage, index) => {
            const isHistorical = index < totalClassesPassed;
            const isCurrent = index === totalClassesPassed && hasActiveSession;
            const isLocked = index > totalClassesPassed || (index === totalClassesPassed && !hasActiveSession);
            const isNextScheduled = index === totalClassesPassed && !hasActiveSession;
            return (
              <div key={stage.id} className="flex md:justify-center items-center relative group">
                <div 
                   onClick={() => {
                      if (!hasPremium) {
                         handleRequestAccess();
                      } else if (isCurrent) {
                         setShowJoinChoice(true);
                      } else if (isHistorical) {
                         const historicalSession = activeBatch?.pastSessions?.[index];
                         if (historicalSession?.sessionId) {
                            setSelectedSessionId(historicalSession.sessionId);
                         }
                      } else if (isLocked) {
                         setShowQuranPractice(true);
                      }
                   }}
                   className={`absolute left-[2rem] md:left-1/2 -translate-x-1/2 w-14 h-14 rounded-full border-4 border-[#022c22] z-20 flex items-center justify-center shadow-xl transition-all ${isLocked ? 'bg-gray-800 text-gray-400' : isCurrent ? 'bg-emerald-400 text-black scale-110 shadow-[0_0_20px_rgba(16,185,129,0.6)] animate-pulse' : 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'}`}>
                    {isHistorical ? <CheckCircle size={18} /> : (isCurrent ? <Play size={18} fill="currentColor" /> : <Calendar size={18} />)}
                </div>
                <div className={`w-full md:w-[45%] pl-24 md:pl-0 ${index % 2 !== 0 ? 'md:ml-auto md:pl-20' : 'md:mr-auto md:pr-20 md:text-right'}`}>
                   <div className={`backdrop-blur-xl rounded-[2rem] p-6 border transition-all ${isLocked ? 'bg-white/5 opacity-50 border-white/5' : isCurrent ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-white/10 border-white/20 shadow-xl'}`}>
                      <h4 className={`font-bold text-xl mb-1 ${isCurrent ? 'text-emerald-300' : 'text-white'}`}>{isNextScheduled ? "Scheduled: " + stage.title : stage.title}</h4>
                      <p className="text-sm text-emerald-200/80">{stage.subtitle}</p>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selectedSessionId && activeBatch && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
             <div className="flex justify-end p-2 bg-slate-100"><button onClick={() => setSelectedSessionId(null)} className="text-slate-400 hover:text-slate-600 p-2">✕ Close</button></div>
             <div className="flex-1 overflow-y-auto relative h-[600px]"><SessionLeaderboard batchId={activeBatch._id} sessionId={selectedSessionId} onClose={() => setSelectedSessionId(null)} /></div>
           </div>
         </div>
      )}
    </div>
  );
};

const ScholarJourneyView = ({ scrollProgress, batches, onJoinSession, initialBatchId }: any) => {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(initialBatchId || batches?.[0]?._id || null);
  const activeBatch = batches.find((b:any) => b._id === selectedBatchId) || batches?.[0];
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const totalClassesPassed = activeBatch?.pastSessions?.length || 0;
  const lastUnlockedIndex = Math.min(totalClassesPassed, 15);
  const maxPercentage = (lastUnlockedIndex / (JOURNEY_STAGES.length - 1)) * 100;
  const currentDraw = scrollProgress * 2.0;
  const fillPercentage = Math.min(currentDraw, maxPercentage);

  return (
    <div className="relative z-10 pt-36 pb-20">
      <div className="max-w-3xl mx-auto px-6 mb-16 text-center">
        <h1 className="text-4xl font-serif font-bold text-white mb-4">Class Journey</h1>
        {batches?.length > 0 && (
          <div className="relative max-w-md mx-auto mb-12">
             <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full bg-emerald-900 border-2 border-emerald-500/30 text-white px-6 py-4 rounded-2xl font-black text-lg flex items-center justify-between transition-all">
                <span className="tracking-wide font-serif">{activeBatch?.name || 'Select Batch'}</span>
                <ChevronDown size={24} className={`text-emerald-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
             </button>
             {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-emerald-950/95 border border-emerald-800 rounded-2xl shadow-2xl overflow-hidden z-[200]">
                   {batches.map((b: any) => (
                      <button key={b._id} onClick={() => { setSelectedBatchId(b._id); setIsDropdownOpen(false); }} className={`w-full text-left px-6 py-4 hover:bg-emerald-800 transition-colors ${selectedBatchId === b._id ? 'bg-emerald-900 border-l-4 border-amber-400' : ''}`}>
                         <span className="font-bold text-emerald-50">{b.name}</span>
                      </button>
                   ))}
                </div>
             )}
          </div>
        )}
      </div>
      <div className="relative max-w-3xl mx-auto px-6 pb-24">
        <div className="absolute top-0 bottom-0 left-[3.5rem] md:left-1/2 w-1.5 -translate-x-1/2 bg-white/10 rounded-full z-0 pointer-events-none overflow-hidden">
          <div className="w-full bg-emerald-400 transition-all origin-top" style={{ height: `${fillPercentage}%` }} />
        </div>
        <div className="grid grid-cols-1 gap-24 relative">
          {JOURNEY_STAGES.map((stage, index) => {
            const isHistorical = index < totalClassesPassed;
            const isCurrent = index === totalClassesPassed;
            const isLocked = index > totalClassesPassed;
            return (
              <div key={stage.id} className="flex md:justify-center items-center relative group">
                <div onClick={() => isCurrent ? onJoinSession(activeBatch) : null} className={`absolute left-[2rem] md:left-1/2 -translate-x-1/2 w-14 h-14 rounded-full border-4 border-[#022c22] z-20 flex items-center justify-center shadow-xl transition-all ${isLocked ? 'bg-gray-800 text-gray-500' : isCurrent ? 'bg-amber-400 text-amber-900 scale-125' : 'bg-emerald-400 text-emerald-950'}`}>
                  {isLocked ? <Lock size={20} /> : isCurrent ? <Play size={20} fill="currentColor" /> : <CheckCircle size={20} />}
                </div>
                <div className={`w-full md:w-[45%] ${index % 2 === 0 ? 'md:mr-auto ml-20 md:pr-16 text-left md:text-right' : 'md:ml-auto ml-20 md:pl-16 text-left'}`}>
                   <div className={`bg-white/5 backdrop-blur-xl p-6 rounded-3xl border ${isCurrent ? 'border-amber-400/50 shadow-xl' : isLocked ? 'opacity-50 border-white/5' : 'border-emerald-500/30'}`}>
                      <h3 className="font-serif text-2xl font-bold text-white mb-1">{stage.title}</h3>
                      <p className="text-sm text-emerald-200/70">{stage.subtitle}</p>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ScholarDashboardView = ({ batches, onJoinSession, setShowScholarManage }: any) => {
  return (
    <div className="relative z-10 pt-32 pb-20 max-w-6xl mx-auto px-6 space-y-8">
      <div className="bg-[#052e16]/80 backdrop-blur-md p-8 rounded-[2rem] shadow-2xl relative overflow-hidden border border-emerald-800/50 flex flex-col md:flex-row items-center justify-between">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-2">Scholar Dashboard</h1>
        <div className="bg-white/10 text-white px-6 py-3 rounded-2xl border border-white/20 font-bold flex items-center gap-3">
          <BookOpen size={20} className="text-emerald-300" />
          <div className="text-xl">{batches?.length || 0} <span className="text-sm font-normal text-emerald-200 ml-1">Assigned Batches</span></div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {batches?.map((batch: any) => (
            <div key={batch._id} className="bg-emerald-950/40 backdrop-blur-md p-6 rounded-[2rem] border border-emerald-800/50 shadow-md flex flex-col group hover:border-emerald-500/50 transition-all">
            <h3 className="font-bold text-2xl text-white mb-1 truncate">{batch.name}</h3>
            <p className="text-sm text-emerald-300 font-bold mb-6 flex items-center gap-2"><Users size={16} /> {batch.students?.length || 0} Enrolled Students</p>
            
            <div className="grid grid-cols-1 gap-3">
                <button 
                    onClick={() => onJoinSession(batch)} 
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#022c22] py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                    Class Journey <Play size={14} fill="currentColor" />
                </button>
                <button 
                    onClick={() => setShowScholarManage(batch)} 
                    className="w-full bg-indigo-600/40 hover:bg-indigo-600 border border-indigo-500/30 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
                >
                    <BookOpen size={14} /> Manage Assignments
                </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ParentsView = ({ activeChild, getToken }: any) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [globalLeaderboard, setGlobalLeaderboard] = useState<any[]>([]);
  useEffect(() => {
    const fetchData = async () => {
      if (!activeChild?.id) return;
      try {
        const token = await getToken();
        const [dash, board] = await Promise.all([
          axios.get(`${API_BASE}/api/parent/dashboard/${activeChild.id}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE}/api/live/global-leaderboard`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        setDashboardData(dash.data);
        setGlobalLeaderboard(board.data.leaderboard || []);
      } catch (err) {}
    };
    fetchData();
  }, [activeChild, getToken]);

  return (
    <div className="pt-32 pb-20 px-4 md:px-8 max-w-6xl mx-auto relative z-10">
       <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-2">{activeChild?.name || 'Child'}'s Progress</h1>
       <p className="text-emerald-200 mb-8 text-lg">Monitor growth, set limits, and explore curriculum.</p>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10 text-center"><div className="text-3xl font-bold text-white mb-2">{dashboardData?.stats?.sessionsAttended || 0}</div><div className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Sessions</div></div>
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10 text-center"><div className="text-3xl font-bold text-white mb-2">{activeChild?.child_progress?.[0]?.total_xp || 0}</div><div className="text-blue-400 text-xs font-bold uppercase tracking-widest">Total XP</div></div>
          <div className="bg-white/5 p-6 rounded-3xl border border-white/10 text-center"><div className="text-3xl font-bold text-white mb-2">{activeChild?.child_progress?.[0]?.streak_days || 0}</div><div className="text-amber-500 text-xs font-bold uppercase tracking-widest">Streak Days</div></div>
       </div>
    </div>
  );
};
