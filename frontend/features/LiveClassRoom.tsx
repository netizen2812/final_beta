import React, { useState, useEffect } from 'react';
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

  // Determine Role
  useEffect(() => {
    const email = user?.primaryEmailAddress?.emailAddress;
    if (email && email.toLowerCase() === "scholar1.imam@gmail.com".toLowerCase()) {
      setUserRole('scholar');
    } else {
      setUserRole('parent');
    }
  }, [user]);

  // POLL: Scholar Status (for parent lobby)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (userRole === 'parent' && !currentSession) {
      const fetchStatus = async () => {
        try {
          const token = await getToken();
          const res = await axios.get(`${API_BASE}/api/live/scholar/status`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setScholarStatus(res.data);
        } catch (err) {
          setScholarStatus({ online: false, scholarName: "Scholar" });
        } finally {
          setStatusLoading(false);
        }
      };
      fetchStatus();
      interval = setInterval(fetchStatus, 10000); // Check every 10s
    }
    return () => clearInterval(interval);
  }, [userRole, currentSession, getToken]);

  // POLL: Scholar Dashboard List
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (userRole === 'scholar' && !currentSession) {
      const fetchSessions = async () => {
        try {
          const token = await getToken();
          const res = await axios.get(`${API_BASE}/api/live/scholar/sessions`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setActiveSessions(res.data.sessions || []);
        } catch (err) {
          console.error("Failed to fetch scholar sessions", err);
        }
      };
      fetchSessions();
      interval = setInterval(fetchSessions, 3000);
    }
    return () => clearInterval(interval);
  }, [userRole, currentSession, getToken]);

  // POLL: Active Session Sync
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentSession) {
      const syncSession = async () => {
        try {
          const token = await getToken();
          const res = await axios.get(`${API_BASE}/api/live/${currentSession._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const updatedSession = res.data;
          if (updatedSession.status === 'ended') {
            setCurrentSession(null);
            return;
          }
          setCurrentSession(updatedSession);
        } catch (err: any) {
          if (err.response?.status === 404) {
            setCurrentSession(null);
          } else {
            console.error("Sync failed", err);
          }
        }
      };
      interval = setInterval(syncSession, 2000);
    }
    return () => clearInterval(interval);
  }, [currentSession?._id, getToken]);

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

  const handleExitSession = () => {
    setCurrentSession(null);
    if (userRole === 'scholar') setActiveSessions([]);
  };

  const handleAyahClick = async (surah: number, ayah: number) => {
    if (!currentSession) return;
    if (userRole === 'scholar') return;

    setCurrentSession(prev => prev ? { ...prev, currentSurah: surah, currentAyah: ayah } : null);

    try {
      const token = await getToken();
      await axios.patch(`${API_BASE}/api/live/${currentSession._id}`, {
        surah, ayah
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to update ayah", err);
    }
  };

  // RENDER: ACTIVE SESSION (Quran View)
  if (currentSession) {
    return (
      <div className="fixed inset-0 z-[1000] bg-white flex flex-col animate-in fade-in duration-300">
        <div className="bg-emerald-900 text-white p-4 flex justify-between items-center shadow-lg">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <BookOpen size={20} />
              {userRole === 'scholar' ? 'Monitoring Session' : 'Live Quran Session'}
            </h2>
            {userRole === 'scholar' && (
              <p className="text-xs text-emerald-300">Student: {currentSession.childId}</p>
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
          <QuranPage
            onBack={handleExitSession}
            sessionCurrentSurah={currentSession.currentSurah}
            sessionCurrentAyah={currentSession.currentAyah}
            onAyahClick={handleAyahClick}
            readOnly={userRole === 'scholar'}
          />

          {userRole === 'scholar' && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full backdrop-blur-md shadow-2xl border border-white/10 z-50">
              <p className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Live Sync Active
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
                  Student: {session.childId}
                </h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-6">
                  Parent: {session.parentName || 'Unknown'}
                </p>

                <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Current Position</span>
                  </div>
                  <p className="font-bold text-slate-800 mt-1">
                    Surah {session.currentSurah}, Ayah {session.currentAyah}
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

  // RENDER: PARENT LOBBY
  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
            <Users size={12} /> Live 1-on-1
          </div>
          <h1 className="text-4xl font-serif font-bold text-[#052e16]">Live Quran Session</h1>
          <p className="text-slate-500 font-medium">Start a synchronized reading session with your scholar.</p>
        </div>

        {activeChild ? (
          <div className="bg-white px-5 py-3 rounded-2xl border border-emerald-50 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white text-lg font-black">{activeChild.name[0]}</div>
            <div><p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Reading for</p><p className="text-sm font-bold text-[#052e16]">{activeChild.name}</p></div>
          </div>
        ) : (
          <div className="bg-amber-50 px-5 py-3 rounded-2xl border border-amber-100 flex items-center gap-3">
            <ShieldCheck size={20} className="text-amber-600" />
            <p className="text-xs font-bold text-amber-800">Select child profile to start.</p>
          </div>
        )}
      </div>

      {/* Scholar Status Card */}
      <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl border font-medium text-sm transition-all ${statusLoading ? 'bg-slate-50 border-slate-100 text-slate-400' :
        scholarStatus.online ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
          'bg-red-50 border-red-100 text-red-700'
        }`}>
        {statusLoading ? (
          <Loader2 size={18} className="animate-spin text-slate-400" />
        ) : scholarStatus.online ? (
          <Wifi size={18} className="text-emerald-600" />
        ) : (
          <WifiOff size={18} className="text-red-500" />
        )}
        <div>
          <p className="font-bold">
            {statusLoading ? 'Checking scholar availability...' :
              scholarStatus.online ? `${scholarStatus.scholarName} is Online` :
                `${scholarStatus.scholarName} is Currently Offline`}
          </p>
          {!statusLoading && !scholarStatus.online && (
            <p className="text-xs opacity-70 mt-0.5">You can still start a session — the scholar will join when available.</p>
          )}
          {!statusLoading && scholarStatus.online && scholarStatus.activeSessions! > 0 && (
            <p className="text-xs opacity-70 mt-0.5">{scholarStatus.activeSessions} active session(s) in progress</p>
          )}
        </div>
        {!statusLoading && (
          <div className={`ml-auto w-2.5 h-2.5 rounded-full ${scholarStatus.online ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
        )}
      </div>

      <div className="bg-white rounded-[3rem] p-12 border border-emerald-50 shadow-sm text-center space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-[#0D4433] to-emerald-400" />

        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-[#0D4433]">
          <BookOpen size={48} />
        </div>

        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-[#052e16] mb-4">Ready to Recite?</h2>
          <p className="text-slate-500">
            Start a live session. The scholar will be notified and can monitor your progress in real-time.
            Click on any Ayah to sync your position.
          </p>
        </div>

        <button
          disabled={isLoading || !activeChild}
          onClick={handleParentStartSession}
          className={`mx-auto px-10 py-4 rounded-xl font-bold uppercase tracking-widest text-sm shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center gap-3 ${!activeChild ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-[#052e16] text-white hover:bg-emerald-900'}`}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <><Users size={18} /> Start Live Session</>}
        </button>

        {!activeChild && (
          <p className="text-xs text-red-500 mt-4 font-bold">Please select a child profile from the sidebar/header first.</p>
        )}
      </div>
    </div>
  );
};

export default LiveClassRoom;
