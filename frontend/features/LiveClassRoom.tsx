import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Users,
  Clock,
  ShieldCheck,
  ArrowRight,
  Loader2,
  LogOut,
  BookOpen,
  LayoutDashboard,
  WifiOff,
  Wifi,
  Star, Moon, Cloud, Sprout, Leaf, Sun, Mic, Trophy, CheckCircle, Lock,
  Maximize2, Minimize2, Video, VideoOff, XCircle
} from 'lucide-react';
import { useChildContext } from '../contexts/ChildContext';
import QuranPage from './QuranPage';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { TarbiyahLobby, MovingBackground } from './TarbiyahLobby';
import ScholarQuranManager from './ScholarQuranManager';
import AgoraVideoPane from './AgoraVideoPane';
import { loadRazorpayScript } from '../utils/razorpay';

const POSITION_THROTTLE_MS = 500;
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Types
interface LiveSession {
  _id: string;
  parentId: string;
  childId: string;
  scholarId: string;
  currentSurah: number;
  currentAyah: number;
  status: 'active' | 'ended' | 'waiting';
  parentName?: string;
  studentName?: string;
  batchId?: string;
  agoraToken?: string;
  agoraAppId?: string;
  channel?: string;
}

interface ScholarStatus {
  online: boolean;
  scholarName: string;
  activeSessions?: number;
}

interface PromptAnswer {
  childId: string;
  answer: 'yes' | 'no';
}

interface BatchState {
  activeChildId: string | null;
  activeSessionId: string | null;
  status: string;
  currentPromptAnswers?: PromptAnswer[];
  promptEvaluated?: boolean;
  pastSessions?: { sessionId: string; startedAt: string; endedAt: string }[];
}

