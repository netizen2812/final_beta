import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { getNumericUid } from '../utils/tarbiyahUtils';
import { QaidaViewer } from './QaidaViewer';

const POSITION_THROTTLE_MS = 500;
import { APPLICATION_API_URL } from '../lib/api';
import { supabase } from '../lib/supabase';

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

interface ActiveParticipant {
  childId: string;
  childName?: string;
  currentSurah?: number;
  currentAyah?: number;
  isActive: boolean;
  lastSeen?: string;
}

interface BatchState {
  activeChildId: string | null;
  activeSessionId: string | null;
  status: string;
  currentPromptAnswers?: PromptAnswer[];
  promptEvaluated?: boolean;
  activeParticipants?: ActiveParticipant[];
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
  const [showQaidaViewer, setShowQaidaViewer] = useState(false);
  
  const lastSeenScoreRef = useRef<number | null>(null);
  const lastSyncTsRef = useRef<number>(0);
  const syncChannelRef = useRef<any>(null);
  // Stable ref for activeChildId to avoid Supabase channel re-subscription stale closure bug
  const activeChildIdRef = useRef<string | null>(null);
  const activeStudentSurahRef = useRef<number | undefined>(undefined);
  const activeStudentAyahRef = useRef<number | undefined>(undefined);
  // Track the session the student explicitly joined — never show leaderboard for this session while in it
  const joinedSessionIdRef = useRef<string | null>(null);
  // Throttle ref for emitPosition — prevents API spam on rapid ayah navigation
  const emitThrottleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emitPendingRef = useRef<{ surah: number; ayah: number } | null>(null);

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
      await axios.get(`${APPLICATION_API_URL}/api/live/access/status`, {
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
        const res = await axios.get(`${APPLICATION_API_URL}/api/live/scholar/batches`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setScholarBatches(Array.isArray(res.data.batches) ? res.data.batches : []);
      } catch (err) {}
    };
    fetchBatches();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchBatches();
    }, 15000);
    return () => clearInterval(interval);
  }, [userRole, getToken]);

  // 📡 BATCH STATE POLLING
  useEffect(() => {
    if (!currentSession?.batchId) return;
    
    const fetchBatchState = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(`${APPLICATION_API_URL}/api/live/batch/${currentSession.batchId}/state?childId=${currentSession.childId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = res.data;
        setBatchState(prev => ({
           // Preserve activeParticipants from Supabase real-time updates (higher precision)
           // Only overwrite with poll data if Supabase hasn't already provided a fresher update
           activeParticipants: data.activeParticipants || prev?.activeParticipants || [],
           activeChildId: data.activeChildId,
           activeSessionId: data.activeSessionId,
           status: data.status,
           currentPromptAnswers: data.currentPromptAnswers || [],
           promptEvaluated: data.promptEvaluated || false,
           pastSessions: data.pastSessions || []
        }));

        // XP Animation Handling for Students
        if (userRole === 'parent') {
           const newScore = data.currentScore || 0;
           if (lastSeenScoreRef.current === null) {
              lastSeenScoreRef.current = newScore;
           } else if (newScore > lastSeenScoreRef.current) {
              triggerRewardAnimation(newScore - lastSeenScoreRef.current);
              lastSeenScoreRef.current = newScore;
           }
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
        // Keep the ref in sync with data so the Supabase handler always has the latest value
        activeChildIdRef.current = data.activeChildId || null;

        // Auto-Results Trigger — only show leaderboard when the session has genuinely ended
        // NEVER trigger if the student just joined or rejoined this session (joinedSessionIdRef)
        if (data.status === 'ended' && userRole === 'parent' && data.activeSessionId) {
            const alreadyShown = showLeaderboard === data.activeSessionId;
            const isSessionWeJoined = joinedSessionIdRef.current === data.activeSessionId;
            if (!alreadyShown && !isSessionWeJoined) {
                setShowLeaderboard(data.activeSessionId);
                setActiveDrawer('leaderboard');
            }
        }

        // 🔄 Sync active student's current position to scholar/observer currentSession
        if (data.activeParticipants && data.activeChildId) {
          const activeStudent = data.activeParticipants.find((p: any) => p.childId === data.activeChildId);
          if (activeStudent?.currentSurah && activeStudent?.currentAyah) {
            setCurrentSession(prev => prev ? {
              ...prev,
              currentSurah: activeStudent.currentSurah,
              currentAyah: activeStudent.currentAyah
            } : null);
          }
        }
      } catch (err) {}
    };

    fetchBatchState();
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchBatchState();
    }, 15000); // 15s Fallback Heartbeat (Heartbeat decreased from 4s)
    return () => clearInterval(interval);
  }, [currentSession?.batchId, userRole]);

  // 📡 REAL-TIME SYNC (Supabase Broadcast)
  // IMPORTANT: Do NOT include batchState in the dep array — use a stable ref for activeChildId
  // to avoid channel being torn down and rebuilt on every poll cycle.
  useEffect(() => {
    if (!currentSession?.batchId) return;

    const channel = supabase.channel(`class-sync:${currentSession.batchId}`)
      .on('broadcast', { event: 'ayah-change' }, ({ payload }) => {
        // Scholar hears student — use ref to get the current activeChildId without stale closure
        if (userRole === 'scholar' && payload.ts > lastSyncTsRef.current) {
          const currentActiveChildId = activeChildIdRef.current;
          if (payload.childId === currentActiveChildId || !currentActiveChildId) {
            lastSyncTsRef.current = payload.ts;
            // Update batchState.activeParticipants for the scholar's Quran monitoring pane
            setBatchState(prev => {
              if (!prev) return null;
              return {
                ...prev,
                activeParticipants: prev.activeParticipants?.map(p =>
                  p.childId === payload.childId
                  ? { ...p, currentSurah: payload.surah, currentAyah: payload.ayah }
                  : p
                )
              };
            });
            // Also update currentSession so scholar's QuranPage props refresh instantly
            setCurrentSession(prev => prev ? {
              ...prev,
              currentSurah: payload.surah,
              currentAyah: payload.ayah
            } : null);
          }
        }
      })
      // ⚡ Student receives instant turn notification from scholar
      .on('broadcast', { event: 'turn-assigned' }, ({ payload }) => {
        if (userRole === 'parent') {
          // Update activeChildId immediately — no need to wait for 15s poll
          setBatchState(prev => prev ? { ...prev, activeChildId: payload.activeChildId } : null);
          activeChildIdRef.current = payload.activeChildId;

          // If it's my turn and position is provided, jump to it instantly
          if (payload.activeChildId === activeChild?.id && payload.surah) {
            setCurrentSession(prev => prev ? {
              ...prev,
              currentSurah: payload.surah,
              currentAyah: payload.ayah
            } : null);
          }
        }
      })
      // 🔄 Smarter Sync: Handle handshake between scholar and student
      .on('broadcast', { event: 'sync-request' }, () => {
        if (userRole === 'scholar') {
          // Scholar is the source of truth — reply with current state
          if (syncChannelRef.current) {
            syncChannelRef.current.send({
              type: 'broadcast',
              event: 'current-state',
              payload: {
                activeChildId: activeChildIdRef.current,
                surah: activeStudentSurahRef.current,
                ayah: activeStudentAyahRef.current,
                ts: Date.now()
              }
            });
          }
        }
      })
      .on('broadcast', { event: 'current-state' }, ({ payload }) => {
        if (userRole === 'parent' && payload.ts > lastSyncTsRef.current) {
          lastSyncTsRef.current = payload.ts;
          // Apply scholar's source-of-truth state
          setBatchState(prev => prev ? { ...prev, activeChildId: payload.activeChildId } : null);
          activeChildIdRef.current = payload.activeChildId;

          if (payload.activeChildId === activeChild?.id && payload.surah) {
            setCurrentSession(prev => prev ? {
              ...prev,
              currentSurah: payload.surah,
              currentAyah: payload.ayah
            } : null);
          }
        }
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Supabase] Real-time sync connected');
          // 🆕 Student broadcasts a sync request upon connection to align instantly
          if (userRole === 'parent') {
            syncChannelRef.current?.send({
              type: 'broadcast',
              event: 'sync-request',
              payload: { ts: Date.now() }
            });
          }
        } else if (status === 'CHANNEL_ERROR' || err) {
          console.warn('[Supabase] Real-time sync failed, falling back to polling', err);
        }
      });

    syncChannelRef.current = channel;

    return () => { 
      channel.unsubscribe(); 
      syncChannelRef.current = null;
    };
    // Only re-subscribe when the batchId or role changes, NOT when batchState changes
  }, [currentSession?.batchId, userRole]);

  // 📡 LEADERBOARD POLLING
  useEffect(() => {
    if (!currentSession?.batchId) return;
    const fetchLeaderboard = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(`${APPLICATION_API_URL}/api/live/batch/${currentSession.batchId}/leaderboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLeaderboard(res.data.leaderboard);
      } catch (e) {}
    };
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000); // Increased polling interval to 10s
    return () => clearInterval(interval);
  }, [currentSession?.batchId]);

  // -------------------------------------------------------------------
  // 🕹️ ACTIONS
  // -------------------------------------------------------------------

  const handleScholarJoinBatch = async (batchOrId: any) => {
    try {
      const batchId = typeof batchOrId === 'string' ? batchOrId : batchOrId?._id;
      if (!batchId) return;
      const token = await getToken();
      const res = await axios.post(`${APPLICATION_API_URL}/api/live/${batchId}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentSession(res.data.session);
    } catch (err) { alert("Failed to start class. Please try again."); }
  };

  const handleSetTurn = async (childId: string, batchId: string) => {
    try {
      const token = await getToken();
      await axios.post(`${APPLICATION_API_URL}/api/live/batch/${batchId}/select-turn`, { childId }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Find this child's last known position to broadcast it
      const childData = batchState?.activeParticipants?.find(p => p.childId === childId);

      // ⚡ Instantly broadcast to all students — no waiting for 15s poll
      if (syncChannelRef.current) {
        syncChannelRef.current.send({
          type: 'broadcast',
          event: 'turn-assigned',
          payload: { 
            activeChildId: childId, 
            batchId, 
            surah: childData?.currentSurah,
            ayah: childData?.currentAyah,
            ts: Date.now() 
          }
        });
      }
      // Update scholar's own local state immediately
      setBatchState(prev => prev ? { ...prev, activeChildId: childId } : null);
      activeChildIdRef.current = childId;
    } catch (err) { alert("Failed to set student turn."); }
  };

  const handleScoreRecitation = async (childId: string, batchId: string, score: number) => {
    try {
      const token = await getToken();
      await axios.post(`${APPLICATION_API_URL}/api/live/batch/${batchId}/score-recitation`, { 
        childId, 
        score 
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) { alert("Failed to score recitation. Please retry."); }
  };

  const handleScoreParticipation = async (childId: string, batchId: string) => {
    try {
      const token = await getToken();
      await axios.post(`${APPLICATION_API_URL}/api/live/batch/${batchId}/score-participation`, { 
        childId, 
        points: 2 
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) { alert("Failed to reward participation."); }
  };

  const handleEvaluatePrompt = async (correctAnswer: 'yes' | 'no') => {
    if (!currentSession?.batchId) return;
    try {
      const token = await getToken();
      await axios.post(`${APPLICATION_API_URL}/api/live/batch/${currentSession.batchId}/evaluate-prompt`, { 
        correctAnswer 
      }, { headers: { Authorization: `Bearer ${token}` } });
      setPromptDecision(null);
    } catch (err) { alert("Failed to evaluate prompt."); }
  };

  const handleSubmitPrompt = async (answer: 'yes' | 'no') => {
    if (!currentSession?.batchId || !activeChild) return;
    try {
      const token = await getToken();
      await axios.post(`${APPLICATION_API_URL}/api/live/batch/${currentSession.batchId}/submit-prompt`, { 
        childId: activeChild.id, answer 
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (e) { alert("Failed to submit answer. Please try again."); }
  };

  const handleEndClass = async (batchId: string) => {
    try {
      const token = await getToken();
      await axios.post(`${APPLICATION_API_URL}/api/live/batch/${batchId}/end`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentSession(null);
    } catch (err) { alert("Failed to terminate class. Please retry."); }
  };

  const handleExitSession = () => {
    // Clear the joined session ref so the leaderboard CAN appear if the session ends later
    joinedSessionIdRef.current = null;
    setCurrentSession(null);
    setBatchState(null);
  };

  const emitPosition = useCallback(async (surahNumber: number, ayahNumber: number) => {
    if (!currentSession?.batchId || userRole === 'scholar') return;

    // Store the latest pending position (overwrite any not-yet-fired pending call)
    emitPendingRef.current = { surah: surahNumber, ayah: ayahNumber };

    // If a timer is already running, let it fire with the latest pending values
    if (emitThrottleTimerRef.current) return;

    emitThrottleTimerRef.current = setTimeout(async () => {
      emitThrottleTimerRef.current = null;
      const pending = emitPendingRef.current;
      if (!pending) return;
      emitPendingRef.current = null;

      try {
        const token = await getToken();
        await axios.post(`${APPLICATION_API_URL}/api/live/update-progress`, {
          batchId: currentSession.batchId, childId: currentSession.childId,
          surah: pending.surah, ayah: pending.ayah
        }, { headers: { Authorization: `Bearer ${token}` } });

        // 📡 Instant Broadcast to Scholar
        if (syncChannelRef.current) {
          syncChannelRef.current.send({
            type: 'broadcast',
            event: 'ayah-change',
            payload: { surah: pending.surah, ayah: pending.ayah, childId: currentSession.childId, ts: Date.now() }
          });
        }
      } catch (e) {}
    }, POSITION_THROTTLE_MS);
  }, [currentSession?.batchId, currentSession?.childId, userRole, getToken]);

  const handleAyahClick = async (surah: number, ayah: number) => {
    if (!currentSession || userRole === 'scholar') return;
    setCurrentSession(prev => prev ? { ...prev, currentSurah: surah, currentAyah: ayah } : null);
    emitPosition(surah, ayah);
  };

  // -------------------------------------------------------------------
  // 🎭 RENDER STAGES
  // -------------------------------------------------------------------

  // Bug #3 Memoization: Extract these to avoid re-running .find() on every poll cycle/render
  const activeStudentSurah = useMemo(() => 
    batchState?.activeParticipants?.find(p => p.childId === batchState?.activeChildId)?.currentSurah,
    [batchState?.activeParticipants, batchState?.activeChildId]
  );
  
  const activeStudentAyah = useMemo(() =>
    batchState?.activeParticipants?.find(p => p.childId === batchState?.activeChildId)?.currentAyah,
    [batchState?.activeParticipants, batchState?.activeChildId]
  );

  // Sync refs for Supabase closure safety
  useEffect(() => {
    activeStudentSurahRef.current = activeStudentSurah;
    activeStudentAyahRef.current = activeStudentAyah;
  }, [activeStudentSurah, activeStudentAyah]);

  const renderScholarStage = () => {
    if (!currentSession) return null;
    return (
      <div className="flex flex-col h-full relative overflow-hidden">
        {/* Tarbiyah-themed ambient background */}
        <div className="absolute inset-0 bg-[#011a11] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.12)_0%,transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(245,158,11,0.06)_0%,transparent_60%)] pointer-events-none" />

         {/* STUDENT SPEED DOCK */}
         <div className="flex-none p-4 pb-0 z-20 relative">
            <div className="flex gap-3 overflow-x-auto pb-4 items-center">
              {activeSessions.map(session => (
                <div 
                  key={session._id} 
                  onClick={() => handleSetTurn(session.childId, session.batchId!)}
                  className={`shrink-0 cursor-pointer rounded-2xl transition-all duration-500 ${
                    batchState?.activeChildId === session.childId 
                      ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-[0_0_25px_rgba(16,185,129,0.5)] scale-105' 
                      : 'bg-white/10 backdrop-blur-xl border border-white/20 opacity-60 hover:opacity-100 hover:scale-105'
                  }`}
                >
                   <div className="px-5 py-3 flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shadow-lg ${
                        batchState?.activeChildId === session.childId ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400'
                      }`}>
                        {session.studentName?.[0] || 'S'}
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          batchState?.activeChildId === session.childId ? 'text-white' : 'text-emerald-200'
                        }`}>{session.studentName}</span>
                        {batchState?.activeChildId === session.childId && (
                           <span className="text-[8px] text-emerald-100/70 font-bold uppercase animate-pulse">● Reciting</span>
                        )}
                      </div>
                   </div>
                </div>
              ))}
            </div>
         </div>

         {/* MAIN STAGE (DUAL PANE) */}
         <div className="flex-1 relative flex flex-col md:flex-row gap-4 p-4 overflow-hidden z-10">
            {/* LEFT: VIDEO GRID */}
            <div className={`flex-1 bg-black/60 backdrop-blur-xl rounded-[2.5rem] border border-emerald-500/20 shadow-2xl overflow-hidden relative group transition-all duration-700 ${batchState?.activeChildId ? 'md:flex-[0.4]' : 'md:flex-1'}`}>
               {/* Top shimmer bar */}
               <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent z-40" />
               <AgoraVideoPane
                 appId={currentSession.agoraAppId || ""}
                 token={currentSession.agoraToken || ""}
                 channel={currentSession.channel || currentSession.batchId || ""}
                 uid={getNumericUid(user?.id || '')}
                 role="scholar"
                 layout="grid"
                 scholarId={currentSession.scholarId}
               />
               <div className="absolute top-6 left-6 py-2 px-4 bg-[#022c22]/80 backdrop-blur-xl border border-emerald-500/30 rounded-2xl flex items-center gap-3 z-30">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]" />
                  <span className="text-[9px] text-emerald-200 font-black uppercase tracking-widest">Live Class · {activeSessions.length} Students</span>
               </div>
               
               {/* Scholar controls: Qaida + End Class */}
               <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between gap-3 z-40">
                 <button 
                   onClick={() => setShowQaidaViewer(true)}
                   className="px-5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all backdrop-blur-xl shadow-lg"
                 >
                   📖 Qaida
                 </button>
                 <button 
                   onClick={() => setConfirmEndClass(currentSession.batchId!)}
                   className="px-6 py-2.5 bg-red-900/30 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all backdrop-blur-xl"
                 >
                   End Class
                 </button>
               </div>
            </div>

            {/* RIGHT: SYNCED QURAN (Scholar Exclusive follow student) */}
            {batchState?.activeChildId && (
               <div id="scholar-quran-container" className="flex-1 rounded-[2.5rem] border border-emerald-900/40 shadow-2xl overflow-y-auto relative group flex flex-col md:flex-1 animate-in slide-in-from-right duration-700" style={{ background: '#fdfaf3' }}>
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent z-40" />
                  <div className="absolute top-5 left-5 py-2 px-4 bg-[#022c22]/80 backdrop-blur-xl border border-emerald-700/40 rounded-2xl flex items-center gap-3 z-30">
                    <BookOpen size={11} className="text-emerald-300" />
                    <span className="text-[9px] text-emerald-200 font-black uppercase tracking-widest">Following Student</span>
                  </div>
                  <QuranPage
                    onBack={() => {}}
                    sessionCurrentSurah={activeStudentSurah}
                    sessionCurrentAyah={activeStudentAyah}
                    onAyahClick={() => {}}
                    readOnly={true}
                    scrollContainerId="scholar-quran-container"
                  />
               </div>
            )}

            {!isMobile && batchState?.activeChildId && (
               <div className="w-[280px] bg-[#022c22]/80 backdrop-blur-xl rounded-[2rem] border border-emerald-700/30 p-6 flex flex-col gap-5 shadow-2xl animate-in slide-in-from-right-12 duration-700">
                  {/* Top shimmer */}
                  <div className="h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent -mx-6 mb-1" />
                  <div className="text-center space-y-1">
                     <p className="text-[9px] text-emerald-400/60 font-black uppercase tracking-[0.2em]">Now Evaluating</p>
                     <h3 className="text-lg font-serif font-bold text-white truncate px-2">{activeSessions.find(s => s.childId === batchState.activeChildId)?.studentName}</h3>
                  </div>

                  <div className="space-y-4">
                     <div className="p-4 bg-white/5 border border-emerald-700/20 rounded-2xl">
                        <p className="text-[9px] text-emerald-400/60 font-bold uppercase tracking-widest mb-3 text-center">Class Consensus</p>
                        <div className="flex items-center justify-around gap-2 px-2">
                           <div className="text-center">
                              <span className="text-2xl font-black text-emerald-400">{batchState?.currentPromptAnswers?.filter(a => a.answer === 'yes').length || 0}</span>
                              <p className="text-[9px] text-emerald-500/50 uppercase font-black tracking-tighter mt-1">Perfect</p>
                           </div>
                           <div className="w-px h-6 bg-emerald-700/30" />
                           <div className="text-center">
                              <span className="text-2xl font-black text-red-400">{batchState?.currentPromptAnswers?.filter(a => a.answer === 'no').length || 0}</span>
                              <p className="text-[9px] text-red-400/50 uppercase font-black tracking-tighter mt-1">Mistakes</p>
                           </div>
                        </div>
                        
                        {!batchState?.promptEvaluated && (batchState?.currentPromptAnswers?.length || 0) > 0 && (
                           <div className="grid grid-cols-2 gap-2 mt-4">
                              <button onClick={() => handleEvaluatePrompt('yes')} className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 py-2 rounded-xl font-black text-[9px] uppercase border border-emerald-500/30 transition-all">✓ Perfect</button>
                              <button onClick={() => handleEvaluatePrompt('no')} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-xl font-black text-[9px] uppercase border border-red-500/20 transition-all">✗ Mistake</button>
                           </div>
                        )}
                     </div>

                     <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleScoreRecitation(batchState.activeChildId!, currentSession.batchId!, 4)} className="bg-emerald-500 hover:bg-emerald-400 text-black py-3 rounded-xl font-black text-[9px] uppercase transition-all shadow-lg shadow-emerald-500/20 active:scale-95">Excel (+10)</button>
                        <button onClick={() => handleScoreRecitation(batchState.activeChildId!, currentSession.batchId!, 3)} className="bg-emerald-700 hover:bg-emerald-600 text-white py-3 rounded-xl font-black text-[9px] uppercase transition-all shadow-lg active:scale-95">Good (+7)</button>
                        <button onClick={() => handleScoreRecitation(batchState.activeChildId!, currentSession.batchId!, 2)} className="bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-xl font-black text-[9px] uppercase transition-all shadow-lg shadow-amber-500/20 active:scale-95">Avg (+5)</button>
                        <button onClick={() => handleScoreRecitation(batchState.activeChildId!, currentSession.batchId!, 1)} className="bg-red-900/30 hover:bg-red-800/40 text-red-400 py-3 rounded-xl font-black text-[9px] uppercase transition-all active:scale-95 border border-red-700/30">Need (+2)</button>
                        <button onClick={() => handleScoreParticipation(batchState.activeChildId!, currentSession.batchId!)} className="col-span-1 bg-white/10 hover:bg-white/20 text-emerald-300 py-3 rounded-xl font-black text-[9px] uppercase border border-emerald-700/20 transition-all active:scale-95">Partic (+2)</button>
                        <button onClick={() => setShowAssignModal(true)} className="bg-indigo-600/60 hover:bg-indigo-500 text-white py-3 rounded-xl font-black text-[9px] uppercase flex items-center justify-center gap-2 transition-all active:scale-95 border border-indigo-500/30"><BookOpen size={14}/> Lesson</button>
                     </div>
                  </div>
               </div>
            )}
         </div>

         {/* Mobile bottom bar */}
         {isMobile && (
            <div className="fixed bottom-0 left-0 right-0 bg-[#011a11]/95 backdrop-blur-3xl border-t border-emerald-700/30 rounded-t-[2.5rem] z-30 flex flex-col gap-3 animate-in slide-in-from-bottom duration-500 p-5">
               <div className="w-12 h-1 bg-emerald-700/40 rounded-full mx-auto mb-1" />
               {batchState?.activeChildId && (
                  <div className="grid grid-cols-2 gap-2">
                     <button onClick={() => handleScoreRecitation(batchState.activeChildId!, currentSession.batchId!, 4)} className="bg-emerald-500 hover:bg-emerald-400 text-black py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-emerald-500/20 transition-all active:scale-95">Excel (+10)</button>
                     <button onClick={() => handleScoreRecitation(batchState.activeChildId!, currentSession.batchId!, 3)} className="bg-emerald-700 hover:bg-emerald-600 text-white py-3 rounded-2xl font-black text-[10px] uppercase transition-all active:scale-95">Good (+7)</button>
                     <button onClick={() => handleScoreRecitation(batchState.activeChildId!, currentSession.batchId!, 2)} className="bg-amber-500 hover:bg-amber-400 text-black py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-amber-500/20 transition-all active:scale-95">Avg (+5)</button>
                     <button onClick={() => handleScoreRecitation(batchState.activeChildId!, currentSession.batchId!, 1)} className="bg-red-900/30 text-red-400 py-3 rounded-2xl font-black text-[10px] uppercase transition-all active:scale-95 border border-red-700/30">Need (+2)</button>
                  </div>
               )}
               {batchState?.activeChildId && (
                  <div className="flex gap-2">
                     <button onClick={() => handleScoreParticipation(batchState.activeChildId!, currentSession.batchId!)} className="bg-white/10 text-emerald-300 px-6 py-3 rounded-2xl font-black text-[10px] uppercase border border-emerald-700/20 grow">Participation</button>
                     <button onClick={() => setShowAssignModal(true)} className="bg-indigo-600/60 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase border border-indigo-500/30 shrink-0">Lesson</button>
                  </div>
               )}
               <div className="flex gap-2">
                  <button onClick={() => setShowQaidaViewer(true)} className="bg-emerald-500/20 text-emerald-300 px-6 py-3 rounded-2xl font-black text-[10px] uppercase border border-emerald-500/30 grow">📖 Qaida</button>
                  <button onClick={() => setConfirmEndClass(currentSession.batchId!)} className="bg-red-900/30 text-red-400 px-6 py-3 rounded-2xl font-black text-[10px] uppercase border border-red-700/30 shrink-0">End Class</button>
               </div>
            </div>
         )}
      </div>
    );
  };

  const renderRecitationStage = () => {
    if (!currentSession) return null;
    return (
      <div className="flex flex-col h-full relative overflow-hidden">
        {/* Tarbiyah background */}
        <div className="absolute inset-0 bg-[#011a11] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(16,185,129,0.1)_0%,transparent_70%)] pointer-events-none" />

        {/* Top bar */}
        <div className="relative z-20 px-6 pt-4 pb-2 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                 <Mic size={20} />
              </div>
              <div>
                 <h3 className="text-white font-serif font-bold text-base leading-none mb-0.5">Live Recitation</h3>
                 <p className="text-emerald-400/60 text-[10px] font-bold uppercase tracking-widest">Scholar is listening</p>
              </div>
           </div>
           <div className="bg-[#022c22]/80 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-emerald-700/30 flex flex-col items-center shadow-lg">
              <span className="text-[8px] text-emerald-400/50 uppercase font-black tracking-widest leading-none">Class Points</span>
              <span className="text-xl font-black text-emerald-400 mt-0.5 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]">{currentSessionScore}</span>
           </div>
        </div>

        <div className="flex-1 relative px-4 pb-4 z-10">
           <div 
             id="student-quran-container" className="w-full h-full rounded-[2.5rem] overflow-y-auto shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] border border-emerald-900/30 relative"
             style={{ background: '#fdfaf3', WebkitOverflowScrolling: 'touch', touchAction: 'pan-y' }}
           >
              {/* Shimmer top border */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent z-10" />
              <QuranPage
                onBack={handleExitSession}
                sessionCurrentSurah={currentSession.currentSurah}
                sessionCurrentAyah={currentSession.currentAyah}
                onAyahClick={handleAyahClick}
                onPositionChange={emitPosition}
                readOnly={false}
                scrollContainerId="student-quran-container"
              />
              {/* Scholar video pip — warm glassy border */}
              <div className="absolute top-8 right-8 w-44 md:w-64 aspect-video z-30 rounded-3xl overflow-hidden group border border-emerald-900/40 shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-105">
                 <AgoraVideoPane
                   appId={currentSession.agoraAppId || ""}
                   token={currentSession.agoraToken || ""}
                   channel={currentSession.channel || currentSession.batchId || ""}
                   uid={getNumericUid(user?.id || '')}
                   role="student"
                   layout="inset"
                   scholarId={currentSession.scholarId}
                 />
                 <div className="absolute inset-x-0 bottom-0 py-2 bg-gradient-to-t from-[#022c22]/90 to-transparent flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] text-emerald-200 font-black uppercase tracking-widest">Scholar Stream</span>
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
      <div className="flex flex-col h-full relative overflow-hidden">
        {/* Tarbiyah background */}
        <div className="absolute inset-0 bg-[#011a11] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(245,158,11,0.05)_0%,transparent_70%)] pointer-events-none" />

        <div className="relative z-20 px-6 pt-4 pb-2 flex items-center justify-between">
           <div className="flex flex-col">
              <h3 className="text-white font-serif font-bold text-base mb-0.5 leading-none">Observer Mode</h3>
              <p className="text-emerald-400/50 text-[10px] font-bold uppercase tracking-widest">A classmate is reciting</p>
           </div>
           {leaderboard && (
              <button onClick={() => setActiveDrawer('leaderboard')} className="flex items-center gap-3 px-5 py-2.5 bg-amber-500/10 backdrop-blur-xl border border-amber-500/30 rounded-2xl hover:bg-amber-500/20 transition-all group shadow-lg">
                 <Trophy size={16} className="text-amber-400 group-hover:scale-110 transition-transform" />
                 <span className="text-[10px] text-amber-400 font-black uppercase tracking-widest">Leaderboard</span>
              </button>
           )}
        </div>

        <div className="flex-1 px-4 pb-4 flex flex-col md:flex-row gap-4 overflow-hidden mb-12 md:mb-0 z-10">
           <div className="flex-[3] bg-black/60 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-emerald-800/30 shadow-2xl relative">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent z-40" />
              <AgoraVideoPane
                appId={currentSession.agoraAppId || ""}
                token={currentSession.agoraToken || ""}
                channel={currentSession.channel || currentSession.batchId || ""}
                uid={getNumericUid(user?.id || '')}
                role="student"
                layout="spotlight"
                scholarId={currentSession.scholarId}
              />
              <div className="absolute top-6 left-6 py-2 px-4 bg-[#022c22]/80 backdrop-blur-xl border border-emerald-700/30 rounded-2xl flex items-center gap-3 z-30">
                 <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_#34d399]" />
                 <span className="text-[9px] text-emerald-200 font-black uppercase tracking-widest">Scholar Stream</span>
              </div>
           </div>

           {!isMobile && (
              <div className="flex-1 bg-[#022c22]/60 backdrop-blur-xl border border-emerald-800/30 rounded-[2.5rem] p-8 flex flex-col shadow-inner">
                 <div className="h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent mb-6" />
                 <h4 className="text-[9px] text-emerald-400/50 font-black uppercase tracking-[0.3em] mb-6 text-center">Class Standings</h4>
                 <div className="space-y-3 overflow-y-auto">
                    {leaderboard?.slice(0, 6).map((l, idx) => (
                       <div key={l.childId} className="flex items-center justify-between px-4 py-3 bg-white/5 rounded-2xl border border-emerald-800/20 group hover:border-emerald-500/30 transition-all">
                          <div className="flex items-center gap-3 text-xs font-bold text-white/70">
                             <span className={`font-black w-5 text-sm ${idx < 3 ? 'text-amber-400' : 'text-emerald-500'}`}>#{idx+1}</span>
                             <span className="truncate max-w-[90px] text-emerald-100">{l.name}</span>
                          </div>
                          <span className="text-xs font-black text-amber-400">{l.total} XP</span>
                       </div>
                    ))}
                 </div>
              </div>
           )}
        </div>

        {/* Peer evaluation prompt */}
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-full max-w-md px-6 z-50">
           {batchState?.activeChildId && batchState.activeChildId !== currentSession.childId && (
              (() => {
                const myAnswer = batchState?.currentPromptAnswers?.find(a => a.childId === currentSession.childId);
                 if (batchState?.promptEvaluated || myAnswer) return null;
                return (
                   <div className="bg-[#022c22]/95 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-emerald-700/40 shadow-[0_30px_80px_rgba(0,0,0,0.7)] animate-in slide-in-from-bottom-12 duration-700">
                      <div className="h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent mb-6" />
                      <h4 className="text-center text-emerald-300/60 font-black uppercase text-[10px] tracking-[0.3em] mb-6">Listen & Evaluate</h4>
                      <div className="flex gap-3">
                         <button onClick={() => handleSubmitPrompt('yes')} className="flex-1 bg-emerald-500 hover:bg-emerald-400 p-5 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-90 shadow-xl shadow-emerald-500/20 group">
                            <CheckCircle size={28} className="text-black transition-transform group-hover:scale-110" />
                            <span className="text-[10px] font-black text-black">PERFECT</span>
                         </button>
                         <button onClick={() => handleSubmitPrompt('no')} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 p-5 rounded-2xl flex flex-col items-center gap-2 transition-all active:scale-90 group">
                            <XCircle size={26} className="text-red-400 transition-transform group-hover:scale-110" />
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

  // 📡 Listen for Scholar opening Qaida
  useEffect(() => {
    if (userRole !== 'parent' || !currentSession?.batchId) return;

    const channel = supabase.channel(`class-sync:${currentSession.batchId}`)
      .on('broadcast', { event: 'qaida-sync' }, ({ payload }) => {
        if (payload.isOpen !== undefined) {
          setShowQaidaViewer(payload.isOpen);
        }
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [currentSession?.batchId, userRole]);

  // 📡 Broadcast Qaida open/close state to students (Scholar only)
  // Reuses the already-subscribed syncChannelRef to avoid creating orphan channel objects
  useEffect(() => {
    if (userRole !== 'scholar' || !currentSession?.batchId || !syncChannelRef.current) return;

    syncChannelRef.current.send({
      type: 'broadcast',
      event: 'qaida-sync',
      payload: { isOpen: showQaidaViewer, ts: Date.now() }
    });
  }, [showQaidaViewer, userRole, currentSession?.batchId]);

  // -------------------------------------------------------------------
  // 🏁 MAIN RENDER
  // -------------------------------------------------------------------

  if (currentSession) {
    return (
      <div className="fixed inset-0 z-[1000] flex flex-col font-sans selection:bg-emerald-500/20 overflow-hidden text-white" style={{ background: '#011a11' }}>
        {/* Tarbiyah ambient glow layers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(16,185,129,0.15)_0%,transparent_100%)] pointer-events-none z-0" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(245,158,11,0.04)_0%,transparent_70%)] pointer-events-none z-0" />

        {/* SESSION HEADER — Tarbiyah themed */}
        <div className="flex-none h-14 bg-[#022c22]/70 backdrop-blur-3xl border-b border-emerald-800/40 px-6 flex items-center justify-between z-50 relative">
          {/* Top glow shimmer */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />

          <div className="flex items-center gap-6">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/20 flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
                   <Leaf className="text-emerald-400" size={15} />
                </div>
                <div className="flex flex-col">
                   <span className="text-[11px] text-emerald-100 font-serif font-bold leading-none">Imam Live</span>
                   <span className="text-[8px] text-emerald-500/50 font-bold tracking-wider mt-0.5">Classroom Session</span>
                </div>
             </div>
             <div className="h-4 w-px bg-emerald-700/40 hidden md:block" />
             <div className="hidden md:flex items-center gap-2 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_6px_#34d399]" />
                <span className="text-[9px] text-emerald-300 font-black uppercase tracking-widest">Live Sync Active</span>
             </div>
          </div>

          <div className="flex items-center gap-2">
             {(userRole === 'scholar' || user?.primaryEmailAddress?.emailAddress?.toLowerCase() === "scholar1.imam@gmail.com") && (
               <button
                 onClick={() => setConfirmEndClass(currentSession.batchId!)}
                 className="flex items-center gap-2 bg-red-900/30 hover:bg-red-500 text-red-400 hover:text-white border border-red-700/30 px-4 py-2 rounded-xl transition-all active:scale-95"
               >
                 <XCircle size={14} />
                 <span className="text-[9px] font-black uppercase tracking-widest">End Class</span>
               </button>
             )}
             <button 
               onClick={handleExitSession}
               className="group flex items-center gap-2 bg-white/5 hover:bg-white/10 text-emerald-200/60 hover:text-emerald-100 border border-emerald-800/30 px-4 py-2 rounded-xl transition-all active:scale-95"
             >
               <LogOut size={14} className="group-hover:-translate-x-0.5 transition-transform" />
               <span className="text-[9px] font-black uppercase tracking-widest">Exit</span>
             </button>
          </div>
        </div>

        <div className="flex-1 relative overflow-hidden z-10">
            {renderMainStage()}
        </div>

        {/* ── MODALS & DRAWERS ── */}

        {/* Assign Lesson Modal */}
        {showAssignModal && currentSession?.batchId && (
          <div className="fixed inset-0 z-[6000] bg-[#011a11]/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-500">
             <div className="w-full max-w-6xl h-[90vh] bg-[#022c22]/80 border border-emerald-700/30 rounded-[3rem] shadow-2xl overflow-y-auto relative animate-in zoom-in-95">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
                <ScholarQuranManager 
                  batchId={currentSession.batchId} 
                  batchName="Curriculum Management" 
                  onClose={() => setShowAssignModal(false)}
                />
             </div>
          </div>
        )}

        {/* End Class Confirmation */}
        {confirmEndClass && (
          <div className="fixed inset-0 z-[7000] bg-[#011a11]/90 backdrop-blur-3xl flex items-center justify-center p-8">
            <div className="bg-[#022c22]/90 border border-emerald-700/30 rounded-[3rem] p-12 max-w-md w-full text-center shadow-2xl animate-in zoom-in-95 duration-500 relative overflow-hidden">
               <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-400/40 to-transparent" />
               <div className="w-20 h-20 bg-red-900/30 text-red-400 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-700/30 shadow-inner">
                 <LogOut size={36} />
               </div>
               <h3 className="text-2xl font-serif font-bold text-white mb-3">End the Session?</h3>
               <p className="text-emerald-200/40 text-sm mb-10 leading-relaxed">This will dismiss the class for all participants.</p>
               <div className="flex gap-3">
                 <button onClick={() => setConfirmEndClass(null)} className="flex-1 bg-white/5 hover:bg-white/10 text-emerald-200 font-black py-4 rounded-2xl transition-all uppercase text-[10px] tracking-widest border border-emerald-800/30">Stay Live</button>
                 <button onClick={() => { handleEndClass(confirmEndClass); setConfirmEndClass(null); }} className="flex-1 bg-red-500 hover:bg-red-400 text-white font-black py-4 rounded-2xl shadow-xl shadow-red-500/20 transition-all uppercase text-[10px] tracking-widest">End Session</button>
               </div>
             </div>
          </div>
        )}

        {/* Leaderboard Drawer */}
        {activeDrawer === 'leaderboard' && (
           <div className="fixed inset-0 z-[5000] bg-[#011a11]/70 backdrop-blur-sm animate-in fade-in" onClick={() => setActiveDrawer('none')}>
              <div 
                className="absolute bottom-0 left-0 right-0 max-h-[85vh] bg-[#022c22]/95 backdrop-blur-3xl border-t border-emerald-700/40 rounded-t-[3rem] p-10 overflow-hidden animate-in slide-in-from-bottom duration-700 shadow-2xl flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                 <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
                 <div className="w-12 h-1 bg-emerald-700/50 rounded-full mx-auto mb-8 shrink-0" />
                 <div className="flex items-center justify-between mb-8 shrink-0">
                    <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-4">
                       <Trophy className="text-amber-400" size={28} />
                       Class Leaderboard
                    </h2>
                    <button onClick={() => setActiveDrawer('none')} className="text-emerald-400/40 hover:text-emerald-200 transition-colors">
                       <XCircle size={32} />
                    </button>
                 </div>
                 <div className="flex-1 overflow-y-auto space-y-3 pb-10">
                    {leaderboard?.map((l, idx) => (
                       <div key={idx} className="flex items-center justify-between px-6 py-5 bg-white/5 rounded-2xl border border-emerald-800/20 group hover:border-emerald-500/30 transition-all">
                          <div className="flex items-center gap-5">
                             <span className={`text-xl font-black ${idx < 3 ? 'text-amber-400' : 'text-emerald-500'}`}>#{idx+1}</span>
                             <div className="flex flex-col">
                                <span className="font-bold text-white text-base">{l.name}</span>
                                <span className="text-[9px] text-emerald-400/40 font-bold uppercase tracking-widest mt-0.5">Session Active</span>
                             </div>
                          </div>
                          <div className="bg-amber-400/90 text-black px-5 py-2 rounded-xl font-black text-sm shadow-lg shadow-amber-400/10">
                             {l.total} XP
                          </div>
                       </div>
                    ))}
                    {(!leaderboard || leaderboard.length === 0) && (
                       <div className="text-center py-16 bg-white/5 border border-dashed border-emerald-800/30 rounded-[2rem]">
                          <Loader2 className="animate-spin text-emerald-500/40 mx-auto mb-4" size={36} />
                          <p className="text-[10px] font-black text-emerald-200/20 uppercase tracking-[0.3em]">Loading Scores</p>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        )}

        {showQaidaViewer && currentSession && (
          <QaidaViewer 
            onClose={() => setShowQaidaViewer(false)}
            isScholar={userRole === 'scholar'}
            batchId={currentSession.batchId || ""}
            followScholar={true}
          />
        )}
      </div>
    );
  }

  return (
    <TarbiyahLobby 
      getToken={getToken} 
      onJoinSession={(session) => {
          // Mark this session as explicitly joined — suppresses leaderboard auto-trigger for this session
          joinedSessionIdRef.current = session?.sessionId || session?._id || null;
          setShowLeaderboard(false);
          setActiveDrawer('none');
          setCurrentSession(session);
       }} 
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
