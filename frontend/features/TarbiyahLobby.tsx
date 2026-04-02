import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Heart, Sun, Cloud, Play, Lock, Sprout, Star, 
  Trophy, Flame, Target, User, Settings, Clock, CheckCircle, 
  TrendingUp, Moon, Sparkles, Leaf, Book,
  ChevronLeft, BarChart2, Calendar, Download, Share2, Users, ChevronDown, ShieldCheck, Loader2, Crown, ChevronRight, XCircle,
  Activity, Users2, PieChart as PieChartIcon
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, AreaChart, Area 
} from 'recharts';
import { QURAN_METADATA } from '../quranMetadata';
import { useChildContext } from '../contexts/ChildContext';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import SessionLeaderboard from './SessionLeaderboard';
import { loadRazorpayScript } from '../utils/razorpay';
import { TarbiyahOnboarding } from './TarbiyahOnboarding';
import QuranPracticeModule from './QuranPracticeModule';
import ScholarQuranManager from './ScholarQuranManager';
import ErrorBoundary from '../components/ErrorBoundary';

// --- DATA & CONSTANTS ---
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Dynamic stages count
const STAGES_COUNT = 30;
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
  onScholarJoinSession,
  attendedSessionIds = [],
  attendanceHistory = [],
  isAdmin = false,
  selectedBatchId,
  setSelectedBatchId
}: { 
  getToken: any, 
  onJoinSession: (s: any) => void,
  userRole?: 'parent' | 'scholar',
  scholarBatches?: any[],
  onScholarJoinSession?: (b: any) => void,
  attendedSessionIds?: string[],
  attendanceHistory?: any[],
  isAdmin?: boolean,
  selectedBatchId: string | null,
  setSelectedBatchId: (id: string | null) => void
}) => {
  const [view, setView] = useState<'kids' | 'parent' | 'scholar_journey' | 'scholar_dashboard'>(
     userRole === 'scholar' ? 'scholar_dashboard' : 'kids'
  );
  const [targetBatchId, setTargetBatchId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { activeChild, children: childrenList, updateLocalProgress, loading: loadingChildren } = useChildContext();
  const [batches, setBatches] = useState<any[]>([]);
  const [accessStatus, setAccessStatus] = useState<any>(null);
  const [showQuranPractice, setShowQuranPractice] = useState<{ active: boolean, mode: 'REVISE' | 'PRACTICE' }>({ active: false, mode: 'REVISE' });
  const [showJoinChoice, setShowJoinChoice] = useState(false);
  const [showScholarManage, setShowScholarManage] = useState<any>(null); // To store batch for scholar managemnt
  const { t } = useTranslation();

  useEffect(() => {
    const fetchData = async () => {
      if (document.visibilityState !== 'visible') return;
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
    const hasActiveBatch = batches.some(b => b.status === 'active');
    const interval = setInterval(fetchData, hasActiveBatch ? 4000 : 20000); 
    return () => clearInterval(interval);
  }, [getToken, batches.some(b => b.status === 'active')]);

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
            {isAdmin ? (
              <>
                <button onClick={() => setView('kids')} className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all ${view === 'kids' ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'text-emerald-200 hover:text-white'}`}>Map</button>
                <button onClick={() => setView('parent')} className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all ${view === 'parent' ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'text-indigo-200 hover:text-white'}`}>Parent</button>
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button 
                   onClick={() => setView(view.startsWith('scholar') ? 'kids' : 'scholar_dashboard')} 
                   className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all ${view.startsWith('scholar') ? 'bg-amber-600 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-white/5 text-amber-200 hover:bg-white/10'}`}
                >
                  <ShieldCheck size={12} className="inline mr-1" /> Scholar Mode
                </button>
                {view.startsWith('scholar') && (
                  <button onClick={() => setView('scholar_journey')} className={`px-4 py-2 rounded-full text-[10px] font-bold transition-all ${view === 'scholar_journey' ? 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'text-emerald-200 hover:text-white ml-1'}`}>Class Flow</button>
                )}
              </>
            ) : userRole === 'scholar' ? (
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

      {/* MAIN VIEW AREA with ERROR BOUNDARY */}
      <div className="relative z-10">
        <ErrorBoundary name="Tarbiyah Content Area">
          {(() => {
            // Priority: Scholar-specific views
            if (view === 'scholar_journey') {
              return (
                <ScholarJourneyView 
                  scrollProgress={scrollProgress} 
                  batches={scholarBatches} 
                  onJoinSession={onScholarJoinSession!} 
                  initialBatchId={targetBatchId} 
                />
              );
            }
            if (view === 'scholar_dashboard') {
              return (
                <ScholarDashboardView 
                  batches={scholarBatches} 
                  onJoinSession={(batch: any) => { setTargetBatchId(batch._id); setView('scholar_journey'); }} 
                  attendedSessionIds={attendedSessionIds}
                  setShowScholarManage={setShowScholarManage}
                />
              );
            }
            // User-facing views
            if (view === 'kids') {
              return (
                <KidsView 
                  scrollProgress={scrollProgress} 
                  activeChild={activeChild} 
                  onJoinLive={handleJoinLive} 
                  currentBatchStatus={currentBatchStatus} 
                  batches={batches} 
                  accessStatus={accessStatus} 
                  getToken={getToken} 
                  setShowQuranPractice={(mode: 'REVISE' | 'PRACTICE') => setShowQuranPractice({ active: true, mode })}
                  setShowJoinChoice={setShowJoinChoice}
                  attendedSessionIds={attendedSessionIds}
                  attendanceHistory={attendanceHistory}
                  childrenList={childrenList}
                  userRole={userRole}
                  selectedBatchId={selectedBatchId}
                  setSelectedBatchId={setSelectedBatchId}
                  loadingChildren={loadingChildren}
                />
              );
            }
            return <ParentsView activeChild={activeChild} batches={batches} getToken={getToken} />;
          })()}
        </ErrorBoundary>
      </div>

      {showQuranPractice.active && activeChild && (
        <div className="fixed inset-0 z-[110] bg-[#022c22]/95 backdrop-blur-xl flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-4xl relative">
            <button onClick={() => setShowQuranPractice({ active: false, mode: 'REVISE' })} className="absolute -top-12 right-0 text-white/60 hover:text-white font-bold flex items-center gap-2">✕ Close Practice</button>
            <QuranPracticeModule 
              childId={activeChild.id} 
              initialMode={showQuranPractice.mode} 
              onClose={() => setShowQuranPractice({ active: false, mode: 'REVISE' })}
              updateLocalProgress={updateLocalProgress}
              onComplete={() => {}} 
            />
          </div>
        </div>
      )}

      {showJoinChoice && (
        <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
           <div className="bg-[#052e16] border border-emerald-500/30 rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl relative overflow-hidden text-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />
              <h3 className="text-3xl font-serif font-bold text-white mb-2">Quran Portal</h3>
              <p className="text-emerald-200 mb-8">Choose your path for today's lesson</p>
              
              <div className="grid grid-cols-1 gap-4">
                 {/* REVISE MODE */}
                 <button 
                   onClick={() => { setShowJoinChoice(false); setShowQuranPractice({ active: true, mode: 'REVISE' }); }}
                   className="flex items-center gap-4 p-5 bg-emerald-100 hover:bg-white text-emerald-950 rounded-2xl transition-all group border-b-4 border-emerald-300"
                 >
                    <div className="bg-emerald-900 text-white p-3 rounded-xl shadow-lg"><BookOpen size={24} /></div>
                    <div className="text-left">
                       <div className="font-bold text-lg">Revise Lesson</div>
                       <div className="text-xs font-medium text-emerald-700">Read & listen to your assigned Juz part</div>
                    </div>
                 </button>

                 {/* PRACTICE MODE */}
                 <button 
                   onClick={() => { setShowJoinChoice(false); setShowQuranPractice({ active: true, mode: 'PRACTICE' }); }}
                   className="flex items-center gap-4 p-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all group border-b-4 border-indigo-800"
                 >
                    <div className="bg-white/20 p-3 rounded-xl"><Target size={24} /></div>
                    <div className="text-left">
                       <div className="font-bold text-lg">Practice Quiz</div>
                       <div className="text-xs font-medium opacity-80">Test your knowledge and earn max XP</div>
                    </div>
                 </button>

                 {/* JOIN/OBSERVE LIVE (Only if Active) */}
                 {batches.some((b: any) => b.status === 'active' && b.activeSessionId) && (
                    <button 
                      onClick={() => { setShowJoinChoice(false); handleJoinLive(); }}
                      className="flex items-center gap-4 p-5 rounded-2xl transition-all group border-b-4 bg-amber-500 hover:bg-amber-400 text-amber-950 border-amber-600 shadow-[0_10px_20px_rgba(245,158,11,0.2)]"
                    >
                       <div className="bg-white/20 p-3 rounded-xl">
                         <Users size={24} />
                       </div>
                       <div className="text-left">
                          <div className="font-bold text-lg flex items-center gap-2">
                            Join the live session
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                          </div>
                          <div className="text-xs font-medium opacity-80">
                            Enter the class with your teacher
                          </div>
                       </div>
                    </button>
                 )}

                 <button 
                   onClick={() => setShowJoinChoice(false)}
                   className="mt-4 text-emerald-400 font-black text-sm uppercase tracking-widest py-2 hover:text-emerald-300 transition-colors"
                 >
                    Close Portal
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
                    <ScholarQuranManager 
                        batchId={showScholarManage._id} 
                        batchName={showScholarManage.name} 
                        onClose={() => setShowScholarManage(null)}
                    />
                </div>
            </div>
         </div>
      )}
    </div>
  );
};

const KidsView = ({ scrollProgress, activeChild, onJoinLive, currentBatchStatus, batches, accessStatus, getToken, setShowQuranPractice, setShowJoinChoice, attendedSessionIds = [], attendanceHistory = [], childrenList = [], userRole = 'parent', selectedBatchId, setSelectedBatchId, loadingChildren }: any) => {
  const [isLoading, setIsLoading] = useState(false);
  const progress = activeChild?.child_progress?.[0];
  
  // PRIORITIZE THE BATCH WHERE THE ACTIVE CHILD IS ENROLLED
  const activeBatch = useMemo(() => {
    if (!batches || batches.length === 0) return null;
    if (selectedBatchId) return batches.find((b: any) => b._id === selectedBatchId) || batches[0];
    
    if (activeChild?.id) {
      const enrolledBatch = batches.find((b: any) => 
        b.students && b.students.some((sId: any) => String(sId) === String(activeChild.id))
      );
      if (enrolledBatch) return enrolledBatch;
    }
    return batches[0];
  }, [batches, activeChild?.id, selectedBatchId]);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // SYNCED LOGIC
  const activeSessionId = activeBatch?.activeSessionId;
  const hasActiveSession = !!activeSessionId;
  const pastSessions = activeBatch?.pastSessions || [];
    
  // Classes passed is number of sessions that have ALREADY STARTED in this batch
  // Historically we relied on endedAt, but total count of sessions in history is better for targeting
  const totalClassesPassed = pastSessions.length;
  
  const hasPremium = accessStatus?.hasAccess || (batches && batches.length > 0) || userRole === 'scholar';

  // WINDOWED JOURNEY LOGIC:
  // Instead of always showing index 0..29, we show a 30-node window.
  // We want to center the "current/next" session in the view if the batch is old.
  const WINDOW_SIZE = 30;
  let startOffset = 0;
  
  if (totalClassesPassed >= 20) {
    // If they've passed many classes, start shifting the window (keeping current progress visible)
    startOffset = Math.max(0, totalClassesPassed - 15);
  }
  
  // Ensure we don't slide past what the UI can handle if pastSessions is small
  // But actually, pastSessions can be empty.
  
  const lastUnlockedIndex = Math.max(0, Math.min(totalClassesPassed, startOffset + 29));
  const stagesCount = STAGES_COUNT;
  const maxPercentage = (lastUnlockedIndex / (stagesCount - 1)) * 100;
  const currentDraw = (scrollProgress || 0) * 2.0;
  const fillPercentage = Math.min(currentDraw, maxPercentage || 0);

  // Entry Guard: If not paid OR (is paid but no child profile exists)
  // Admins skip this block if they have the 'scholar' (which includes admin) userRole
  const isAdminOrScholar = userRole === 'scholar';
  if (!isAdminOrScholar) {
    if (loadingChildren || !accessStatus) {
      return (
        <div className="min-h-screen flex items-center justify-center">
           <Loader2 className="animate-spin text-emerald-400" size={48} />
        </div>
      );
    }

    if (!hasPremium || (accessStatus?.hasAccess && (!childrenList || childrenList.length === 0))) {
      return <TarbiyahOnboarding getToken={getToken} isPaid={accessStatus?.hasAccess} />;
    }
  }

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
                  <div style={{ width: `${(progress?.total_xp || 0) % 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-1000 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/30 w-full" style={{animation: 'shimmer 2s infinite'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Batch Selector (Only if multiple batches) */}
          {batches && batches.length > 1 && (
            <div className="mt-8 pt-6 border-t border-white/10">
               <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-[10px] uppercase tracking-widest">
                    <Calendar size={14} /> My Learning Tracks
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {batches.map((b: any) => (
                      <button 
                        key={b._id} 
                        onClick={() => setSelectedBatchId(b._id)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border transition-all ${selectedBatchId === b._id ? 'bg-emerald-500 text-emerald-950 border-emerald-400 shadow-lg' : 'bg-white/5 text-emerald-200 border-white/10 hover:bg-white/10'}`}
                      >
                        {b.name}
                      </button>
                    ))}
                  </div>
               </div>
            </div>
          )}
          
          {/* Recent Attendance Summary (User Request: Show status of last 4 classes) */}
          {attendanceHistory.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-300/60">Class History (Recent 4)</h3>
                    <div className="flex gap-1">
                        {attendanceHistory.slice(0, 4).reverse().map((session: any, idx: number) => (
                            <div key={session.sessionId} className="group relative">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${session.attended ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-red-500/20 border-red-500/30 text-red-400 opacity-60'}`}>
                                    {session.attended ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                </div>
                                {/* Hover tooltip: session starting date */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-[8px] text-white rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                                    Session {attendanceHistory.length - (idx)} • {new Date(session.startedAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
          )}
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
          {Array.from({ length: WINDOW_SIZE }).map((_, i) => {
            const index = startOffset + i;
            
            // Dynamic stage info based on index
            const stageTitle = `Live Session ${index + 1}`;
            
            const historicalSession = pastSessions[index];
            const isActuallyLive = hasActiveSession && historicalSession?.sessionId === activeSessionId;
            const isNextTarget = !hasActiveSession && index === totalClassesPassed;
            const isCurrent = isActuallyLive || isNextTarget;
            
            const isHistorical = index < totalClassesPassed;
            const isUpcoming = index > (hasActiveSession ? totalClassesPassed - 1 : totalClassesPassed);
            const isLocked = index > totalClassesPassed;

            const wasPresent = historicalSession && Array.isArray(attendedSessionIds) && attendedSessionIds.some((id: any) => 
               id && historicalSession.sessionId && String(id) === String(historicalSession.sessionId)
            );
            const statusLabel = isHistorical ? (wasPresent ? "Completed" : "Absent") : (isActuallyLive ? "Live Now" : "Scheduled");

            const handleNodeClick = (e: React.MouseEvent) => {
              e.stopPropagation();
              if (!hasPremium) {
                handleRequestAccess();
              } else if (isActuallyLive) {
                setShowJoinChoice(true);
              } else if (isHistorical) {
                if (historicalSession?.sessionId) {
                  setSelectedSessionId(historicalSession.sessionId);
                }
              } else if (isNextTarget || isUpcoming || isLocked) {
                setShowQuranPractice({ active: true, mode: 'REVISE' });
              }
            };

            return (
              <div key={index} className="flex md:justify-center items-center relative group">
                {/* INTERACTIVE NODE */}
                <div 
                   onClick={handleNodeClick}
                   className={`absolute left-[2rem] md:left-1/2 -translate-x-1/2 w-14 h-14 rounded-full border-4 border-[#022c22] z-20 flex items-center justify-center shadow-xl transition-all cursor-pointer hover:scale-110 active:scale-95 ${isLocked ? 'bg-gray-800 text-gray-400' : isActuallyLive ? 'bg-emerald-400 text-black scale-110 shadow-[0_0_20px_rgba(16,185,129,0.6)] animate-pulse' : isNextTarget ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : isUpcoming ? 'bg-emerald-800 text-emerald-300 border-emerald-500/30' : (wasPresent ? 'bg-emerald-600 text-white' : 'bg-red-500/80 text-white')}`}>
                     {isHistorical ? (wasPresent ? <CheckCircle size={18} /> : <XCircle size={18} />) : (isActuallyLive ? <Play size={18} fill="currentColor" /> : isNextTarget ? <Clock size={18} /> : <Calendar size={18} />)}
                </div>

                {/* INTERACTIVE CARD */}
                <div 
                  onClick={handleNodeClick}
                  className={`w-full md:w-[45%] pl-24 md:pl-0 cursor-pointer group/card ${index % 2 !== 0 ? 'md:ml-auto md:pl-20' : 'md:mr-auto md:pr-20 md:text-right'}`}
                >
                   <div className={`backdrop-blur-xl rounded-[2rem] p-6 border transition-all active:scale-95 ${isLocked ? 'bg-white/5 opacity-50 border-white/5' : isCurrent ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)] scroll-mt-20' : isUpcoming ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-white/10 border-white/20 shadow-xl hover:bg-white/20'}`}>
                      <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isHistorical ? (wasPresent ? 'text-emerald-400' : 'text-red-400') : isActuallyLive ? 'text-emerald-500/60' : 'text-emerald-300'}`}>
                        {isActuallyLive ? 'Live Now' : (isNextTarget ? 'Class Scheduled' : statusLabel)}
                    </div>
                      <h4 className={`font-bold text-xl ${isCurrent ? 'text-emerald-300' : 'text-white'}`}>{stageTitle}</h4>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selectedSessionId && activeBatch && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-[#022c22] border border-emerald-500/30 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
             <div className="flex justify-between items-center px-8 py-4 bg-emerald-950/50 border-b border-emerald-800/40">
               <h3 className="font-serif text-xl font-bold text-white">Class Achievements</h3>
               <button onClick={() => setSelectedSessionId(null)} className="bg-emerald-800 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95">
                 <ChevronLeft size={16} /> Back to Journey
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

const ScholarJourneyView = ({ scrollProgress, batches, onJoinSession, initialBatchId }: any) => {
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(initialBatchId || batches?.[0]?._id || null);
  const activeBatch = batches.find((b:any) => b._id === selectedBatchId) || batches?.[0];
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // SCHOLAR SYNCED LOGIC
  const activeSessionId = activeBatch?.activeSessionId;
  const hasActiveSession = !!activeSessionId;
  const pastSessions = activeBatch?.pastSessions || [];
  
  const currentLiveIndex = hasActiveSession 
    ? pastSessions.findIndex((s: any) => s.sessionId === activeSessionId)
    : -1;
    
  const totalClassesPassed = pastSessions.filter((s: any) => !!s.endedAt).length;

  const WINDOW_SIZE = 30;
  let startOffset = 0;
  if (totalClassesPassed >= 20) {
    startOffset = Math.max(0, totalClassesPassed - 15);
  }

  const lastUnlockedIndex = Math.max(0, Math.min(totalClassesPassed, startOffset + 29));
  const stagesCount = 30; // Consistent with KidsView
  const maxPercentage = (lastUnlockedIndex / (stagesCount - 1)) * 100;
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
          {Array.from({ length: WINDOW_SIZE }).map((_, i) => {
            const index = startOffset + i;
            const stageTitle = `Live Session ${index + 1}`;
            
            const historicalSession = pastSessions[index];
            const isHistorical = !!historicalSession?.endedAt || (index < totalClassesPassed);
            const isActuallyLive = hasActiveSession && historicalSession?.sessionId === activeSessionId;
            const isCurrent = isActuallyLive || (!hasActiveSession && index === totalClassesPassed);
            const isLocked = index > totalClassesPassed && !isCurrent;

            return (
              <div key={index} className="flex md:justify-center items-center relative group">
                <div onClick={() => { 
                  if (isActuallyLive || isCurrent) onJoinSession(activeBatch); 
                  else if (isHistorical && historicalSession?.sessionId) setSelectedSessionId(historicalSession.sessionId); 
                }} className={`absolute left-[2rem] md:left-1/2 -translate-x-1/2 w-14 h-14 rounded-full border-4 border-[#022c22] z-20 flex items-center justify-center shadow-xl transition-all ${isLocked ? 'bg-gray-800 text-gray-500' : (isActuallyLive || isCurrent) ? 'bg-amber-400 text-amber-900 scale-125 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-pulse' : 'bg-emerald-400 text-emerald-950'}`}>
                  {isLocked ? <Lock size={20} /> : isActuallyLive ? <Play size={20} fill="currentColor" /> : isCurrent ? <Play size={20} fill="currentColor" className="opacity-50" /> : <CheckCircle size={20} />}
                </div>
                <div 
                   onClick={() => { 
                     if (isActuallyLive || isCurrent) onJoinSession(activeBatch);
                     else if (isHistorical && historicalSession?.sessionId) setSelectedSessionId(historicalSession.sessionId); 
                   }}
                   className={`w-full md:w-[45%] cursor-pointer ${index % 2 === 0 ? 'md:mr-auto ml-20 md:pr-16 text-left md:text-right' : 'md:ml-auto ml-20 md:pl-16 text-left'}`}
                >
                   <div className={`bg-white/5 backdrop-blur-xl p-6 rounded-3xl border transition-all ${isCurrent ? 'border-amber-400/50 shadow-xl bg-amber-400/5 scale-[1.02] ring-1 ring-amber-400/20' : isLocked ? 'opacity-50 border-white/5' : 'border-emerald-500/30 hover:bg-white/10'}`}>
                      <h3 className="font-serif text-2xl font-bold text-white mb-1">{stageTitle}</h3>
                      <div className={`text-[10px] font-black uppercase tracking-widest ${isLocked ? 'text-gray-500' : isCurrent ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {isActuallyLive ? 'Live Now • Click to Join' : (isCurrent ? 'Next Class • Click to Start' : isHistorical ? 'Session Completed' : 'Upcoming')}
                      </div>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selectedSessionId && activeBatch && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
           <div className="bg-[#022c22] border border-emerald-500/30 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
             <div className="flex justify-between items-center px-8 py-4 bg-emerald-950/50 border-b border-emerald-800/40">
               <h3 className="font-serif text-xl font-bold text-white">Class Achievements</h3>
               <button onClick={() => setSelectedSessionId(null)} className="bg-emerald-800 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all active:scale-95">
                 <ChevronLeft size={16} /> Back to Journey
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
  const [showSetupModal, setShowSetupModal] = useState(false);

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
    } catch (err: any) {
      console.error("Dashboard fetch failed:", err.response?.data || err.message);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeChild, getToken]);

  const stats = dashboardData?.stats;
  const hasActivity = stats?.activeDays > 0;
  const completionRate = stats?.completionRate || 0;
  
  const pieData = [
    { name: 'Completed', value: completionRate, color: '#10b981' },
    { name: 'Remaining', value: 100 - completionRate, color: 'rgba(255,255,255,0.05)' }
  ];

  return (
    <div className="pt-32 pb-20 px-4 md:px-8 max-w-6xl mx-auto relative z-10">
       {/* SVG Filter for Glowing Effect */}
       <svg width="0" height="0" className="absolute">
         <defs>
           <filter id="glow">
             <feGaussianBlur stdDeviation="3" result="coloredBlur" />
             <feMerge>
               <feMergeNode in="coloredBlur" />
               <feMergeNode in="SourceGraphic" />
             </feMerge>
           </filter>
         </defs>
       </svg>

       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-2">{activeChild?.name || 'Child'}'s Progress</h1>
            <p className="text-emerald-200 text-lg opacity-80">Monitor growth, set limits, and explore curriculum.</p>
          </div>
          <button 
            onClick={() => setShowSetupModal(true)}
            className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl border border-white/20 font-bold flex items-center gap-3 transition-all active:scale-95 group shadow-xl"
          >
            <Settings className="text-emerald-400 group-hover:rotate-90 transition-transform duration-500" size={20} />
            Setup Quran Progress
          </button>
       </div>

       {/* Empty State / Welcome Message for new users */}
       {!hasActivity && !dashboardData && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-8 rounded-[2.5rem] text-center mb-12 backdrop-blur-sm">
             <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="text-emerald-400" size={32} />
             </div>
             <h3 className="text-2xl font-serif font-bold text-white mb-2">Welcome to the Learning Journey!</h3>
             <p className="text-emerald-200/70 max-w-lg mx-auto">
                {activeChild?.name} hasn't attended any live sessions or practices yet. 
                Analytics and XP will appear here once the first session is completed.
             </p>
          </div>
       )}

       {/* KEY STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
           <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-3xl -mr-8 -mt-8" />
              <div className="text-emerald-400 text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Trophy size={14} /> Total XP
              </div>
              <div className="text-5xl font-black text-white mb-2">{dashboardData?.stats?.currentXP || 0}</div>
              <div className="text-emerald-200/50 text-xs font-medium italic">Level {dashboardData?.stats?.currentLevel || 1} Achieved</div>
           </div>

           <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-3xl -mr-8 -mt-8" />
              <div className="text-blue-400 text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Target size={14} /> Avg. Accuracy
              </div>
              <div className="text-5xl font-black text-white mb-2">{dashboardData?.stats?.averageAccuracy || 0}%</div>
              <div className="text-blue-200/50 text-xs font-medium italic">Based on last 10 practice sessions</div>
           </div>

           <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-3xl -mr-8 -mt-8" />
              <div className="text-amber-500 text-xs font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Activity size={14} /> Attendance
              </div>
              <div className="text-5xl font-black text-white mb-2">{dashboardData?.stats?.attendanceRate || 0}%</div>
              <div className="text-amber-200/50 text-xs font-medium italic">{dashboardData?.stats?.streak || 0} Day Current Streak</div>
           </div>
        </div>

        {/* VISUAL ANALYTICS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
           {/* GLOWING PIE CHART */}
           <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-serif text-2xl font-bold text-white flex items-center gap-3">
                   <div className="p-2 bg-emerald-500/10 rounded-xl"><PieChartIcon className="text-emerald-400" size={20} /></div>
                   Quran Completion
                </h3>
                <div className="bg-emerald-500/20 text-emerald-300 px-4 py-1.5 rounded-full text-sm font-bold border border-emerald-500/30">
                  {completionRate}% Complete
                </div>
              </div>
              
              <div className="h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={100}
                      paddingAngle={0}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.color} 
                          filter={index === 0 ? 'url(#glow)' : 'none'}
                          style={{ transition: 'all 1s ease' }}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <div className="text-4xl font-black text-white">{completionRate}%</div>
                   <div className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-widest mt-1">Overall Progress</div>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                 <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                    <div className="text-2xl font-bold text-white">{(completionRate / 100 * 30).toFixed(1)}</div>
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Juz Completed</div>
                 </div>
                 <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                    <div className="text-2xl font-bold text-white">{(completionRate / 100 * 450).toFixed(0)}</div>
                    <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Parts Mastered</div>
                 </div>
              </div>
           </div>

           {/* WEEKLY ACTIVITY BAR CHART */}
           <div className="bg-white/5 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-serif text-2xl font-bold text-white flex items-center gap-3">
                   <div className="p-2 bg-indigo-500/10 rounded-xl"><TrendingUp className="text-indigo-400" size={20} /></div>
                   Engagement
                </h3>
                <div className="text-indigo-200/50 text-xs font-medium">Last 7 Days</div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData?.weeklyActivity || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: 'bold'}} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: 'rgba(255,255,255,0.2)', fontSize: 10}} 
                    />
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{
                        backgroundColor: '#052e16',
                        borderRadius: '16px',
                        border: '1px solid rgba(16,185,129,0.3)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        color: 'white'
                      }}
                    />
                    <Bar 
                      dataKey="min" 
                      fill="url(#barGradient)" 
                      radius={[6, 6, 0, 0]} 
                      barSize={30}
                    >
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                      </defs>
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-8 flex items-center gap-4 bg-indigo-500/10 p-5 rounded-2xl border border-indigo-500/20">
                 <div className="bg-indigo-500/20 p-2.5 rounded-xl"><Clock className="text-indigo-400" size={18} /></div>
                 <div>
                    <div className="text-sm font-bold text-white">Total Engagement Time</div>
                    <div className="text-xl font-black text-indigo-300">{dashboardData?.timeThisWeek?.total || "0h 0m"}</div>
                 </div>
              </div>
           </div>
        </div>

        {/* SETUP QURAN PROGRESS MODAL */}
        {showSetupModal && (
          <SetupQuranProgress 
            childId={activeChild?.id} 
            getToken={getToken} 
            onClose={() => setShowSetupModal(false)}
            onSuccess={() => { setShowSetupModal(false); fetchData(); }}
            initialParts={dashboardData?.stats?.completed_quran_parts || []}
          />
        )}
    </div>
  );
};

const SetupQuranProgress = ({ childId, getToken, onClose, onSuccess, initialParts = [] }: any) => {
  const [selectedJuz, setSelectedJuz] = useState(1);
  const [completedParts, setCompletedParts] = useState<string[]>(initialParts);
  const [saving, setSaving] = useState(false);
  const [juzLoading, setJuzLoading] = useState(false);
  const [dynamicMeta, setDynamicMeta] = useState<any>(null);

  useEffect(() => {
    const fetchMeta = async () => {
      setJuzLoading(true);
      try {
        const token = await getToken();
        const res = await axios.get(`${API_BASE}/api/parent/quran-meta/${selectedJuz}`, {
           headers: { Authorization: `Bearer ${token}` }
        });
        setDynamicMeta(res.data);
      } catch (err) {
        setDynamicMeta(null);
      } finally {
        setJuzLoading(false);
      }
    };
    fetchMeta();
  }, [selectedJuz, getToken]);

  const togglePart = (part: string) => {
    setCompletedParts(prev => 
      prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part]
    );
  };

  const toggleJuz = (j: number) => {
    const juzParts = [...Array(15)].map((_, i) => `J${j}P${i + 1}`);
    const allSet = juzParts.every(p => completedParts.includes(p));
    if (allSet) {
      setCompletedParts(prev => prev.filter(p => !juzParts.includes(p)));
    } else {
      setCompletedParts(prev => [...new Set([...prev, ...juzParts])]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      await axios.post(`${API_BASE}/api/parent/completion/${childId}`, 
        { parts: completedParts },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onSuccess();
    } catch (err) {
      alert("Failed to save progress");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
       <div className="bg-[#022c22] border border-emerald-500/30 rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
          <div className="p-8 border-b border-white/5 bg-emerald-950/50 flex justify-between items-center">
             <div>
                <h3 className="text-3xl font-serif font-bold text-white">Quran Progress Setup</h3>
                <p className="text-emerald-200/60 text-sm mt-1">Mark the parts your child has already completed in the past.</p>
             </div>
             <div className="bg-emerald-500/20 text-emerald-400 px-6 py-2 rounded-xl border border-emerald-500/30 font-black">
                {completedParts.length} / 450 Parts Done
             </div>
          </div>
          
          <div className="flex-1 flex overflow-hidden">
             {/* Juz Selector */}
             <div className="w-1/4 overflow-y-auto border-r border-white/5 p-4 space-y-2 custom-scrollbar">
                {[...Array(30)].map((_, i) => {
                   const j = i + 1;
                   const juzParts = [...Array(15)].map((_, pi) => `J${j}P${pi + 1}`);
                   const doneCount = juzParts.filter(p => completedParts.includes(p)).length;
                   return (
                      <button 
                        key={j}
                        onClick={() => setSelectedJuz(j)}
                        className={`w-full p-4 rounded-3xl transition-all border flex flex-col gap-1 items-start relative overflow-hidden group ${selectedJuz === j ? 'bg-emerald-600 border-white/20 text-white shadow-lg scale-95' : 'bg-white/5 border-white/5 text-emerald-100 hover:bg-white/10'}`}
                      >
                         <div className="flex items-center justify-between w-full">
                            <span className="font-bold">Juz {j}</span>
                            {doneCount === 15 && <CheckCircle size={14} className="text-white" />}
                         </div>
                         <div className="text-[10px] opacity-60 font-black">{doneCount}/15 Parts</div>
                         {doneCount > 0 && doneCount < 15 && (
                           <div className="absolute bottom-0 left-0 h-1 bg-white/20" style={{width: `${(doneCount/15)*100}%`}}></div>
                         )}
                      </button>
                   );
                })}
             </div>

             {/* Subparts Selector */}
             <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-black/20">
                <div className="flex justify-between items-center mb-8">
                   <h4 className="text-2xl font-bold text-white">Juz {selectedJuz} Subparts</h4>
                   <button 
                    onClick={() => toggleJuz(selectedJuz)}
                    className="text-xs font-black uppercase tracking-widest bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl transition-all border border-emerald-500/20"
                   >
                     Toggle Entire Juz
                   </button>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                   {juzLoading ? (
                      <div className="col-span-full py-20 flex flex-col items-center justify-center text-emerald-400">
                         <Loader2 className="animate-spin mb-2" size={32} />
                         <span className="text-sm font-bold opacity-60">Loading descriptions...</span>
                      </div>
                   ) : [...Array(15)].map((_, i) => {
                      const partNum = i + 1;
                      const partCode = `J${selectedJuz}P${partNum}`;
                      const isDone = completedParts.includes(partCode);
                      const staticMeta = QURAN_METADATA[selectedJuz]?.find(m => m.part === partNum);
                      const dynamicPart = dynamicMeta?.parts?.find((p: any) => p.partNum === partNum);
                      
                      return (
                        <button 
                          key={partCode}
                          onClick={() => togglePart(partCode)}
                          className={`p-6 rounded-[2rem] border transition-all text-left flex flex-col gap-2 relative group ${isDone ? 'bg-emerald-500 border-emerald-400 text-[#022c22] shadow-lg' : 'bg-white/5 border-white/5 text-emerald-100 hover:bg-white/10'}`}
                        >
                           <div className="flex justify-between items-center">
                              <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Part {partNum}</div>
                              {isDone ? <CheckCircle size={18} fill="currentColor" opacity="0.4" /> : <div className="w-5 h-5 rounded-full border border-white/20" />}
                           </div>
                           <div className="font-bold text-lg leading-tight">
                              {dynamicPart?.description || staticMeta?.label || `Part ${partNum}`}
                           </div>
                           <div className="text-[10px] opacity-60 font-medium lowercase">
                              {dynamicPart?.surah && <span>{dynamicPart.surah} • </span>}
                              {isDone ? 'COMPLETED' : 'NOT STARTED'}
                           </div>
                        </button>
                      );
                   })}
                 </div>
              </div>
          </div>

          <div className="p-8 border-t border-white/5 flex gap-4 bg-emerald-950/20">
             <button onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/10 transition-all">Cancel</button>
             <button onClick={handleSave} disabled={saving} className="flex-[2] bg-emerald-500 hover:bg-emerald-400 text-[#022c22] font-black py-4 rounded-2xl shadow-xl transition-all disabled:opacity-50">
               {saving ? 'UPDATING PROGRESS...' : 'SAVE QURANIC JOURNEY'}
             </button>
          </div>
       </div>
    </div>
  );
};
