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
  Wifi
} from 'lucide-react';
import { useChildContext } from '../contexts/ChildContext';
import QuranPage from './QuranPage';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-react';

const POSITION_THROTTLE_MS = 500;

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
  const { activeChild } = useChildContext();
  const { getToken } = useAuth();
  const { user } = useUser();

  const [userRole, setUserRole] = useState<'parent' | 'scholar'>('parent');
  const [isLoading, setIsLoading] = useState(false);
  const [scholarStatus, setScholarStatus] = useState<ScholarStatus>({ online: false, scholarName: "Scholar" });
  const [statusLoading, setStatusLoading] = useState(true);

  // Scholar Dashboard State
  const [activeSessions, setActiveSessions] = useState<LiveSession[]>([]);

  // Active Session State
  const [currentSession, setCurrentSession] = useState<LiveSession | null>(null);

  const [accessStatus, setAccessStatus] = useState<{ hasAccess: boolean; pendingRequest: boolean } | null>(null);

  // Determine Role & Check Access
  useEffect(() => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (email && email.toLowerCase() === "scholar1.imam@gmail.com".toLowerCase()) {
      setUserRole('scholar');
    } else {
      setUserRole('parent');
      // Check Access Status
      checkAccess();
    }
  }, [user, getToken]);

  // SCHOLAR DASHBOARD STATE
  const [scholarBatches, setScholarBatches] = useState<any[]>([]);

  // 1. Fetch Scholar's Batches (Once on mount)
  useEffect(() => {
    if (userRole !== 'scholar') return;
    const fetchBatches = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(`${API_BASE}/api/live/my-sessions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setScholarBatches(res.data);
      } catch (err) {
        console.error("Failed to fetch scholar batches", err);
      }
    };
    fetchBatches();
  }, [userRole, getToken]);

  // 2. Poll Active Participants (Every 2s) - Only if we have batches
  useEffect(() => {
    if (userRole !== 'scholar' || scholarBatches.length === 0) return;

    const fetchParticipants = async () => {
      try {
        const token = await getToken();
        let allActiveStudents: LiveSession[] = [];

        // Parallelize for better performance
        const promises = scholarBatches.map(async (batch) => {
          const batchId = batch._id || batch.id;
          try {
            const res = await axios.get(`${API_BASE}/api/live/batch/${batchId}/participants`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const rawData = res.data;
            const participants = Array.isArray(rawData) ? rawData : (rawData.activeParticipants || []);

            return participants.filter((p: any) => p.isActive).map((p: any) => ({
              _id: `${p.childId}-${batchId}`,
              parentId: "unknown",
              childId: p.childId,
              scholarId: "scholar",
              currentSurah: p.currentSurah,
              currentAyah: p.currentAyah,
              lastSeen: p.lastSeen,
              status: 'active',
              studentName: p.childName,
              parentName: `Batch: ${batch.title || batch.name}`,
              batchId: batchId
            }));
          } catch (e) {
            console.error(`Failed to fetch part. for batch ${batchId}`, e);
            return [];
          }
        });

        const results = await Promise.all(promises);
        allActiveStudents = results.flat();

        // Compare with previous to avoid unnecessary re-renders if deep equal?
        // For now, React state setter is fine.
        setActiveSessions(allActiveStudents);

      } catch (err) {
        console.error("Scholar participants polling error", err);
      }
    };

    fetchParticipants();
    const interval = setInterval(fetchParticipants, 2000);
    return () => clearInterval(interval);
  }, [userRole, getToken, scholarBatches]);

  // Scholar viewing a session: merge latest participant position so Quran auto-scrolls
  useEffect(() => {
    if (userRole !== 'scholar' || !currentSession?.childId) return;
    // activeSessions is updated by polling; find this session's participant and sync position
    const match = activeSessions.find((s: LiveSession) => s.childId === currentSession.childId && s.batchId === currentSession.batchId);
    if (match && (match.currentSurah !== currentSession.currentSurah || match.currentAyah !== currentSession.currentAyah)) {
      setCurrentSession(prev => prev ? { ...prev, currentSurah: match.currentSurah, currentAyah: match.currentAyah } : null);
      console.log("[SCHOLAR RENDER] position updated", { surah: match.currentSurah, ayah: match.currentAyah });
    }
  }, [userRole, currentSession?.childId, currentSession?.batchId, activeSessions]);

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

  // POLL: Scholar Status (for parent lobby) - Optional, leaving for now
  useEffect(() => {
    if (userRole === 'parent' && accessStatus?.hasAccess && !currentSession) {
      // ... existing
    }
  }, [userRole, currentSession, accessStatus]);

  // RENDER: LOCKED STATE
  if (userRole === 'parent' && accessStatus && !accessStatus.hasAccess) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-6 animate-in fade-in">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
          <ShieldCheck size={48} />
        </div>
        <h1 className="text-3xl font-serif font-bold text-slate-800">Live Sessions are Locked</h1>
        <p className="text-slate-500 max-w-md mx-auto">
          Access to Live Quran Sessions is currently restricted to approved students only.
          Please request access to join a batch.
        </p>

        {accessStatus.pendingRequest ? (
          <div className="bg-amber-50 text-amber-800 px-6 py-3 rounded-full inline-flex items-center gap-2 font-bold text-sm">
            <Clock size={16} /> Request Pending Approval
          </div>
        ) : (
          <button
            onClick={handleRequestAccess}
            disabled={isLoading}
            className="bg-[#052e16] text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-900 transition-all flex items-center gap-2 mx-auto"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : 'Request Access'}
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

  const handleScholarJoinSession = (session: LiveSession) => {
    setCurrentSession(session);
  };

  const handleExitSession = async () => {
    const sessionToExit = currentSession;
    setCurrentSession(null);
    if (userRole === 'scholar') setActiveSessions([]);

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

  // RENDER: ACTIVE SESSION (Quran View)
  if (currentSession) {
    const hasPosition = currentSession.currentSurah && currentSession.currentAyah;

    return (
      <div className="fixed inset-0 z-[1000] bg-white flex flex-col animate-in fade-in duration-300">
        <div className="bg-emerald-900 text-white p-4 flex justify-between items-center shadow-lg">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <BookOpen size={20} />
              {userRole === 'scholar' ? 'Monitoring Session' : 'Live Quran Session'}
            </h2>
            {userRole === 'scholar' && currentSession && (
              <p className="text-xs text-emerald-300">Student: {currentSession.studentName || currentSession.childId}</p>
            )}
          </div>
          <button
            onClick={handleExitSession}
            className="bg-red-500/80 hover:bg-red-600 text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-all"
          >
            <LogOut size={16} /> Exit
          </button>
        </div>

        <div className="flex-1 overflow-y-auto relative">
          {!hasPosition && userRole === 'scholar' ? (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
              <div className="text-center p-6">
                <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <BookOpen className="text-slate-400" />
                </div>
                <h3 className="font-bold text-slate-700">Student is selecting a Surah...</h3>
                <p className="text-sm text-slate-500">The Quran view will appear once they start reading.</p>
              </div>
            </div>
          ) : (
            <QuranPage
              onBack={handleExitSession}
              sessionCurrentSurah={currentSession.currentSurah}
              sessionCurrentAyah={currentSession.currentAyah}
              onAyahClick={handleAyahClick}
              onPositionChange={userRole === 'scholar' ? undefined : emitPosition}
              readOnly={userRole === 'scholar'}
            />
          )}

          {userRole === 'scholar' && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full backdrop-blur-md shadow-2xl border border-white/10 z-50">
              <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live Sync Active (3s)
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // RENDER: SCHOLAR DASHBOARD
  if (userRole === 'scholar') {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-8 animate-in fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#052e16]">Scholar Dashboard</h1>
            <p className="text-slate-500">Monitor active student recitation sessions.</p>
          </div>
          <div className="bg-emerald-50 text-emerald-800 px-4 py-2 rounded-xl border border-emerald-100 font-bold text-sm flex items-center gap-2">
            <LayoutDashboard size={18} />
            {activeSessions.length} Active Sessions
          </div>
        </div>

        {activeSessions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock size={24} className="text-slate-400" />
            </div>
            <h3 className="text-slate-900 font-bold text-lg">No Active Sessions</h3>
            <p className="text-slate-500 text-sm">Waiting for students to join...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeSessions.map(session => (
              <div key={session._id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-lg">
                    {session.childId ? session.childId[0].toUpperCase() : 'S'}
                  </div>
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">
                    Live
                  </span>
                </div>

                <h3 className="font-bold text-lg text-[#052e16] mb-1">
                  Student: {session.studentName || session.childId}
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">
                  Parent: {session.parentName || 'Unknown'}
                </p>

                <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Current Position</span>
                  </div>
                  <p className="font-bold text-slate-800 mt-1">
                    {session.currentSurah ? `Surah ${session.currentSurah}, Ayah ${session.currentAyah}` : "Selecting..."}
                  </p>
                </div>

                <button
                  onClick={() => handleScholarJoinSession(session)}
                  className="w-full bg-[#052e16] hover:bg-emerald-900 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-transform active:scale-95"
                >
                  Observe Session <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // RENDER: PARENT LOBBY (My Sessions)
  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
            <Users size={12} /> Live Classes
          </div>
          <h1 className="text-4xl font-serif font-bold text-[#052e16]">Live Quran Sessions</h1>
          <p className="text-slate-500 font-medium">Join your active classes or request access to new batches.</p>
        </div>

        {activeChild ? (
          <div className="bg-white px-5 py-3 rounded-2xl border border-emerald-50 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-lg font-black">{activeChild.name[0]}</div>
            <div><p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Student</p><p className="text-sm font-bold text-[#052e16]">{activeChild.name}</p></div>
          </div>
        ) : (
          <div className="bg-amber-50 px-5 py-3 rounded-2xl border border-amber-100 flex items-center gap-3">
            <ShieldCheck size={20} className="text-amber-600" />
            <p className="text-xs font-bold text-amber-800">Select child profile to view schedule.</p>
          </div>
        )}
      </div>

      <UpcomingSessions
        token={getToken}
        activeChildId={activeChild?.id}
        onJoin={setCurrentSession}
      />

    </div>
  );
};

// Sub-Component: My Classes List
const UpcomingSessions = ({ token, activeChildId, onJoin }: { token: any, activeChildId?: string, onJoin: (s: LiveSession) => void }) => {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const t = await token();
        const res = await axios.get(`${API_BASE}/api/live/my-sessions`, {
          headers: { Authorization: `Bearer ${t}` }
        });
        setSessions(res.data);
      } catch (err) {
        console.error("Failed to fetch sessions");
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, [token]);

  const handleJoin = async (batchId: string) => {
    if (!activeChildId) return alert("Select a child first");
    try {
      const t = await token();
      // Try to join/start session for this batch
      const res = await axios.post(`${API_BASE}/api/live/${batchId}/join`, {
        childId: activeChildId
      }, {
        headers: { Authorization: `Bearer ${t}` }
      });
      // The backend 'join' endpoint should return the session object
      // If it returns a session, we're good.
      if (res.data.session) {
        const s = res.data.session;
        // Do NOT default to surah 1 ayah 1 — student is source of truth
        onJoin({
          ...s,
          currentSurah: s.currentSurah ?? undefined,
          currentAyah: s.currentAyah ?? undefined
        });
      } else {
        // Fallback if structure is different
        alert("Joined batch. Please refresh/wait for session.");
      }
    } catch (err: any) {
      // If 403 or error, it might be "Already Joined" - but our backend handles that by returning existing session?
      // Let's check backend logic again.
      // Actually backend `joinBatch` returns { session, message }.
      // If it fails, maybe we should just try to "Start/Get" the session?
      alert(err.response?.data?.message || "Failed to join");
    }
  };

  if (loading) return <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-emerald-600" /></div>;

  if (sessions.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 border border-slate-100 text-center shadow-sm">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <Clock size={24} />
        </div>
        <h3 className="font-bold text-slate-800 text-lg">No Active Classes</h3>
        <p className="text-slate-500 text-sm mt-1">You are not enrolled in any active batches.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {sessions.map(s => (
        <div key={s._id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {s.status}
              </span>
              <span className="text-xs text-slate-400 font-medium">Batch: {s.title}</span>
            </div>
            <h3 className="font-bold text-[#052e16] text-lg">{s.description || s.title}</h3>

          </div>
          <button
            onClick={() => handleJoin(s._id)}
            disabled={s.status === 'ended' || !activeChildId}
            className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 shrink-0 ${s.status !== 'ended'
              ? 'bg-[#052e16] text-white hover:bg-emerald-900 shadow-lg hover:shadow-emerald-900/20'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
          >
            {s.status === 'active' ? 'Join Class' : 'Open Class'}
          </button>
        </div>
      ))}
    </div>
  );
};

export default LiveClassRoom;
