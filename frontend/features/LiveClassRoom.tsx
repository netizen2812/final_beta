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
  Star, Moon, Cloud, Sprout, Leaf, Sun, Mic, Trophy, CheckCircle, Lock
} from 'lucide-react';
import { useChildContext } from '../contexts/ChildContext';
import QuranPage from './QuranPage';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useTranslation } from 'react-i18next';
import { TarbiyahLobby } from './TarbiyahLobby';

const POSITION_THROTTLE_MS = 500;

import { MovingBackground } from './TarbiyahLobby';

// Types
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
  batchId?: string; // Added for presence tracking
}

interface ScholarStatus {
  online: boolean;
  scholarName: string;
  activeSessions?: number;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const LiveClassRoom: React.FC = () => {
  const { activeChild, refreshChildren } = useChildContext();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { t } = useTranslation();

  const [userRole, setUserRole] = useState<'parent' | 'scholar'>('parent');
  const [isLoading, setIsLoading] = useState(false);
  const [scholarStatus, setScholarStatus] = useState<ScholarStatus>({ online: false, scholarName: "Scholar" });
  const [statusLoading, setStatusLoading] = useState(true);

  // Scholar Dashboard State
  const [activeSessions, setActiveSessions] = useState<LiveSession[]>([]);

  // Active Session State
  const [currentSession, setCurrentSession] = useState<LiveSession | null>(null);
  const [hasStartedReciting, setHasStartedReciting] = useState(false);

  const [accessStatus, setAccessStatus] = useState<{ hasAccess: boolean; pendingRequest: boolean } | null>(null);

  // Classroom State (Turn & Session tracking)
  interface PromptAnswer {
    childId: string;
    answer: 'yes' | 'no';
  }

  interface BatchState {
    activeChildId: string | null;
    activeSessionId: string | null;
    status: string;
    currentPromptAnswers?: PromptAnswer[];
    pastSessions?: { sessionId: string; startedAt: string; endedAt: string }[];
  }
  const [batchState, setBatchState] = useState<BatchState | null>(null);
  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[] | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean | string>(false);
  const [attendedSessionIds, setAttendedSessionIds] = useState<string[]>([]);
  const [confirmEndClass, setConfirmEndClass] = useState<string | null>(null);

  // Determine Role & Check Access
  useEffect(() => {
    const role = user?.publicMetadata?.role;
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();

    // Dynamic Role Check (Dashboard assigned) OR Hardcoded Fallback
    const isScholar = role === 'scholar' || role === 'admin' || email === "scholar1.imam@gmail.com";

    if (isScholar) {
      setUserRole('scholar');
    } else {
      setUserRole('parent');
      checkAccess();
    }
  }, [user, getToken]);

  // SCHOLAR DASHBOARD STATE
  const [scholarBatches, setScholarBatches] = useState<any[]>([]);

  // Fetch Scholar's Batches (Once on mount)
  useEffect(() => {
    if (userRole !== 'scholar') return;
    const fetchBatches = async () => {
      try {
        const token = await getToken();
        // Fetch batches assigned to this scholar (or all for MVP)
        const res = await axios.get(`${API_BASE}/api/live/scholar/batches`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setScholarBatches(Array.isArray(res.data.batches) ? res.data.batches : []);
      } catch (err) {
        console.error("Failed to fetch scholar batches", err);
        setScholarBatches([]);
      }
    };
    fetchBatches();
    // Poll every 10s for new batches
    const interval = setInterval(fetchBatches, 10000);
    return () => clearInterval(interval);
  }, [userRole, getToken]);

  useEffect(() => {
    if (userRole !== 'scholar' || !currentSession?.batchId) return;
    
    // Instead of hacking activeSessions, we poll the batch state directly!
    const fetchBatchState = async () => {
      try {
        const token = await getToken();
        // Get full batch state which includes participants
        const res = await axios.get(`${API_BASE}/api/live/batch/${currentSession.batchId}/state`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const data = res.data;
        setBatchState({
           activeChildId: data.activeChildId,
           activeSessionId: data.activeSessionId,
           status: data.status,
           currentPromptAnswers: data.currentPromptAnswers || [],
           pastSessions: data.pastSessions || []
        });
        
        // Auto scroll to latest active participant's position
        if (data.activeChildId && data.activeSurah && data.activeAyah) {
           setCurrentSession(prev => prev ? {
              ...prev,
              childId: data.activeChildId,
              currentSurah: data.activeSurah,
              currentAyah: data.activeAyah
           } : null);
        }

        // Map active participants back to `activeSessions` for the UI
        if (data.activeParticipants && Array.isArray(data.activeParticipants)) {
            const mappedSessions = data.activeParticipants.filter((p: any) => p && p.isActive).map((p: any) => ({
              _id: `${p.childId}-${currentSession.batchId}`,
              parentId: "unknown",
              childId: p.childId,
              scholarId: user?.id || "scholar",
              currentSurah: p.currentSurah || null,
              currentAyah: p.currentAyah || null,
              lastSeen: p.lastSeen,
              status: 'active',
              studentName: p.childName || 'Student',
              parentName: `Batch`,
              batchId: currentSession.batchId
            }));
            setActiveSessions(mappedSessions);
        }

        if ((data.status === 'ended' || data.status === 'upcoming') && !showLeaderboard) {
           const lastSession = data.pastSessions?.[data.pastSessions.length - 1];
           if (lastSession) {
             setShowLeaderboard(lastSession.sessionId);
           } else {
             setShowLeaderboard(true);
           }
        }
      } catch (err) {
        console.error("Batch state poll error", err);
      }
    };

    fetchBatchState();
    const interval = setInterval(fetchBatchState, 1500);
    return () => clearInterval(interval);
  }, [userRole, getToken, currentSession?.batchId, showLeaderboard]);

  // SCHOLAR: Auto-switch view to active reciting student
  useEffect(() => {
    if (userRole === 'scholar' && batchState?.activeChildId && currentSession?.batchId) {
      if (currentSession.childId !== batchState.activeChildId) {
        const nextActive = activeSessions.find(s => s.childId === batchState.activeChildId);
        if (nextActive) {
          setCurrentSession(nextActive);
        }
      }
    }
  }, [userRole, batchState?.activeChildId, activeSessions, currentSession]);

  // STUDENT: HEARTBEAT & SYNC
  useEffect(() => {
    if (!currentSession?.batchId || userRole === 'scholar') return;

    const sendPing = async () => {
      try {
        const token = await getToken();
        await axios.post(`${API_BASE}/api/live/ping`, {
          batchId: currentSession.batchId,
          childId: currentSession.childId
        }, { headers: { Authorization: `Bearer ${token}` } });
      } catch (e) { console.error("Ping failed", e); }
    };

    const interval = setInterval(sendPing, 10000); // 10s Heatbeat
    // Initial ping
    sendPing();

    return () => clearInterval(interval);
  }, [currentSession, userRole, getToken]);

  // STUDENT: CLASSROOM STATE POLLING
  useEffect(() => {
    if (!currentSession?.batchId || userRole === 'scholar') return;
    
    const fetchState = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(`${API_BASE}/api/live/batch/${currentSession.batchId}/state`, {
           headers: { Authorization: `Bearer ${token}` }
        });
        setBatchState({
          activeChildId: res.data.activeChildId || null,
          activeSessionId: res.data.activeSessionId || null,
          status: res.data.status || 'active',
          currentPromptAnswers: res.data.currentPromptAnswers || [],
          promptEvaluated: res.data.promptEvaluated || false
        });

        // STUDENT AUTO-SYNC (Observer View)
        if (res.data.activeChildId && res.data.activeChildId !== currentSession.childId) {
            if (res.data.activeSurah && res.data.activeAyah) {
                setCurrentSession(prev => {
                    if (!prev) return prev;
                    if (prev.currentSurah !== res.data.activeSurah || prev.currentAyah !== res.data.activeAyah) {
                        return { ...prev, currentSurah: res.data.activeSurah, currentAyah: res.data.activeAyah };
                    }
                    return prev;
                });
            }
        }

        if ((res.data.status === 'ended' || res.data.status === 'upcoming') && !showLeaderboard) {
          setShowLeaderboard(true);
        }
      } catch(e) {}
    };

    fetchState();
    const interval = setInterval(fetchState, 3000); // 3s poll for state sync
    return () => clearInterval(interval);
  }, [currentSession?.batchId, currentSession?.childId, userRole, getToken, showLeaderboard]);


  const checkAccess = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const res = await axios.get(`${API_BASE}/api/live/access/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccessStatus(res.data);
    } catch (err) {
      console.error("Access check failed", err);
    }
  };

  const handleRequestAccess = async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      await axios.post(`${API_BASE}/api/live/access/request`, {
        email: user?.primaryEmailAddress?.emailAddress,
        name: user?.fullName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccessStatus(prev => prev ? { ...prev, pendingRequest: true } : null);
      alert("Request submitted! Please wait for admin approval.");
    } catch (err) {
      alert("Failed to submit request.");
    } finally {
      setIsLoading(false);
    }
  };

  // Throttled position emit (student → backend → scholar). Max 500ms.
  const positionThrottleRef = useRef<{ timer: ReturnType<typeof setTimeout> | null; lastSurah: number; lastAyah: number }>({ timer: null, lastSurah: 0, lastAyah: 0 });

  const emitPosition = useCallback(async (surah: number, ayah: number) => {
    if (!currentSession?.batchId || !currentSession?.childId || userRole === 'scholar') return;
    const { lastSurah, lastAyah } = positionThrottleRef.current;
    if (lastSurah === surah && lastAyah === ayah) return;

    positionThrottleRef.current.lastSurah = surah;
    positionThrottleRef.current.lastAyah = ayah;

    if (positionThrottleRef.current.timer) clearTimeout(positionThrottleRef.current.timer);
    positionThrottleRef.current.timer = setTimeout(async () => {
      positionThrottleRef.current.timer = null;
      try {
        const token = await getToken();
        console.log("[STUDENT EMIT] position", { surah, ayah, batchId: currentSession.batchId, childId: currentSession.childId });
        await axios.post(`${API_BASE}/api/live/update-position`, {
          userId: user?.id,
          batchId: currentSession.batchId,
          childId: currentSession.childId,
          surahNumber: surah,
          ayahNumber: ayah,
          timestamp: new Date().toISOString()
        }, { headers: { Authorization: `Bearer ${token}` } });
        await axios.post(`${API_BASE}/api/live/update-progress`, {
          batchId: currentSession.batchId,
          childId: currentSession.childId,
          surah,
          ayah
        }, { headers: { Authorization: `Bearer ${token}` } });
      } catch (err) {
        console.error("[STUDENT EMIT] Failed:", err);
      }
    }, POSITION_THROTTLE_MS);
  }, [currentSession, userRole, getToken, user?.id]);

  // Fetch Attendance for Current Batch (Parents only)
  useEffect(() => {
    const fetchAttendance = async () => {
      if (userRole === 'parent' && currentSession?.batchId && currentSession?.childId) {
        try {
          const token = await getToken();
          const res = await axios.get(`${API_BASE}/api/live/batch/${currentSession.batchId}/attendance?childId=${currentSession.childId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data.attendedSessionIds) {
            setAttendedSessionIds(res.data.attendedSessionIds);
          }
        } catch (e) { console.error("Attendance fetch failed", e); }
      }
    };
    fetchAttendance();
  }, [userRole, currentSession?.batchId, currentSession?.childId, getToken]);

  // POLL: Scholar Status (for parent lobby) - Optional, leaving for now
  useEffect(() => {
    if (userRole === 'parent' && accessStatus?.hasAccess && !currentSession) {
      // ... existing
    }
  }, [userRole, currentSession, accessStatus]);

  // CLASSROOM HOOKS (Must be before any early returns)
  const fetchLeaderboard = useCallback(async (batchId: string) => {
    try {
      const token = await getToken();
      const res = await axios.get(`${API_BASE}/api/live/batch/${batchId}/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLeaderboard(res.data.leaderboard || []);
    } catch(e) { console.error("Leaderboard fetch failed", e); }
  }, [getToken]);

  useEffect(() => {
    if (!currentSession?.batchId) return;
    
    // Initial fetch
    fetchLeaderboard(currentSession.batchId);
    
    // Poll every 15s to keep waiting room updated
    const interval = setInterval(() => {
      fetchLeaderboard(currentSession.batchId!);
    }, 15000);
    
    return () => clearInterval(interval);
  }, [currentSession?.batchId, fetchLeaderboard]);

  // RENDER: LOCKED STATE
  if (userRole === 'parent' && accessStatus && !accessStatus.hasAccess) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-6 animate-in fade-in">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <ShieldCheck size={48} />
        </div>
        <h1 className="text-3xl font-serif font-bold text-slate-800">{t('live.sessionsLocked')}</h1>
        <p className="text-slate-500 max-w-md mx-auto">
          {t('live.accessRestricted')}
        </p>

        {accessStatus.pendingRequest ? (
          <div className="bg-amber-50 text-amber-800 px-6 py-3 rounded-full inline-flex items-center gap-2 font-bold text-sm">
            <Clock size={16} /> {t('live.requestPending')}
          </div>
        ) : (
          <button
            onClick={handleRequestAccess}
            disabled={isLoading}
            className="bg-[#052e16] text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-900 transition-all flex items-center gap-2 mx-auto"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : t('live.requestAccess')}
          </button>
        )}
      </div>
    );
  }

  // HANDLERS
  const handleParentStartSession = async () => {
    if (!activeChild) {
      alert("Please select a child profile first.");
      return;
    }
    setIsLoading(true);
    try {
      const token = await getToken();
      const res = await axios.post(`${API_BASE}/api/live/start`, {
        childId: activeChild.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentSession(res.data.session);
    } catch (err: any) {
      console.error("Failed to start session", err);
      if (err.response?.status === 403) {
        alert(`Daily Limit Reached: ${err.response.data.message}`);
      } else {
        alert(`Could not start session: ${err.response?.data?.detail || err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleScholarJoinBatch = async (batch: any) => {
    setCurrentSession({
      _id: batch._id || batch.id,
      batchId: batch._id || batch.id,
      childId: batch.activeChildId || '',
      parentId: '',
      scholarId: user?.id || '',
      currentSurah: null,
      currentAyah: null,
      status: 'active'
    });
    setBatchState({
        activeChildId: batch.activeChildId || null,
        activeSessionId: null,
        status: 'active',
        currentPromptAnswers: [],
        promptEvaluated: false
    });

    try {
        const token = await getToken();
        await axios.post(`${API_BASE}/api/live/${batch._id || batch.id}/start`, {}, { 
            headers: { Authorization: `Bearer ${token}` } 
        });
    } catch (e) { 
        console.error("Failed to start batch", e); 
    }
  };

  const handleExitSession = async () => {
    const sessionToExit = currentSession;
    setCurrentSession(null);
    if (userRole === 'scholar') setActiveSessions([]);
    
    // Refresh child context to pull new attendance/XP for Journey of Light
    if (refreshChildren) refreshChildren();

    if (userRole !== 'scholar' && sessionToExit?.batchId) {
      try {
        const token = await getToken();
        await axios.post(`${API_BASE}/api/live/leave`, {
          batchId: sessionToExit.batchId,
          childId: sessionToExit.childId
        }, { headers: { Authorization: `Bearer ${token}` } });
      } catch (e) {
        console.error("Leave failed", e);
      }
    }
  };

  // CLASSROOM HANDLERS

  const handleEndClass = async (batchId: string) => {
     try {
       const token = await getToken();
       await axios.post(`${API_BASE}/api/live/batch/${batchId}/end`, {}, { headers: { Authorization: `Bearer ${token}` } });
       
       if (userRole === 'scholar') {
         setCurrentSession(null);
         setActiveSessions([]);
       }
     } catch(e) { console.warn(e); }
  };

  const handleSetTurn = async (childId: string, batchId: string) => {
     try {
       const token = await getToken();
       await axios.post(`${API_BASE}/api/live/batch/${batchId}/select-turn`, { childId }, { headers: { Authorization: `Bearer ${token}` } });
       setSelectedScore(null);
     } catch(e) {}
  };

  const handleScoreRecitation = async (childId: string, batchId: string, score: number) => {
     try {
       const token = await getToken();
       await axios.post(`${API_BASE}/api/live/batch/${batchId}/score-recitation`, { childId, score }, { headers: { Authorization: `Bearer ${token}` } });
     } catch(e) {}
  };

  const handleSubmitPrompt = async (answer: 'yes' | 'no') => {
     if (!currentSession?.batchId || !activeChild) return;
     try {
       const token = await getToken();
       await axios.post(`${API_BASE}/api/live/batch/${currentSession.batchId}/submit-prompt`, { 
          childId: activeChild.id, answer 
       }, { headers: { Authorization: `Bearer ${token}` } });
       
       setBatchState(prev => prev ? {
           ...prev, 
           currentPromptAnswers: [...(prev.currentPromptAnswers || []), { childId: activeChild.id, answer }]
       } : null);
     } catch(e) {}
  };

  const handleEvaluatePrompt = async (correctAnswer: 'yes' | 'no') => {
     if (!currentSession?.batchId) return;
     try {
       const token = await getToken();
       await axios.post(`${API_BASE}/api/live/batch/${currentSession.batchId}/evaluate-prompt`, { 
          correctAnswer 
       }, { headers: { Authorization: `Bearer ${token}` } });
       
       setBatchState(prev => prev ? { ...prev, promptEvaluated: true } : null);
     } catch(e) {}
  };

  const handleScoreParticipation = async (points: number = 1) => {
     if (!currentSession?.batchId || !activeChild) return;
     try {
       const token = await getToken();
       await axios.post(`${API_BASE}/api/live/batch/${currentSession.batchId}/score-participation`, { 
          childId: activeChild.id, points 
       }, { headers: { Authorization: `Bearer ${token}` } });
     } catch(e) {}
  };


  const handleAyahClick = async (surah: number, ayah: number) => {
    if (!currentSession) return;
    if (userRole === 'scholar') return;

    setCurrentSession(prev => prev ? { ...prev, currentSurah: surah, currentAyah: ayah } : null);
    emitPosition(surah, ayah);

    try {
      const token = await getToken();
      if (currentSession._id) {
        await axios.patch(`${API_BASE}/api/live/${currentSession._id}`, {
          surah, ayah
        }, { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (err) {
      console.error("Failed to update ayah", err);
    }
  };

  // RENDER: LEADERBOARD MODAL
  if (showLeaderboard) {
    return (
      <div className="fixed inset-0 z-[2000] bg-[#022c22] overflow-y-auto overflow-x-hidden p-4 flex items-center justify-center animate-in fade-in">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-900/40 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-900/30 rounded-full blur-[150px]" />
          <MovingBackground />
        </div>
        
        <div className="bg-emerald-950/80 backdrop-blur-xl border border-emerald-500/30 rounded-3xl max-w-md w-full p-8 shadow-[0_0_50px_rgba(16,185,129,0.15)] space-y-6 relative z-10">
           <div className="text-center space-y-2">
             <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto text-amber-400 mb-4 border-4 border-amber-500/30 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 4 3 12 5-6 2 6 5-6 3 12"/><path d="M22 20H2"/></svg>
             </div>
             <h2 className="text-3xl font-serif font-bold text-white">{t('live.classResults', 'Class Results')}</h2>
             <p className="text-emerald-200/80">Great job everyone!</p>
           </div>

           <div className="space-y-3 mt-8 max-h-[400px] overflow-y-auto pr-2">
             {leaderboard ? leaderboard.map((l, idx) => (
                <div key={l.childId} className={`flex items-center justify-between p-4 rounded-2xl border ${idx === 0 ? 'bg-gradient-to-r from-amber-500 to-amber-600 border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.3)] transform scale-[1.02]' : 'bg-emerald-900/50 border-emerald-800/50'}`}>
                   <div className="flex items-center gap-3">
                      <span className={`font-black text-lg ${idx === 0 ? 'text-white' : 'text-emerald-500'}`}>#{idx + 1}</span>
                      <span className={`font-bold truncate max-w-[100px] ${idx === 0 ? 'text-white' : 'text-emerald-50'}`}>{l.name}</span>
                   </div>
                   <div className="flex items-center gap-4">
                      <div className="text-right">
                         <div className={`text-[10px] opacity-80 leading-none uppercase font-bold tracking-wider ${idx === 0 ? 'text-amber-100' : 'text-emerald-300/60'}`}>Recite</div>
                         <div className={`font-bold ${idx === 0 ? 'text-white' : 'text-emerald-50'}`}>{l.recitationScore}</div>
                      </div>
                      <div className="text-right">
                         <div className={`text-[10px] opacity-80 leading-none uppercase font-bold tracking-wider ${idx === 0 ? 'text-amber-100' : 'text-emerald-300/60'}`}>Engage</div>
                         <div className={`font-bold ${idx === 0 ? 'text-white' : 'text-emerald-50'}`}>{l.participationScore}</div>
                      </div>
                      <div className={`font-black text-2xl ml-2 px-3 py-1 rounded-lg border ${idx === 0 ? 'bg-amber-400 text-amber-900 border-amber-300' : 'bg-emerald-800 text-emerald-300 border-emerald-700/50'}`}>
                         {l.total}
                      </div>
                   </div>
                </div>
             )) : (
                <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-emerald-400" /></div>
             )}
           </div>

           <button onClick={() => { setShowLeaderboard(false); handleExitSession(); }} className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#022c22] py-4 rounded-xl font-bold mt-6 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]">
             Close Class
           </button>
        </div>
      </div>
    );
  }

  // RENDER: ACTIVE SESSION (Quran View)
  if (currentSession) {
    const hasPosition = currentSession.currentSurah && currentSession.currentAyah;
    const isMyTurn = userRole === 'parent' && batchState?.activeChildId === currentSession.childId;
    const isObserving = userRole === 'parent' && batchState?.activeChildId && !isMyTurn;

    // Reset recite flag if turn changes
    if (!isMyTurn && hasStartedReciting) {
        setHasStartedReciting(false);
    }

    return (
      <div className="fixed inset-0 z-[1000] bg-[#022c22] flex flex-col animate-in fade-in duration-300 overflow-hidden font-sans">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-teal-900/40 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-900/30 rounded-full blur-[150px]" />
          <MovingBackground />
        </div>
        
        {/* Scholar Control Panel (Fixed Bottom Dock) */}
        {userRole === 'scholar' && currentSession?.batchId && (
          <div className="fixed bottom-0 left-0 right-0 z-[5000] bg-[#022c22] border-t border-emerald-800 shadow-[0_-15px_40px_rgba(0,0,0,0.5)]">
            <div className="max-w-7xl mx-auto flex flex-col w-full relative">
               
               {/* Status & End Button Row */}
               <div className="flex justify-between items-center px-4 py-2 border-b border-emerald-900/50 bg-emerald-950">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Monitoring
                  </span>
                  <button 
                     onClick={() => setConfirmEndClass(currentSession.batchId!)} 
                     className="bg-red-500 hover:bg-red-400 text-white px-4 py-1.5 rounded-lg text-xs font-black tracking-wider shadow-[0_2px_10px_rgba(239,68,68,0.4)] transition-all flex items-center gap-1 active:scale-95"
                  >
                     <LogOut size={12} /> END CLASS & RESULTS
                  </button>
               </div>

               {/* Student Horizontal Scroll Frame */}
               <div className="flex gap-4 overflow-x-auto hide-scrollbar px-4 py-3 items-end">
                 {activeSessions.length === 0 && (
                   <div className="text-emerald-500/50 text-xs py-4 italic w-full text-center">Waiting for students to join...</div>
                 )}
                 {activeSessions.map(session => (
                   <div 
                     key={session._id} 
                     onClick={() => handleSetTurn(session.childId, session.batchId!)}
                     className={`p-3 rounded-2xl flex flex-col items-center justify-center shrink-0 cursor-pointer min-w-[130px] transition-all duration-200 ${batchState?.activeChildId === session.childId ? 'bg-amber-400 text-emerald-950 border border-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.3)] scale-[1.02]' : 'bg-emerald-900/40 text-emerald-100 border border-emerald-800/40 hover:bg-emerald-800'}`}
                   >
                     <div className="flex items-center gap-2 mb-1 w-full justify-center">
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${batchState?.activeChildId === session.childId ? 'bg-emerald-950 text-amber-400' : 'bg-emerald-800 text-emerald-300 shadow-inner'}`}>
                         {session.childId[0].toUpperCase()}
                       </div>
                       <span className="font-bold text-sm truncate max-w-[80px]">{session.studentName || 'Student'}</span>
                     </div>
                     
                     {batchState?.activeChildId === session.childId ? (
                        <div className="flex flex-col gap-[6px] mt-2 w-full" onClick={e => e.stopPropagation()}>
                          
                          {/* OVERVIEW OF OBSERVERS */}
                          <div className="bg-emerald-950/60 rounded-xl p-2 border border-emerald-800/40 shadow-inner">
                            <p className="text-[8px] text-emerald-300/80 font-bold uppercase tracking-widest mb-1 text-center">Class Observations</p>
                            <div className="flex justify-evenly items-center w-full px-1">
                              <span className="text-[10px] font-bold text-green-400 flex items-center gap-1"><CheckCircle size={10}/> {batchState?.currentPromptAnswers?.filter(a => a.answer === 'yes').length || 0}</span>
                              <span className="text-gray-600">|</span>
                              <span className="text-[10px] font-bold text-red-400 flex items-center gap-1"><Lock size={10}/> {batchState?.currentPromptAnswers?.filter(a => a.answer === 'no').length || 0}</span>
                            </div>
                            
                            {!batchState?.promptEvaluated ? (
                              <div className="flex gap-1 mt-1.5">
                                <button onClick={() => handleEvaluatePrompt('yes')} className="flex-1 bg-green-500/20 hover:bg-green-500/40 text-green-300 py-1 rounded text-[9px] font-black border border-green-500/30 transition-colors uppercase">Perfect</button>
                                <button onClick={() => handleEvaluatePrompt('no')} className="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-300 py-1 rounded text-[9px] font-black border border-red-500/30 transition-colors uppercase">Mistake</button>
                              </div>
                            ) : (
                              <div className="text-center text-[9px] font-bold text-emerald-400 mt-1.5 uppercase tracking-widest bg-emerald-900/40 py-0.5 rounded">Evaluated</div>
                            )}
                          </div>
     
                          <div className="grid grid-cols-2 gap-1 w-full mt-1">
                            <button onClick={() => setSelectedScore(3)} className={`py-1.5 flex items-center justify-center rounded-lg text-[9px] text-white font-black transition-all ${selectedScore === 3 ? 'bg-green-600 ring-1 ring-white shadow-md' : 'bg-green-500 hover:bg-green-400'}`}>+20 XP</button>
                            <button onClick={() => setSelectedScore(2)} className={`py-1.5 flex items-center justify-center rounded-lg text-[9px] text-white font-black transition-all ${selectedScore === 2 ? 'bg-amber-600 ring-1 ring-white shadow-md' : 'bg-amber-500 hover:bg-amber-400'}`}>+15 XP</button>
                            <button onClick={() => setSelectedScore(1)} className={`py-1.5 flex items-center justify-center rounded-lg text-[9px] text-white font-black transition-all ${selectedScore === 1 ? 'bg-orange-600 ring-1 ring-white shadow-md' : 'bg-orange-500 hover:bg-orange-400'}`}>+10 XP</button>
                            <button onClick={() => setSelectedScore(0)} className={`py-1.5 flex items-center justify-center rounded-lg text-[9px] text-white font-black transition-all ${selectedScore === 0 ? 'bg-red-600 ring-1 ring-white shadow-md' : 'bg-red-500 hover:bg-red-400'}`}>+5 XP</button>
                          </div>
     
                          {selectedScore !== null && (
                             <button 
                               onClick={() => {
                                 handleScoreRecitation(session.childId, session.batchId!, selectedScore);
                                 setSelectedScore(null);
                               }}
                               className="w-full mt-1 bg-white hover:bg-emerald-50 text-emerald-950 py-2 rounded-xl text-[10px] font-black shadow-lg border-2 border-emerald-500 transition-all uppercase tracking-widest active:scale-95"
                             >
                               Submit Score
                             </button>
                          )}
                        </div>
                       ) : (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/70 mt-2 bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-800/30">Observer</span>
                       )}
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        <div className="relative z-10 bg-emerald-900 text-white p-4 flex justify-between items-center shadow-lg shrink-0">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <BookOpen size={20} />
              {userRole === 'scholar' ? t('live.monitoringSession') : t('live.liveClassroom', 'Live Classroom')}
            </h2>
            {userRole === 'scholar' && currentSession && (
              <p className="text-xs text-emerald-300">Viewing Student: <span className="font-bold text-white">{currentSession.studentName || currentSession.childId}</span></p>
            )}
          </div>
          <button
            onClick={handleExitSession}
            className="bg-emerald-800 hover:bg-emerald-700 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
          >
            <LogOut size={16} /> {t('live.exit')}
          </button>
        </div>

        {/* Floating Student Gamification Status */}
        {userRole === 'parent' && activeChild && (
          <div className="absolute top-[80px] right-4 z-[60] flex flex-col gap-2 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-emerald-100 flex items-center gap-3 animate-in fade-in slide-in-from-right-8 duration-500">
               <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold shadow-inner">
                 <Star size={14} fill="currentColor" />
               </div>
               <div className="pointer-events-auto">
                 <p className="text-[9px] font-black uppercase tracking-widest text-emerald-800/60">Current XP</p>
                 <p className="font-serif font-bold text-emerald-900 text-sm leading-none mt-0.5">
                    {activeChild.child_progress?.[0]?.total_xp || 0}
                 </p>
               </div>
            </div>
            
            <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xl border border-amber-100 flex items-center gap-3 animate-in fade-in slide-in-from-right-8 duration-700 delay-100">
               <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold shadow-inner">
                 <Cloud size={14} fill="currentColor" />
               </div>
               <div className="pointer-events-auto">
                 <p className="text-[9px] font-black uppercase tracking-widest text-amber-800/60">Level</p>
                 <p className="font-serif font-bold text-amber-900 text-sm leading-none mt-0.5">
                    {activeChild.child_progress?.[0]?.level || 1}
                 </p>
               </div>
            </div>
          </div>
        )}

        {/* Student Turn Banner */}
        {isMyTurn && (
          <div className="relative z-10 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-emerald-950 font-black px-6 py-4 flex items-center justify-center gap-3 shadow-md border-b-4 border-amber-500 animate-in slide-in-from-top shrink-0">
             <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
             <span className="tracking-widest uppercase text-xl">Your Turn To Recite</span>
          </div>
        )}

        <div className={`relative z-10 flex-1 overflow-y-auto flex flex-col bg-transparent ${userRole === 'scholar' ? 'pb-72' : ''}`}>
          {!hasPosition && userRole === 'scholar' ? (
            <div className="absolute inset-0 flex items-center justify-center bg-transparent">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <BookOpen className="text-emerald-100" />
                </div>
                <h3 className="font-bold text-white">{t('live.studentSelecting', 'Student is selecting Ayah...')}</h3>
                <p className="text-sm text-emerald-200">{t('live.quranViewAppear', 'Quran view will appear soon.')}</p>
              </div>
            </div>
          ) : userRole === 'parent' && !isMyTurn ? (
            <div className="absolute inset-0 flex flex-col items-center justify-start bg-transparent overflow-y-auto">
               <div className="w-full bg-[#022c22]/50 backdrop-blur-md border-b border-emerald-800/50 text-white p-8 md:p-12 shadow-xl relative overflow-hidden shrink-0">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-800 rounded-full blur-3xl opacity-30 translate-y-1/2 -translate-x-1/4" />
                  
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 mb-6 rounded-full bg-emerald-800/50 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.3)] ring-4 ring-emerald-700">
                       <BookOpen className="text-emerald-300" size={32} />
                    </div>
                    <h3 className="font-serif text-3xl md:text-4xl font-bold text-white mb-3">Live Session Active</h3>
                    <p className="text-emerald-200/80 max-w-md mx-auto text-sm md:text-base leading-relaxed">
                       A classmate is currently reciting. Listen carefully, as you'll be prompted to evaluate them soon!
                    </p>
                  </div>
               </div>

               <div className="w-full max-w-2xl px-4 py-8 md:py-12 flex-1 pb-40">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="font-bold text-xl text-white flex items-center gap-2">
                       <Trophy className="text-amber-500" size={24} /> 
                       Live Leaderboard
                    </h4>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Live
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                     {leaderboard && leaderboard.length > 0 ? leaderboard.map((l, idx) => (
                        <div key={l.childId} className="flex items-center justify-between p-4 rounded-2xl bg-emerald-950/40 backdrop-blur-md shadow-sm border border-emerald-800/50 hover:border-emerald-500/50 transition-all">
                           <div className="flex items-center gap-4">
                              <span className="font-black text-lg text-emerald-500 w-6">#{idx + 1}</span>
                              <span className="font-bold text-emerald-50 truncate max-w-[120px]">{l.name}</span>
                           </div>
                           <div className="flex items-center gap-6">
                              <div className="text-right hidden sm:block">
                                 <div className="text-[10px] text-emerald-300/60 font-bold uppercase tracking-wider">Recitation</div>
                                 <div className="font-bold text-emerald-50">{l.recitationScore}</div>
                              </div>
                              <div className="text-right hidden sm:block">
                                 <div className="text-[10px] text-emerald-300/60 font-bold uppercase tracking-wider">Evaluation</div>
                                 <div className="font-bold text-emerald-50">{l.participationScore}</div>
                              </div>
                              <div className="font-black text-xl text-amber-300 bg-amber-500/20 border border-amber-500/30 px-4 py-1.5 rounded-lg w-16 text-center">
                                 {l.total}
                              </div>
                           </div>
                        </div>
                     )) : (
                        <div className="text-center py-12 bg-white/5 backdrop-blur-md rounded-3xl border border-dashed border-emerald-500/30">
                           <Loader2 className="animate-spin mx-auto text-emerald-300 mb-2" size={24} />
                           <p className="text-[10px] font-bold text-emerald-200/60 uppercase tracking-widest mt-2">Compiling Scores...</p>
                        </div>
                     )}
                  </div>
               </div>
            </div>
          ) : userRole === 'parent' && isMyTurn && !hasStartedReciting ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-transparent p-4">
               <div className="bg-emerald-950/80 backdrop-blur-xl p-10 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.15)] border border-emerald-500/30 text-center max-w-md w-full animate-in zoom-in-95 duration-300">
                 <div className="w-20 h-20 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-4 ring-amber-500/20">
                    <Mic size={36} />
                 </div>
                 <h3 className="font-bold text-2xl text-white mb-2">It's Your Turn!</h3>
                 <p className="text-emerald-200/80 mb-8">The Scholar is ready for your recitation.</p>
                 <button onClick={() => setHasStartedReciting(true)} className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white py-4 rounded-xl font-black text-lg shadow-[0_0_20px_rgba(5,150,105,0.4)] transition-all active:scale-95 flex flex-col items-center justify-center gap-1">
                    <span>RECITE NOW</span>
                    <span className="text-[10px] uppercase font-bold text-emerald-100 opacity-80 tracking-widest">Open Quran</span>
                 </button>
               </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col h-full relative">
              <QuranPage
                onBack={handleExitSession}
                sessionCurrentSurah={currentSession.currentSurah}
                sessionCurrentAyah={currentSession.currentAyah}
                onAyahClick={handleAyahClick}
                onPositionChange={userRole === 'scholar' ? undefined : emitPosition}
                readOnly={userRole === 'scholar' || isObserving}
              />
            </div>
          )}

          {/* Student Engagement Prompt */}
          {isObserving && (
            (() => {
              const myAnswer = batchState?.currentPromptAnswers?.find(a => a.childId === currentSession.childId);
              
              if (batchState?.promptEvaluated) {
                 return (
                    <div className="absolute bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[400px] bg-emerald-950/90 text-white backdrop-blur-xl p-5 rounded-3xl shadow-2xl border-4 border-emerald-500/30 z-50 animate-in slide-in-from-bottom text-center">
                       <span className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-2">Evaluated</span>
                       <h4 className="font-bold text-xl text-white">The Scholar has checked the answers!</h4>
                    </div>
                 );
              }

              if (myAnswer) {
                 return (
                    <div className="absolute bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[400px] bg-emerald-950/90 text-white backdrop-blur-xl p-5 rounded-3xl shadow-2xl border-4 border-emerald-500/30 z-50 animate-in slide-in-from-bottom text-center">
                       <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-block mb-2">Answer Submitted</span>
                       <h4 className="font-bold text-xl text-white">Waiting for Scholar...</h4>
                       <p className="text-sm font-bold mt-2 text-emerald-100">You guessed: {myAnswer.answer === 'yes' ? 'Perfect' : 'Mistake'}</p>
                    </div>
                 );
              }

              return (
                <div className="absolute bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[400px] bg-emerald-950/90 text-white backdrop-blur-xl p-5 rounded-3xl shadow-2xl border-4 border-emerald-500/30 z-50 animate-in slide-in-from-bottom">
                  <div className="mb-4">
                    <span className="bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block">Observe & Answer</span>
                    <h4 className="font-bold text-xl text-white leading-tight">Was the recitation correct?</h4>
                    <p className="text-sm text-emerald-200/80 mt-1">Listen to your classmate closely.</p>
                  </div>
                  <div className="flex gap-3 mt-5">
                     <button onClick={() => handleSubmitPrompt('yes')} className="flex-1 bg-green-500 hover:bg-green-600 shadow-green-500/20 shadow-lg text-white py-4 rounded-xl font-bold transition-transform active:scale-95 text-lg">Yes</button>
                     <button onClick={() => handleSubmitPrompt('no')} className="flex-1 bg-red-500 hover:bg-red-600 shadow-red-500/20 shadow-lg text-white py-4 rounded-xl font-bold transition-transform active:scale-95 text-lg">No (Mistake)</button>
                  </div>
                </div>
              );
            })()
          )}

          {userRole === 'scholar' && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full backdrop-blur-md shadow-2xl border border-white/10 z-50">
              <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                {t('live.liveSyncActive')}
              </p>
            </div>
          )}
          
          {confirmEndClass && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <div className="bg-[#022c22]/90 backdrop-blur-xl rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_50px_rgba(239,68,68,0.2)] border border-red-500/30">
                 <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30 shadow-inner">
                   <LogOut size={32} />
                 </div>
                 <h3 className="font-bold text-2xl text-white mb-2">End Session?</h3>
                 <p className="text-emerald-100/80 mb-6 text-sm">Are you sure you want to end this live class? This restricts student access and awards final attendance XP.</p>
                 <div className="flex gap-3">
                   <button onClick={() => setConfirmEndClass(null)} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all">Cancel</button>
                   <button onClick={() => { handleEndClass(confirmEndClass); setConfirmEndClass(null); }} className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-bold py-3 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-all">Yes, End Class</button>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
  // RENDER: LOBBY (Scholar or Parent/Kid)
  return (
    <TarbiyahLobby 
      getToken={getToken} 
      onJoinSession={setCurrentSession} 
      userRole={userRole}
      scholarBatches={scholarBatches}
      onScholarJoinSession={handleScholarJoinBatch}
    />
  );
};

export default LiveClassRoom;