const LiveClassRoom: React.FC = () => {
  const { activeChild, refreshChildren, triggerRewardAnimation } = useChildContext();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { t } = useTranslation();

  const [userRole, setUserRole] = useState<'parent' | 'scholar' | 'loading'>('loading');
  const [tarbiyahIsAdmin, setTarbiyahIsAdmin] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeDrawer, setActiveDrawer] = useState<'students' | 'leaderboard' | 'none'>('none');
  const [isLoading, setIsLoading] = useState(false);
  
  const [activeSessions, setActiveSessions] = useState<LiveSession[]>([]);
  const [currentSession, setCurrentSession] = useState<LiveSession | null>(null);
  const [batchState, setBatchState] = useState<BatchState | null>(null);
  
  const [hasStartedReciting, setHasStartedReciting] = useState(false);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [promptDecision, setPromptDecision] = useState<'yes' | 'no' | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[] | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean | string>(false);
  const [attendedSessionIds, setAttendedSessionIds] = useState<string[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [confirmEndClass, setConfirmEndClass] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [currentSessionScore, setCurrentSessionScore] = useState<number>(0);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  
  const lastSeenScoreRef = useRef<number | null>(null);

  // Responsive Detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine Role & Check Access
  useEffect(() => {
    if (user === undefined) return; // Still loading from Clerk

    if (user === null) {
      // Guest User
      setUserRole('parent'); // Treats guests as parents for UI structure
      return;
    }

    const role = user?.publicMetadata?.role;
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
    const isScholar = role === 'scholar' || email === "scholar1.imam@gmail.com";
    
    if (isScholar) {
      setUserRole('scholar');
    } else {
      setUserRole('parent');
      checkAccess();
    }
    setTarbiyahIsAdmin(role === 'admin');
  }, [user]);

  const checkAccess = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      await axios.get(`${API_BASE}/api/live/access/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {}
  };

  // 📡 SCHOLAR SYNC: Fetch Batches & Participants
  const [scholarBatches, setScholarBatches] = useState<any[]>([]);
  useEffect(() => {
    if (userRole !== 'scholar') return;
    const fetchBatches = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(`${API_BASE}/api/live/scholar/batches`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setScholarBatches(Array.isArray(res.data.batches) ? res.data.batches : []);
      } catch (err) {}
    };
    fetchBatches();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchBatches();
    }, 10000);
    return () => clearInterval(interval);
  }, [userRole, getToken]);

  // 📡 BATCH STATE POLLING
  useEffect(() => {
    if (!currentSession?.batchId) return;
    
    const fetchBatchState = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(`${API_BASE}/api/live/batch/${currentSession.batchId}/state?childId=${currentSession.childId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = res.data;
        setBatchState({
           activeChildId: data.activeChildId,
           activeSessionId: data.activeSessionId,
           status: data.status,
           currentPromptAnswers: data.currentPromptAnswers || [],
           promptEvaluated: data.promptEvaluated || false,
           pastSessions: data.pastSessions || []
        });

        // XP Animation Handling for Students
        if (userRole === 'parent') {
           const newScore = data.currentScore || 0;
           if (lastSeenScoreRef.current !== null && newScore > lastSeenScoreRef.current) {
              triggerRewardAnimation(newScore - lastSeenScoreRef.current);
           }
           lastSeenScoreRef.current = newScore;
           setCurrentSessionScore(newScore);
        }

        // Active Session Sync
        if (data.activeParticipants && userRole === 'scholar') {
            setActiveSessions(data.activeParticipants.filter((p: any) => p.isActive).map((p: any) => ({
              _id: `${p.childId}-${currentSession.batchId}`,
              childId: p.childId,
              studentName: p.childName || 'Student',
              batchId: currentSession.batchId,
              currentSurah: p.currentSurah,
              currentAyah: p.currentAyah,
              status: 'active'
            } as any)));
        }

        // Auto-Results Trigger
        if (data.status === 'ended' && !showLeaderboard) {
            setShowLeaderboard(data.activeSessionId || true);
        }
      } catch (err) {}
    };

    fetchBatchState();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchBatchState();
    }, 2000);
    return () => clearInterval(interval);
  }, [currentSession?.batchId, userRole]);

  // 📡 LEADERBOARD POLLING
  useEffect(() => {
    if (!currentSession?.batchId) return;
    const fetchLeaderboard = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(`${API_BASE}/api/live/batch/${currentSession.batchId}/leaderboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLeaderboard(res.data.leaderboard);
      } catch (e) {}
    };
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 5000);
    return () => clearInterval(interval);
  }, [currentSession?.batchId]);

  // -------------------------------------------------------------------
  // 🕹️ ACTIONS
  // -------------------------------------------------------------------

  const handleScholarJoinBatch = async (batchId: string) => {
    try {
      const token = await getToken();
      const res = await axios.post(`${API_BASE}/api/live/batch/${batchId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentSession(res.data.session);
    } catch (err) { alert("Failed to join class"); }
  };

  const handleSetTurn = async (childId: string, batchId: string) => {
    try {
      const token = await getToken();
      await axios.post(`${API_BASE}/api/live/batch/${batchId}/set-turn`, { childId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {}
  };

  const handleScoreRecitation = async (childId: string, batchId: string, score: number) => {
    try {
      const token = await getToken();
      await axios.post(`${API_BASE}/api/live/batch/${batchId}/score`, { 
        childId, 
        accuracyScore: score 
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) {}
  };

  const handleEvaluatePrompt = async (decision: 'yes' | 'no') => {
    if (!currentSession?.batchId) return;
    try {
      const token = await getToken();
      await axios.post(`${API_BASE}/api/live/batch/${currentSession.batchId}/evaluate-prompt`, { 
        decision 
      }, { headers: { Authorization: `Bearer ${token}` } });
      setPromptDecision(null);
    } catch (err) {}
  };

  const handleSubmitPrompt = async (answer: 'yes' | 'no') => {
    if (!currentSession?.batchId || !activeChild) return;
    try {
      const token = await getToken();
      await axios.post(`${API_BASE}/api/live/batch/${currentSession.batchId}/submit-prompt`, { 
        childId: activeChild.id, answer 
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (e) {}
  };

  const handleEndClass = async (batchId: string) => {
    try {
      const token = await getToken();
      await axios.post(`${API_BASE}/api/live/batch/${batchId}/end`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentSession(null);
    } catch (err) {}
  };

  const handleExitSession = () => {
    setCurrentSession(null);
    setBatchState(null);
  };

  const emitPosition = async (surah: number, ayah: number) => {
    if (!currentSession?.batchId || userRole === 'scholar') return;
    try {
      const token = await getToken();
      await axios.patch(`${API_BASE}/api/live/batch/${currentSession.batchId}/position`, {
        childId: currentSession.childId, surah, ayah
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (e) {}
  };

  const handleAyahClick = async (surah: number, ayah: number) => {
    if (!currentSession || userRole === 'scholar') return;
    setCurrentSession(prev => prev ? { ...prev, currentSurah: surah, currentAyah: ayah } : null);
    emitPosition(surah, ayah);
  };

  // -------------------------------------------------------------------
  // 🎭 RENDER STAGES
  // -------------------------------------------------------------------

  const renderScholarStage = () => {
    if (!currentSession) return null;
    return (
      <div className="flex flex-col h-full bg-[#040404]">
         {/* STUDENT SPEED DOCK */}
         <div className="flex-none p-4 pb-0 z-20">
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 items-center">
              {activeSessions.map(session => (
                <div 
                  key={session._id} 
                  onClick={() => handleSetTurn(session.childId, session.batchId!)}
                  className={`p-1 rounded-3xl transition-all duration-500 cursor-pointer shrink-0 ${batchState?.activeChildId === session.childId ? 'bg-emerald-500 scale-105 shadow-[0_0_30px_rgba(16,185,129,0.4)]' : 'bg-white/5 opacity-40 hover:opacity-100 hover:scale-105'}`}
                >
                   <div className="bg-[#111] rounded-[1.4rem] px-6 py-4 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-colors ${batchState?.activeChildId === session.childId ? 'bg-emerald-500 text-black shadow-inner' : 'bg-emerald-900/20 text-emerald-500'}`}>
                        {session.studentName?.[0] || 'S'}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${batchState?.activeChildId === session.childId ? 'text-white' : 'text-gray-400'}`}>{session.studentName}</span>
                        {batchState?.activeChildId === session.childId && (
                           <span className="text-[8px] text-red-500 font-bold uppercase animate-pulse">Reciting</span>
                        )}
                      </div>
                   </div>
                </div>
              ))}
            </div>
         </div>

         {/* MAIN STAGE */}
         <div className="flex-1 relative flex flex-col md:flex-row gap-4 p-4 overflow-hidden">
            <div className="flex-1 bg-black rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden relative group">
               <AgoraVideoPane
                 appId={currentSession.agoraAppId || ""}
                 token={currentSession.agoraToken || ""}
                 channel={currentSession.channel || currentSession.batchId || ""}
                 uid={user?.id || 0}
                 role="scholar"
                 layout="grid"
               />
               <div className="absolute top-8 left-8 py-2 px-4 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-2xl flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[9px] text-white font-black uppercase tracking-widest">Active Class • {activeSessions.length} Participants</span>
               </div>
            </div>

            {!isMobile && batchState?.activeChildId && (
               <div className="w-[340px] bg-[#0c0c0c] rounded-[3rem] border border-white/5 p-10 flex flex-col gap-10 shadow-2xl animate-in slide-in-from-right-12 duration-700">
                  <div className="text-center space-y-2">
                     <p className="text-[10px] text-emerald-500/60 font-black uppercase tracking-[0.2em]">Evaluating</p>
                     <h3 className="text-3xl font-black text-white">{activeSessions.find(s => s.childId === batchState.activeChildId)?.studentName}</h3>
                  </div>

                  <div className="space-y-6">
                     <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mb-6 text-center">Class Consensus</p>
                        <div className="flex items-center justify-around gap-4 px-4">
                           <div className="text-center">
                              <span className="text-3xl font-black text-emerald-400">{batchState?.currentPromptAnswers?.filter(a => a.answer === 'yes').length || 0}</span>
                              <p className="text-[9px] text-emerald-500/40 uppercase font-black tracking-tighter mt-1">Perfect</p>
                           </div>
                           <div className="w-px h-10 bg-white/5" />
                           <div className="text-center">
                              <span className="text-3xl font-black text-red-400">{batchState?.currentPromptAnswers?.filter(a => a.answer === 'no').length || 0}</span>
                              <p className="text-[9px] text-red-500/40 uppercase font-black tracking-tighter mt-1">Mistakes</p>
                           </div>
                        </div>
                        
                        {!batchState?.promptEvaluated && (batchState?.currentPromptAnswers?.length || 0) > 0 && (
                           <div className="grid grid-cols-2 gap-2 mt-8">
                              <button onClick={() => handleEvaluatePrompt('yes')} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 py-3 rounded-xl font-black text-[9px] uppercase border border-emerald-500/20 transition-all">Confirm Perfect</button>
                              <button onClick={() => handleEvaluatePrompt('no')} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 py-3 rounded-xl font-black text-[9px] uppercase border border-red-500/20 transition-all">Confirm Mistake</button>
                           </div>
                        )}
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleScoreRecitation(batchState.activeChildId!, currentSession.batchId!, 3)} className="bg-emerald-500 hover:bg-emerald-400 text-black py-4 rounded-2xl font-black text-[10px] uppercase transition-all shadow-lg shadow-emerald-500/10 active:scale-95">Award +10 XP</button>
                        <button onClick={() => handleScoreRecitation(batchState.activeChildId!, currentSession.batchId!, 2)} className="bg-amber-500 hover:bg-amber-400 text-black py-4 rounded-2xl font-black text-[10px] uppercase transition-all shadow-lg shadow-amber-500/10 active:scale-95">Award +7 XP</button>
                        <button onClick={() => setShowAssignModal(true)} className="col-span-2 bg-indigo-500 hover:bg-indigo-400 text-white py-4 rounded-2xl font-black text-[10px] uppercase mt-4 flex items-center justify-center gap-2 transition-all active:scale-95"><BookOpen size={14}/> Setup Lesson</button>
                     </div>
                  </div>

                  <button onClick={() => setConfirmEndClass(currentSession.batchId!)} className="mt-auto w-full py-4 text-red-500/60 hover:text-red-400 font-black text-[10px] uppercase tracking-widest transition-colors">Terminate Classroom</button>
               </div>
            )}
         </div>

         {isMobile && batchState?.activeChildId && (
            <div className="fixed bottom-0 left-0 right-0 p-6 bg-black/80 backdrop-blur-3xl border-t border-white/5 rounded-t-[3rem] z-30 flex items-center gap-4 animate-in slide-in-from-bottom duration-500">
                <button onClick={() => handleScoreRecitation(batchState.activeChildId!, currentSession.batchId!, 3)} className="bg-emerald-500 text-black px-8 py-5 rounded-3xl font-black text-[10px] uppercase grow shadow-2xl">Award XP</button>
                <button onClick={() => setShowAssignModal(true)} className="bg-white/10 text-white px-8 py-5 rounded-3xl font-black text-[10px] uppercase grow border border-white/10">Lesson</button>
            </div>
         )}
      </div>
    );
  };

  const renderRecitationStage = () => {
    if (!currentSession) return null;
    return (
      <div className="flex flex-col h-full bg-[#0c0c0c] relative">
         <div className="p-8 pb-2 flex items-center justify-between z-20">
            <div className="flex items-center gap-5">
               <div className="w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Mic size={24} />
               </div>
               <div>
                  <h3 className="text-white font-black uppercase text-sm tracking-widest mb-0.5">Live Recitation</h3>
                  <p className="text-emerald-500/60 text-[10px] font-bold uppercase tracking-widest">Scholar is listening carefully</p>
               </div>
            </div>
            <div className="bg-emerald-950/40 px-6 py-3 rounded-2xl border border-emerald-500/20 flex flex-col items-center">
               <span className="text-[9px] text-emerald-500/40 uppercase font-black tracking-widest leading-none">Class Points</span>
               <span className="text-2xl font-black text-emerald-400 mt-1">{currentSessionScore}</span>
            </div>
         </div>

         <div className="flex-1 relative p-6 mb-4">
            <div className="w-full h-full bg-[#fdfaf3] rounded-[3.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-black/5 relative">
               <QuranPage
                 onBack={handleExitSession}
                 sessionCurrentSurah={currentSession.currentSurah}
                 sessionCurrentAyah={currentSession.currentAyah}
                 onAyahClick={handleAyahClick}
                 onPositionChange={emitPosition}
                 readOnly={false}
               />
               <div className="absolute top-10 right-10 w-48 md:w-72 aspect-video z-30 shadow-3xl rounded-3xl overflow-hidden group border border-amber-900/20 transition-transform duration-500 hover:scale-105">
                  <AgoraVideoPane
                    appId={currentSession.agoraAppId || ""}
                    token={currentSession.agoraToken || ""}
                    channel={currentSession.channel || currentSession.batchId || ""}
                    uid={user?.id || 0}
                    role="student"
                    layout="inset"
                  />
                  <div className="absolute inset-x-0 bottom-0 py-2 bg-gradient-to-t from-black/80 to-transparent flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="text-[10px] text-white font-black uppercase tracking-widest">Scholar Monitor</span>
                  </div>
               </div>
            </div>
         </div>
      </div>
    );
  };

  const renderObservationStage = () => {
    if (!currentSession) return null;
    return (
      <div className="flex flex-col h-full bg-[#040404]">
         <div className="p-8 pb-4 flex items-center justify-between z-20">
            <div className="flex flex-col">
               <h3 className="text-white font-black uppercase text-sm tracking-widest mb-1 leading-none">Observer Mode</h3>
               <p className="text-emerald-500/50 text-[10px] font-bold uppercase tracking-widest">A classmate is currently reciting</p>
            </div>
            {leaderboard && (
               <button onClick={() => setActiveDrawer('leaderboard')} className="flex items-center gap-4 px-6 py-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl hover:bg-amber-500/20 transition-all group">
                  <Trophy size={18} className="text-amber-500 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] text-amber-500 font-black uppercase tracking-widest">Leaderboard</span>
               </button>
            )}
         </div>

         <div className="flex-1 p-6 flex flex-col md:flex-row gap-6 overflow-hidden mb-12 md:mb-0">
            <div className="flex-[3] bg-black rounded-[3.5rem] overflow-hidden border border-white/5 shadow-2xl relative">
               <AgoraVideoPane
                 appId={currentSession.agoraAppId || ""}
                 token={currentSession.agoraToken || ""}
                 channel={currentSession.channel || currentSession.batchId || ""}
                 uid={user?.id || 0}
                 role="student"
                 layout="spotlight"
               />
               <div className="absolute top-10 left-10 py-2 px-5 bg-emerald-500/10 backdrop-blur-3xl border border-emerald-500/30 rounded-full flex items-center gap-3 animate-pulse">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Scholar Main Stream</span>
               </div>
            </div>

            {!isMobile && (
               <div className="flex-1 bg-white/[0.02] border border-white/5 rounded-[3.5rem] p-10 flex flex-col shadow-inner">
                  <h4 className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mb-10 text-center">Class Activity</h4>
                  <div className="space-y-4 overflow-y-auto no-scrollbar">
                     {leaderboard?.slice(0, 6).map((l, idx) => (
                        <div key={l.childId} className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5 group hover:border-emerald-500/30 transition-all">
                           <div className="flex items-center gap-4 text-xs font-bold text-white/70">
                              <span className="font-black text-emerald-500 w-4">#{idx+1}</span>
                              <span className="truncate max-w-[100px]">{l.name}</span>
                           </div>
                           <span className="text-xs font-black text-amber-400 group-hover:scale-110 transition-transform">{l.total} XP</span>
                        </div>
                     ))}
                  </div>
               </div>
            )}
         </div>

         <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-md px-8 z-50">
            {batchState?.activeChildId && batchState.activeChildId !== currentSession.childId && (
               (() => {
                 const myAnswer = batchState?.currentPromptAnswers?.find(a => a.childId === currentSession.childId);
                 if (batchState?.promptEvaluated || myAnswer) {
                    return (
                        <div className="bg-[#111]/90 backdrop-blur-3xl p-8 rounded-[3rem] border border-emerald-500/20 shadow-3xl text-center flex flex-col items-center gap-4 animate-in slide-in-from-bottom-12 duration-700">
                          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                             <CheckCircle className="text-emerald-500" size={36} />
                          </div>
                          <div>
                            <h4 className="text-white font-black text-base uppercase tracking-tight">Active Engagement!</h4>
                            <p className="text-[10px] text-white/30 font-black uppercase tracking-[0.1em] mt-1">Class participation XP added</p>
                          </div>
                       </div>
                    );
                 }
                 return (
                    <div className="bg-[#111]/90 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/10 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-12 duration-700">
                       <h4 className="text-center text-white/50 font-black uppercase text-[10px] tracking-[0.3em] mb-10">Listen and Evaluate</h4>
                       <div className="flex gap-4">
                          <button onClick={() => handleSubmitPrompt('yes')} className="flex-1 bg-emerald-500 hover:bg-emerald-400 p-6 rounded-3xl flex flex-col items-center gap-3 transition-all active:scale-90 shadow-2xl shadow-emerald-500/10 group">
                             <CheckCircle size={32} className="text-black transition-transform group-hover:scale-110" />
                             <span className="text-[10px] font-black text-black">PERFECT</span>
                          </button>
                          <button onClick={() => handleSubmitPrompt('no')} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 p-6 rounded-3xl flex flex-col items-center gap-3 transition-all active:scale-90 group">
                             <XCircle size={28} className="text-red-500 transition-transform group-hover:scale-110" />
                             <span className="text-[10px] font-black text-white/80">MISTAKE</span>
                          </button>
                       </div>
                    </div>
                 );
               })()
            )}
         </div>
      </div>
    );
  };

  const renderMainStage = () => {
    if (!currentSession) return null;
    const isMyTurn = userRole === 'parent' && batchState?.activeChildId === currentSession.childId;
    if (userRole === 'scholar') return renderScholarStage();
    if (isMyTurn) return renderRecitationStage();
    return renderObservationStage();
  };

  // -------------------------------------------------------------------
  // 🏁 MAIN RENDER
  // -------------------------------------------------------------------



  if (currentSession) {
    return (
      <div className="fixed inset-0 z-[1000] bg-[#020202] flex flex-col font-sans selection:bg-emerald-500/20 overflow-hidden text-white">
        {/* ULTRA-GLASS HEADER */}
        <div className="flex-none h-16 bg-black/40 backdrop-blur-3xl border-b border-white/5 px-8 flex items-center justify-between z-50">
           <div className="flex items-center gap-8">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <Cloud className="text-emerald-500" size={16} />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] text-white font-black uppercase tracking-widest leading-none">Imam Live</span>
                    <span className="text-[8px] text-emerald-500/60 font-bold uppercase tracking-tighter mt-1">v4.0.0 Stable</span>
                 </div>
              </div>
              <div className="h-5 w-px bg-white/5 hidden md:block" />
              <div className="hidden md:flex items-center gap-4">
                 <div className="flex items-center gap-2">
                    <Wifi size={14} className="text-emerald-500" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Real-time Sync Active</span>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-5">
              <button 
                onClick={handleExitSession}
                className="group flex items-center gap-4 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 px-6 py-2.5 rounded-2xl transition-all active:scale-95"
              >
                <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-[9px] font-black uppercase tracking-widest">Exit Stream</span>
              </button>
           </div>
        </div>

        <div className="flex-1 relative overflow-hidden">
            {renderMainStage()}
        </div>

        {/* MODALS & DRAWERS */}
        {showAssignModal && currentSession?.batchId && (
          <div className="fixed inset-0 z-[6000] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500">
             <div className="w-full max-w-6xl h-[90vh] bg-[#0a0a0a] border border-white/10 rounded-[4rem] shadow-3xl overflow-hidden relative animate-in zoom-in-95">
                <ScholarQuranManager 
                  batchId={currentSession.batchId} 
                  batchName="Curriculum Management" 
                  onClose={() => setShowAssignModal(false)}
                />
             </div>
          </div>
        )}

        {confirmEndClass && (
          <div className="fixed inset-0 z-[7000] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-8">
            <div className="bg-[#0c0c0c] border border-white/10 rounded-[3.5rem] p-16 max-w-md w-full text-center shadow-3xl animate-in zoom-in-95 duration-500">
               <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-10 border border-red-500/20 shadow-inner">
                 <LogOut size={40} />
               </div>
               <h3 className="text-3xl font-black text-white mb-4">Class Termination</h3>
               <p className="text-white/30 text-sm mb-12 uppercase tracking-wide leading-relaxed">Are you sure you want to dismiss the session for all participants?</p>
               <div className="flex gap-4">
                 <button onClick={() => setConfirmEndClass(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black py-5 rounded-3xl transition-all uppercase text-[10px] tracking-widest">Stay Live</button>
                 <button onClick={() => { handleEndClass(confirmEndClass); setConfirmEndClass(null); }} className="flex-1 bg-red-500 hover:bg-red-400 text-black font-black py-5 rounded-3xl shadow-2xl shadow-red-500/30 transition-all uppercase text-[10px] tracking-widest">End Session</button>
               </div>
             </div>
          </div>
        )}

        {activeDrawer === 'leaderboard' && (
           <div className="fixed inset-0 z-[5000] bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setActiveDrawer('none')}>
              <div 
                className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-[#0c0c0c] border-t border-white/10 rounded-t-[4rem] p-12 overflow-hidden animate-in slide-in-from-bottom duration-700 shadow-3xl flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                 <div className="w-16 h-2 bg-white/10 rounded-full mx-auto mb-12 shrink-0" />
                 <div className="flex items-center justify-between mb-12 shrink-0">
                    <h2 className="text-3xl font-black text-white flex items-center gap-5">
                       <Trophy className="text-amber-500" size={32} />
                       Class Leaderboard
                    </h2>
                    <button onClick={() => setActiveDrawer('none')} className="text-white/20 hover:text-white transition-colors">
                       <XCircle size={40} />
                    </button>
                 </div>
                 <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-12">
                    {leaderboard?.map((l, idx) => (
                       <div key={idx} className="flex items-center justify-between p-8 bg-white/[0.03] rounded-[2.5rem] border border-white/5 group hover:border-emerald-500/20 transition-all">
                          <div className="flex items-center gap-7">
                             <span className={`text-2xl font-black ${idx < 3 ? 'text-amber-400' : 'text-emerald-500'}`}>0{idx+1}</span>
                             <div className="flex flex-col">
                                <span className="font-black text-white/90 text-lg uppercase tracking-tight">{l.name}</span>
                                <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Session Active</span>
                             </div>
                          </div>
                          <div className="bg-amber-400 text-black px-6 py-2.5 rounded-2xl font-black text-base shadow-xl shadow-amber-400/10">
                             {l.total} XP
                          </div>
                       </div>
                    ))}
                    {(!leaderboard || leaderboard.length === 0) && (
                       <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-[3rem]">
                          <Loader2 className="animate-spin text-emerald-500/40 mx-auto mb-4" size={40} />
                          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Synching Participant Metadata</p>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        )}
      </div>
    );
  }

  return (
    <TarbiyahLobby 
      getToken={getToken} 
      onJoinSession={setCurrentSession} 
      userRole={userRole}
      scholarBatches={scholarBatches}
      onScholarJoinSession={handleScholarJoinBatch}
      attendedSessionIds={attendedSessionIds}
      attendanceHistory={attendanceHistory}
      isAdmin={tarbiyahIsAdmin}
      selectedBatchId={selectedBatchId}
      setSelectedBatchId={setSelectedBatchId}
    />
  );
};

export default LiveClassRoom;
