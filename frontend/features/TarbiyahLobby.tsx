import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, Heart, Sun, Cloud, Play, Lock, Sprout, Star, 
  Trophy, Flame, Target, User, Settings, Clock, CheckCircle, 
  TrendingUp, Moon, Sparkles, Leaf, Book,
  ChevronLeft, BarChart2, Calendar, Download, Share2, Users, ChevronDown, ShieldCheck, Loader2, Crown, ChevronRight, XCircle,
  Activity, Users2, PieChart as PieChartIcon, ArrowRight
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
import { GuestEmailModal } from './GuestEmailModal';
import { useClerk, useUser } from '@clerk/clerk-react';
import { quranTracker } from '../utils/quranProgressTracker';
import { QaidaViewer } from './QaidaViewer';

// --- DATA & CONSTANTS ---
import { APPLICATION_API_URL } from '../lib/api';

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
  const [showQaidaViewer, setShowQaidaViewer] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { openSignUp } = useClerk();
  const { t } = useTranslation();
  const { isLoaded, isSignedIn } = useUser();
  const isLoggedIn = isLoaded && isSignedIn;

  // FIX: Sync view when userRole loads asynchronously (Clerk user loads after mount)
  useEffect(() => {
    if (userRole === 'scholar' && (view === 'kids' || view === 'parent')) {
      setView('scholar_dashboard');
    }
  }, [userRole]);

  useEffect(() => {
    const fetchData = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const token = await getToken();
        if (!token) return;
        
        const [batchesRes, accessRes] = await Promise.all([
           axios.get(`${APPLICATION_API_URL}/api/live/my-sessions`, { headers: { Authorization: `Bearer ${token}` } }),
           axios.get(`${APPLICATION_API_URL}/api/live/access/status`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        setBatches(batchesRes.data || []);
        setAccessStatus(accessRes.data);
      } catch (err) {}
    };
    fetchData();
    const hasActiveBatch = batches.some(b => b.status === 'active');
    const interval = setInterval(fetchData, hasActiveBatch ? 4000 : 5000); // 5s is fine for waiting
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
      const res = await axios.post(`${APPLICATION_API_URL}/api/live/${batchToJoin._id}/join`, {
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

  const handleRequestAccess = async (guestEmail?: string) => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const res = await loadRazorpayScript();
      if (!res) { alert("Razorpay SDK failed to load."); setIsLoading(false); return; }
      
      const { data: order } = await axios.post(`${APPLICATION_API_URL}/api/payment/create-order`, 
        { planType: 'TARBIYAH_LIFETIME', email: guestEmail }, 
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Imam",
        description: "Lifetime Tarbiyah Access",
        order_id: order.id,
        prefill: guestEmail ? { email: guestEmail } : undefined,
        handler: async function (response: any) {
             await axios.post(`${APPLICATION_API_URL}/api/payment/verify`, 
               { ...response, planType: 'TARBIYAH_LIFETIME', email: guestEmail }, 
               { headers: token ? { Authorization: `Bearer ${token}` } : {} }
             );
             
             if (!token) {
                setShowSuccessOverlay(true);
             } else {
                alert("Payment successful! Please wait for an Admin to assign your batch!");
                window.location.reload();
             }
        },
        theme: { color: "#10b981" }
      };
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) { alert("Payment initiation failed."); } finally { setIsLoading(false); }
  };

  const currentBatchStatus = batches.find(b => b.status === 'active') ? 'active' : 'waiting';

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center bg-[#020202]"><Loader2 className="animate-spin text-emerald-400" size={48} /></div>;
  }

  // RESTORED LOGIN WALL: Guests must see Onboarding/Payment screen before access to Map
  if (!isLoggedIn && userRole !== 'scholar') {
     return (
       <TarbiyahOnboarding 
         getToken={getToken} 
         handleGuestJoin={() => setShowGuestModal(true)} 
       />
     );
  }

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

      {/* MAIN VIEW AREA with ERROR BOUNDARY */}
      <div className="relative z-10">
        <ErrorBoundary name="Tarbiyah Content Area">
          {(() => {
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
                  onJoinSession={(batch: any) => { if (batch?._id) { setTargetBatchId(batch._id); setView('scholar_journey'); } }} 
                  attendedSessionIds={attendedSessionIds}
                  setShowScholarManage={setShowScholarManage}
                />
              );
            }
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
                  setShowGuestModal={setShowGuestModal}
                  handleRequestAccess={handleRequestAccess}
                  setShowQaidaViewer={setShowQaidaViewer}
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

      {/* JoinChoice modal fully removed to improve UX */}


      {showQaidaViewer && (
        <QaidaViewer 
          onClose={() => setShowQaidaViewer(false)}
          isScholar={userRole === 'scholar'}
          batchId={selectedBatchId || batches?.[0]?._id}
        />
      )}

      {showScholarManage && (
         <div className="fixed inset-0 z-[130] bg-[#022c22]/95 backdrop-blur-2xl flex items-center justify-center p-4">
             <div className="w-full max-w-5xl bg-black/40 border border-emerald-500/20 rounded-[3rem] p-1 shadow-2xl relative max-h-[90vh] overflow-y-auto no-scrollbar">
                 <button onClick={() => setShowScholarManage(null)} className="absolute top-6 right-8 text-white/50 hover:text-emerald-400 font-bold flex items-center gap-2 z-50">✕ Close Portal</button>
                 <div className="p-6 md:p-10">
                     <ScholarQuranManager batchId={showScholarManage._id} batchName={showScholarManage.name} onClose={() => setShowScholarManage(null)} />
                 </div>
             </div>
         </div>
      )}

      <GuestEmailModal 
        isOpen={showGuestModal} 
        onClose={() => setShowGuestModal(false)} 
        onConfirm={(email) => { setShowGuestModal(false); handleRequestAccess(email); }}
      />

      {showSuccessOverlay && (
        <SuccessOverlay onSignUp={() => openSignUp({ afterSignUpUrl: '/tarbiyah' })} />
      )}
    </div>
  );
};

const KidsView = ({ scrollProgress, activeChild, onJoinLive, currentBatchStatus, batches, accessStatus, getToken, setShowQuranPractice, setShowJoinChoice, attendedSessionIds = [], attendanceHistory = [], childrenList = [], userRole = 'parent', selectedBatchId, setSelectedBatchId, loadingChildren, setShowGuestModal, handleRequestAccess, setShowQaidaViewer }: any) => {
  const progress = activeChild?.child_progress?.[0];
  const activeBatch = useMemo(() => {
    if (!batches || batches.length === 0) return null;
    if (selectedBatchId) return batches.find((b: any) => b._id === selectedBatchId) || batches[0];
    if (activeChild?.id) {
       const enrolledBatch = batches.find((b: any) => b.students && b.students.some((sId: any) => String(sId) === String(activeChild.id)));
       if (enrolledBatch) return enrolledBatch;
    }
    return batches[0];
  }, [batches, activeChild?.id, selectedBatchId]);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const activeSessionId = activeBatch?.activeSessionId;
  const hasActiveSession = !!activeSessionId;
  const pastSessions = activeBatch?.pastSessions || [];
  const totalClassesPassed = pastSessions.length;
  const hasPremium = accessStatus?.hasAccess || (batches && batches.length > 0) || userRole === 'scholar';
  const WINDOW_SIZE = 30;
  let startOffset = 0;
  if (totalClassesPassed >= 20) startOffset = Math.max(0, totalClassesPassed - 15);
  
  // The light should terminate exactly at the active session, relative to the windowed timeline
  const relativeUnlockedIndex = Math.max(0, pastSessions.length - startOffset);
  const maxPercentage = Math.min(100, (relativeUnlockedIndex / (WINDOW_SIZE - 1)) * 100);
  
  const currentDraw = (scrollProgress || 0) * 2.0;
  const fillPercentage = Math.min(currentDraw, maxPercentage || 0);

  // Simplified auth check for internal view logic
  const { isSignedIn: clerkIsSignedIn } = useUser();
  const isLoggedIn = clerkIsSignedIn;

  if (isLoggedIn && !userRole.includes('scholar')) {
    if (loadingChildren) return <div className="min-h-screen flex items-center justify-center bg-[#022c22]"><Loader2 className="animate-spin text-emerald-400" size={48} /></div>;
    
    // Only show onboarding if they are logged in but have no children or no premium (unless they are a guest)
    if (!hasPremium || (accessStatus?.hasAccess && (!childrenList || childrenList.length === 0))) {
       return <TarbiyahOnboarding getToken={getToken} isPaid={accessStatus?.hasAccess} />;
    }
  }

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
                <h2 className="text-2xl font-bold text-white drop-shadow-md">{activeChild ? activeChild.name + "'s Journey" : "Little Explorer"}</h2>
                <div className="flex items-center gap-2 bg-orange-500/20 px-4 py-2 rounded-full border border-orange-500/30 text-orange-300 font-bold text-sm">
                  <Flame size={18} fill="currentColor" /> {progress?.streak_days || 0} Day Streak
                </div>
              </div>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between"><span className="text-xs font-bold text-emerald-300">{progress?.total_xp || 0} XP</span></div>
                <div className="overflow-hidden h-4 mb-4 rounded-full bg-black/40 border border-white/5">
                  <div style={{ width: `${(progress?.total_xp || 0) % 100}%` }} className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-1000" />
                </div>
              </div>
            </div>
          </div>
          {batches?.length > 1 && (
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-2 justify-center">
              {batches.map((b: any) => (
                <button key={b._id} onClick={() => setSelectedBatchId(b._id)} className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border transition-all ${selectedBatchId === b._id ? 'bg-emerald-500 text-emerald-950 border-emerald-400 shadow-lg' : 'bg-white/5 text-emerald-200 border-white/10 hover:bg-white/10'}`}>{b.name}</button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Study Actions */}
        <div className="mt-8 grid grid-cols-3 gap-3">
           <button onClick={() => setShowQuranPractice('REVISE')} className="bg-emerald-900/40 hover:bg-emerald-800/60 backdrop-blur-xl border border-emerald-500/30 text-emerald-100 p-4 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 hover:-translate-y-1 shadow-xl group cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/0 via-emerald-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="bg-emerald-500/20 p-4 rounded-full text-emerald-300 group-hover:scale-110 group-hover:bg-emerald-500/30 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]"><BookOpen size={26} strokeWidth={1.5} /></div>
              <span className="font-bold text-[11px] uppercase tracking-[0.1em] text-emerald-200 group-hover:text-emerald-100 drop-shadow-md">Revise</span>
           </button>
           
           <button onClick={() => setShowQuranPractice('PRACTICE')} className="bg-indigo-900/40 hover:bg-indigo-800/60 backdrop-blur-xl border border-indigo-500/30 text-indigo-100 p-4 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 hover:-translate-y-1 shadow-xl group cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/0 via-indigo-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="bg-indigo-500/20 p-4 rounded-full text-indigo-300 group-hover:scale-110 group-hover:bg-indigo-500/30 transition-all duration-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]"><Target size={26} strokeWidth={1.5} /></div>
              <span className="font-bold text-[11px] uppercase tracking-[0.1em] text-indigo-200 group-hover:text-indigo-100 drop-shadow-md">Practice</span>
           </button>
           
           <button onClick={() => setShowQaidaViewer(true)} className="bg-amber-900/40 hover:bg-amber-800/60 backdrop-blur-xl border border-amber-500/30 text-amber-100 p-4 rounded-3xl flex flex-col items-center justify-center gap-3 transition-all hover:scale-105 hover:-translate-y-1 shadow-xl group cursor-pointer relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/0 via-amber-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="bg-amber-500/20 p-4 rounded-full text-amber-300 group-hover:scale-110 group-hover:bg-amber-500/30 transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]"><Book size={26} strokeWidth={1.5} /></div>
              <span className="font-bold text-[11px] uppercase tracking-[0.1em] text-amber-200 group-hover:text-amber-100 drop-shadow-md">Qaida</span>
           </button>
        </div>
      </div>

      <div className="relative max-w-2xl mx-auto px-4 pb-32">
        <h3 className="text-center font-serif text-3xl font-bold text-white mb-16 flex items-center justify-center gap-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-100 italic drop-shadow-lg">Your Journey to Light</h3>
        <div className="absolute top-24 bottom-16 left-[2rem] md:left-1/2 w-1 md:-translate-x-1/2 z-0">
          <svg className="h-full w-full overflow-visible">
             <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="2" strokeDasharray="8 8" />
             <line x1="50%" y1="0%" x2="50%" y2={`${fillPercentage}%`} stroke="#10b981" strokeWidth="6" strokeLinecap="round" className="drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
          </svg>
        </div>
        <div className="space-y-24 relative z-10">
          {Array.from({ length: WINDOW_SIZE }).map((_, i) => {
            const index = startOffset + i;
            const historicalSession = pastSessions[index];
            const isActuallyLive = hasActiveSession && historicalSession?.sessionId === activeSessionId;
            const isHistorical = index < pastSessions.length && !isActuallyLive;
            const isCurrent = isActuallyLive || (!hasActiveSession && index === pastSessions.length);
            const isLocked = index > pastSessions.length || (index === pastSessions.length && hasActiveSession);
            const wasPresent = historicalSession?.attendedChildren?.includes(String(activeChild?.id)) || false;

            const handleNodeClick = () => {
              if (!isLoggedIn) {
                 setShowGuestModal(true);
              } else if (!hasPremium) {
                 handleRequestAccess();
              } else if (isActuallyLive) {
                 onJoinLive();
              } else if (isHistorical && historicalSession?.sessionId) {
                 setSelectedSessionId(historicalSession.sessionId);
              } else {
                 alert("Session is not live yet. The scholar has not started the class.");
              }
            };

            return (
              <div key={index} className="flex md:justify-center items-center relative group">
                <div onClick={handleNodeClick} className={`absolute left-[2rem] md:left-1/2 -translate-x-1/2 w-14 h-14 rounded-full border-4 border-[#022c22] z-20 flex items-center justify-center shadow-xl transition-all cursor-pointer hover:scale-110 active:scale-95 ${isLocked ? 'bg-gray-800 text-gray-400' : isActuallyLive ? 'bg-emerald-400 text-black scale-110 animate-pulse' : isHistorical ? (wasPresent ? 'bg-emerald-600' : 'bg-red-500/80') : 'bg-emerald-800 text-emerald-300'}`}>
                  {isActuallyLive ? <Play size={18} fill="currentColor" /> : isHistorical ? (wasPresent ? <CheckCircle size={18} /> : <XCircle size={18} />) : <Lock size={18} />}
                </div>
                <div onClick={handleNodeClick} className={`w-full md:w-[45%] pl-24 md:pl-0 cursor-pointer ${index % 2 !== 0 ? 'md:ml-auto md:pl-20' : 'md:mr-auto md:pr-20 md:text-right'}`}>
                   <div className={`backdrop-blur-xl rounded-[2rem] p-6 border transition-all ${isLocked ? 'bg-white/5 opacity-50' : isCurrent ? 'bg-emerald-500/10 border-emerald-500/40 shadow-xl' : 'bg-white/10'}`}>
                      <div className="text-[10px] font-black uppercase tracking-widest mb-1">{isActuallyLive ? 'Live Now' : (isHistorical ? (wasPresent ? 'Completed' : 'Absent') : 'Scheduled')}</div>
                      <h4 className="font-bold text-xl text-white">Live Session {index + 1}</h4>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selectedSessionId && activeBatch && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-[#022c22] border border-emerald-500/30 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
             <div className="flex justify-between items-center px-8 py-4 bg-emerald-950/50 border-b border-emerald-800/40">
               <button onClick={() => setSelectedSessionId(null)} className="bg-emerald-800 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2"><ChevronLeft size={16} /> Back</button>
             </div>
             <div className="flex-1 overflow-y-auto h-[600px]">
               <SessionLeaderboard batchId={activeBatch._id} sessionId={selectedSessionId} onClose={() => setSelectedSessionId(null)} />
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
  const activeSessionId = activeBatch?.activeSessionId;
  const hasActiveSession = !!activeSessionId;
  const pastSessions = activeBatch?.pastSessions || [];
  const totalClassesPassed = pastSessions.filter((s: any) => !!s.endedAt).length;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const WINDOW_SIZE = 30;
  let startOffset = 0;
  if (totalClassesPassed >= 20) startOffset = Math.max(0, totalClassesPassed - 15);
  
  const relativeUnlockedIndex = Math.max(0, totalClassesPassed - startOffset);
  const maxPercentage = Math.min(100, (relativeUnlockedIndex / (WINDOW_SIZE - 1)) * 100);

  const currentDraw = (scrollProgress || 0) * 2.0;
  const fillPercentage = Math.min(currentDraw, maxPercentage || 0);

  if (!batches || batches.length === 0) return <div className="pt-36 text-center text-emerald-200/50">No Batches Assigned</div>;

  return (
    <div className="relative z-10 pt-36 pb-20">
      <div className="max-w-3xl mx-auto px-6 mb-16 text-center">
        <h1 className="text-4xl font-serif font-bold text-white mb-8">Class Journey</h1>
        <div className="relative max-w-md mx-auto mb-10">
          <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-full bg-emerald-900 border-2 border-emerald-500/30 text-white px-6 py-4 rounded-2xl flex items-center justify-between">
            <span className="font-bold">{activeBatch?.name}</span>
            <ChevronDown size={24} className={isDropdownOpen ? 'rotate-180' : ''} />
          </button>
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-emerald-950 border border-emerald-800 rounded-2xl shadow-2xl z-[200]">
               {batches.map((b: any) => (
                  <button key={b._id} onClick={() => { setSelectedBatchId(b._id); setIsDropdownOpen(false); }} className="w-full text-left px-6 py-4 hover:bg-emerald-800 border-b border-white/5 last:border-0">{b.name}</button>
               ))}
            </div>
          )}
        </div>
        <div onClick={() => activeBatch && onJoinSession(activeBatch)} className={`cursor-pointer max-w-md mx-auto p-6 rounded-2xl border-2 transition-all active:scale-95 flex items-center gap-6 ${hasActiveSession ? 'bg-emerald-500/20 border-emerald-400 animate-pulse' : 'bg-amber-500/20 border-amber-400 hover:bg-amber-500/30'}`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${hasActiveSession ? 'bg-emerald-400 text-black' : 'bg-amber-400 text-black'}`}><Play size={20} fill="currentColor" /></div>
          <div className="text-left"><div className="text-xs font-black uppercase tracking-widest">{hasActiveSession ? 'Session Active' : 'Start Next'}</div><div className="text-xl font-bold text-white">{hasActiveSession ? 'Re-join Live' : `Start Session ${totalClassesPassed + 1}`}</div></div>
        </div>
      </div>
      <div className="relative max-w-3xl mx-auto px-6 pb-24">
        <div className="absolute top-0 bottom-0 left-[3.5rem] md:left-1/2 w-1.5 -translate-x-1/2 bg-white/10 z-0 overflow-hidden"><div className="w-full bg-emerald-400 transition-all" style={{ height: `${fillPercentage}%` }} /></div>
        <div className="space-y-24 relative">
          {Array.from({ length: WINDOW_SIZE }).map((_, i) => {
            const index = startOffset + i;
            const historicalSession = pastSessions[index];
            const isHistorical = !!historicalSession?.endedAt || index < totalClassesPassed;
            const isActuallyLive = hasActiveSession && historicalSession?.sessionId === activeSessionId;
            const isCurrent = isActuallyLive || (!hasActiveSession && index === totalClassesPassed);
            const isLocked = index > totalClassesPassed && !isCurrent;

            return (
              <div key={index} className="flex md:justify-center items-center relative group">
                <div onClick={() => isActuallyLive ? onJoinSession(activeBatch) : (isCurrent ? onJoinSession(activeBatch) : (historicalSession?.sessionId && setSelectedSessionId(historicalSession.sessionId)))} className={`absolute left-[2rem] md:left-1/2 -translate-x-1/2 w-14 h-14 rounded-full border-4 border-[#022c22] z-20 flex items-center justify-center shadow-xl transition-all cursor-pointer ${isLocked ? 'bg-gray-800 text-gray-500' : isCurrent ? 'bg-amber-400 text-amber-900 scale-125 shadow-lg' : 'bg-emerald-400'}`}>
                  {isLocked ? <Lock size={20} /> : <Play size={20} fill="currentColor" />}
                </div>
                <div onClick={() => isActuallyLive ? onJoinSession(activeBatch) : (isCurrent ? onJoinSession(activeBatch) : (historicalSession?.sessionId && setSelectedSessionId(historicalSession.sessionId)))} className={`w-full md:w-[45%] cursor-pointer ${index % 2 === 0 ? 'md:mr-auto ml-20 md:pr-16 text-left md:text-right' : 'md:ml-auto ml-20 md:pl-16 text-left'}`}>
                  <div className={`bg-white/5 p-6 rounded-3xl border ${isCurrent ? 'border-amber-400/50 bg-amber-400/5' : ''}`}><h3 className="text-2xl font-bold text-white">Live Session {index + 1}</h3><div className="text-[10px] font-black uppercase tracking-widest text-emerald-400">{isActuallyLive ? 'Live Now' : (isHistorical ? 'Completed' : 'Upcoming')}</div></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {selectedSessionId && activeBatch && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-[#022c22] border border-emerald-500/30 rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
             <div className="flex justify-between items-center px-8 py-4 bg-emerald-950 border-b border-emerald-800">
                <button onClick={() => setSelectedSessionId(null)} className="bg-emerald-800 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2"><ChevronLeft size={16} /> Back</button>
             </div>
             <div className="flex-1 overflow-y-auto h-[600px]"><SessionLeaderboard batchId={activeBatch._id} sessionId={selectedSessionId} onClose={() => setSelectedSessionId(null)} /></div>
           </div>
         </div>
      )}
    </div>
  );
};

const ScholarDashboardView = ({ batches, onJoinSession, setShowScholarManage }: any) => {
  return (
    <div className="relative z-10 pt-32 pb-20 max-w-6xl mx-auto px-6 space-y-8 text-center md:text-left">
      <div className="bg-[#052e16]/80 backdrop-blur-md p-8 rounded-[2rem] border border-emerald-800/50 flex flex-col md:flex-row items-center justify-between">
        <h1 className="text-4xl font-serif font-bold text-white">Scholar Dashboard</h1>
        <div className="bg-white/10 text-white px-6 py-3 rounded-2xl border border-white/20 font-bold flex items-center gap-3"><BookOpen size={20} className="text-emerald-300" /><div>{batches?.length || 0} <span className="text-sm font-normal text-emerald-200">Batches</span></div></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {batches?.map((batch: any) => (
          <div key={batch._id} className="bg-emerald-950/40 p-6 rounded-[2rem] border border-emerald-800/50 flex flex-col shadow-lg">
            <h3 className="font-bold text-2xl text-white mb-4">{batch.name}</h3>
            <div className="mt-auto flex flex-col gap-3">
              <button onClick={() => onJoinSession(batch)} className="w-full bg-emerald-500 text-[#022c22] py-3 rounded-xl font-bold flex items-center justify-center gap-2"> <Play size={14} fill="currentColor" /> {batch.activeSessionId ? 'Re-join Session' : 'Start Class'}</button>
              <button onClick={() => setShowScholarManage(batch)} className="w-full bg-indigo-600/40 text-white py-3 rounded-xl font-bold border border-indigo-500/30">Manage Assignments</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ParentsView = ({ activeChild, getToken }: any) => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [juz, setJuz] = useState(1);
  const [completedParts, setCompletedParts] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!activeChild?.id) return;
    const fetch = async () => {
       const token = await getToken();
       const res = await axios.get(`${APPLICATION_API_URL}/api/parent/dashboard/${activeChild.id}`, { headers: { Authorization: `Bearer ${token}` } });
       setDashboardData(res.data);
       if (res.data?.stats?.completed_quran_parts) {
           setCompletedParts(res.data.stats.completed_quran_parts);
       }
    };
    fetch();
  }, [activeChild, getToken]);

  const togglePart = (pJuz: number, pPart: number) => {
      const key = `J${pJuz}P${pPart}`;
      setCompletedParts(prev => 
          prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
      );
  };

  const selectAllCurrentJuz = () => {
      const keys = [...Array(15)].map((_, i) => `J${juz}P${i+1}`);
      setCompletedParts(prev => [...new Set([...prev, ...keys])]);
  };

  const clearCurrentJuz = () => {
      const keys = [...Array(15)].map((_, i) => `J${juz}P${i+1}`);
      setCompletedParts(prev => prev.filter(k => !keys.includes(k)));
  };

  const handleSaveProgress = async () => {
      setIsSaving(true);
      try {
          const token = await getToken();
          await axios.post(`${APPLICATION_API_URL}/api/parent/completion/${activeChild.id}`, {
              parts: completedParts
          }, {
              headers: { Authorization: `Bearer ${token}` }
          });
          setShowSetupModal(false);
          const res = await axios.get(`${APPLICATION_API_URL}/api/parent/dashboard/${activeChild.id}`, { headers: { Authorization: `Bearer ${token}` } });
          setDashboardData(res.data);
      } catch (error) {
          alert("Failed to save progress");
      } finally {
          setIsSaving(false);
      }
  };

  const stats = dashboardData?.stats;
  const completionRate = stats?.completionRate || 0;
  
  const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];
  const topicData = dashboardData?.topicBreakdown?.map((item: any, index: number) => ({
      ...item,
      fill: PIE_COLORS[index % PIE_COLORS.length]
  })) || [];

  const activityData = dashboardData?.weeklyActivity || [];
  
  const localStats = quranTracker.getStats();
  const mergedKhatmPercentage = Math.round(Math.max(localStats.khatmPercentage, completionRate));
  const completionData = [
    { name: 'Completed', value: mergedKhatmPercentage },
    { name: 'Remaining', value: Math.max(0, 100 - mergedKhatmPercentage) },
  ];
  const COMPLETION_COLORS = ['#10b981', '#ffffff15'];
  
  return (
    <div className="pt-32 pb-20 px-4 max-w-6xl mx-auto z-10 relative">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white">{activeChild?.name || 'Child'}'s Journey</h1>
        <button onClick={() => setShowSetupModal(true)} className="bg-white/10 text-white px-8 py-4 rounded-2xl border border-white/20 font-bold flex items-center gap-3 shadow-xl"> <Settings size={20} /> Setup Progress</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
         <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 text-center"><div className="text-emerald-400 text-xs font-black uppercase mb-4">Total XP</div><div className="text-5xl font-black text-white">{stats?.currentXP || 0}</div></div>
         <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 text-center"><div className="text-blue-400 text-xs font-black uppercase mb-4">Accuracy</div><div className="text-5xl font-black text-white">{stats?.averageAccuracy || 0}%</div></div>
         <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 text-center"><div className="text-amber-500 text-xs font-black uppercase mb-4">Attendance</div><div className="text-5xl font-black text-white">{stats?.attendanceRate || 0}%</div></div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Quran Completion Pie Chart */}
        <div className="bg-white/5 p-8 rounded-[3rem] shadow-sm border border-white/10 flex flex-col items-center">
           <h3 className="font-bold text-white text-lg mb-2">Quran Progress</h3>
           <p className="text-emerald-200/60 text-xs text-center mb-6">Overall Khatm Completion</p>
           <div className="h-48 w-full relative">
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                 <div className="text-3xl font-black text-emerald-400">{mergedKhatmPercentage}%</div>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={completionData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                       {completionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COMPLETION_COLORS[index]} />
                       ))}
                    </Pie>
                 </PieChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* Learning Focus Pie Chart */}
        <div className="bg-white/5 p-8 rounded-[3rem] shadow-sm border border-white/10 flex flex-col items-center">
          <h3 className="font-bold text-white text-lg mb-2">Learning Focus</h3>
          <p className="text-emerald-200/60 text-xs text-center mb-6">Distribution of time spent</p>
          {topicData.length > 0 ? (
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={topicData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {topicData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#022c22', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '1rem', color: 'white' }} itemStyle={{ color: 'white' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 w-full flex items-center justify-center text-emerald-200/40 text-sm">No data yet</div>
          )}
        </div>

        {/* Weekly Activity Bar Chart */}
        <div className="bg-white/5 p-8 rounded-[3rem] shadow-sm border border-white/10 flex flex-col items-center">
          <div className="flex justify-between items-center w-full mb-2">
             <h3 className="font-bold text-white text-lg">Weekly Activity</h3>
             <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/30 rounded-lg py-1 px-3 text-emerald-300 font-bold">Last 7 Days</span>
          </div>
          <p className="text-emerald-200/60 text-xs text-center mb-6 w-full text-left">Minutes spent per day</p>
          <div className="h-48 w-full">
            {activityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a7f3d0', fontWeight: 'bold' }} />
                  <RechartsTooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={{ backgroundColor: '#022c22', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '1rem', color: 'white' }} />
                  <Bar dataKey="min" fill="#10b981" radius={[6, 6, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex items-center justify-center text-emerald-200/40 text-sm">No activity</div>
            )}
          </div>
        </div>
      </div>
      {showSetupModal && (
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
             <div className="bg-[#022c22] p-8 rounded-[3rem] border border-emerald-500/30 w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl relative">
                <button onClick={() => setShowSetupModal(false)} className="absolute top-8 right-8 text-white/50 hover:text-white font-bold flex items-center gap-2">✕ Close</button>
                <div className="text-center mb-8 mt-4">
                    <h3 className="text-3xl font-serif font-bold text-white mb-2">Setup Quran Progress</h3>
                    <p className="text-emerald-200/60 flex items-center justify-center gap-2">
                        <BookOpen size={16} /> Mark the parts your child has already completed.
                    </p>
                </div>
                
                <div className="space-y-8">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-emerald-300 uppercase tracking-widest ml-1">Select Juz</label>
                        <div className="flex flex-wrap gap-2">
                            {[...Array(30)].map((_, i) => (
                                <button
                                    key={i+1}
                                    onClick={() => setJuz(i+1)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${juz === i+1 ? 'bg-emerald-500 border-emerald-400 text-[#022c22] shadow-lg' : 'bg-black/40 border-emerald-500/10 text-emerald-100 hover:border-emerald-500/30'}`}
                                >
                                    Juz {i+1}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 bg-black/20 p-6 rounded-[2rem] border border-white/5">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-emerald-300 uppercase tracking-widest ml-1">Select Subparts (1-15)</label>
                            <div className="flex gap-2">
                                <button onClick={selectAllCurrentJuz} className="text-[10px] bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-lg hover:bg-emerald-500/30 transition-all font-bold uppercase tracking-tighter">Select All</button>
                                <button onClick={clearCurrentJuz} className="text-[10px] bg-red-500/20 text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-all font-bold uppercase tracking-tighter">Clear</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {[...Array(15)].map((_, i) => {
                                const partNum = i + 1;
                                const metadata = QURAN_METADATA[juz]?.find((m: any) => m.part === partNum);
                                const key = `J${juz}P${partNum}`;
                                const isSelected = completedParts.includes(key);
                                return (
                                    <button 
                                        key={partNum} 
                                        onClick={() => togglePart(juz, partNum)}
                                        className={`p-3 rounded-2xl border transition-all text-left flex flex-col gap-1 relative overflow-hidden group ${isSelected ? 'bg-emerald-500 border-emerald-400 text-[#022c22] shadow-lg scale-[1.02]' : 'bg-black/40 border-white/5 text-emerald-100 hover:border-emerald-500/30'}`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-[10px] font-black ${isSelected ? 'text-[#022c22]/70' : 'text-emerald-500/70'}`}>PART {partNum}</span>
                                            {isSelected && <div className="bg-[#022c22] text-emerald-400 rounded-full p-0.5"><CheckCircle size={10} /></div>}
                                        </div>
                                        <div className={`text-xs font-bold leading-tight line-clamp-2 ${isSelected ? 'text-[#022c22]' : 'text-white'}`}>
                                            {metadata?.label || `Part ${partNum}`}
                                        </div>
                                        {!isSelected && <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-all" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    
                    <div className="mt-8 flex flex-col sm:flex-row gap-4">
                        <button onClick={() => setShowSetupModal(false)} className="flex-1 bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-2xl font-bold transition-all">Cancel</button>
                        <button onClick={handleSaveProgress} disabled={isSaving} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-[#022c22] px-8 py-4 rounded-2xl font-bold transition-all flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 blur-[0px]">
                            {isSaving ? <Loader2 size={24} className="animate-spin" /> : 'Save Progress'}
                        </button>
                    </div>
                </div>
             </div>
          </div>
      )}
    </div>
  );
};

const SuccessOverlay = ({ onSignUp }: { onSignUp: () => void }) => (
  <div className="fixed inset-0 z-[2000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-8 animate-in fade-in duration-1000">
    <div className="bg-[#052e16] border border-emerald-500/30 rounded-[4rem] p-16 max-w-xl w-full text-center shadow-3xl animate-in zoom-in-95 relative overflow-hidden">
       <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500" />
       <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-10"><CheckCircle size={40} /></div>
       <h2 className="text-4xl font-serif font-bold text-white mb-4">Alhamdulillah! Access Secured.</h2>
       <p className="text-emerald-200/60 text-lg mb-12 leading-relaxed">Payment successful. <br/><span className="text-white font-black">Now create your account</span> to enter the first batch.</p>
       <button onClick={onSignUp} className="w-full bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black py-6 rounded-3xl flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl group"><span className="text-xl">COMPLETE REGISTRATION</span><ChevronRight size={24} className="group-hover:translate-x-2 transition-all" /></button>
    </div>
  </div>
);
