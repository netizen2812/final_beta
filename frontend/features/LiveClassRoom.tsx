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
import { getNumericUid } from '../utils/tarbiyahUtils';
import { QaidaViewer } from './QaidaViewer';
import { APPLICATION_API_URL } from '../lib/api';
import { supabase } from '../lib/supabase';

// Custom Hooks
import { useClassroomSync } from './classroom/hooks/useClassroomSync';
import { useClassroomActions } from './classroom/hooks/useClassroomActions';

// Modular Components
import { ScholarControlPanel } from './classroom/ScholarControlPanel';
import { StudentSpeedDock } from './classroom/StudentSpeedDock';
import { ActiveStudentFocus } from './classroom/ActiveStudentFocus';

const POSITION_THROTTLE_MS = 500;

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

const LiveClassRoom: React.FC = () => {
  const { activeChild, refreshChildren, triggerRewardAnimation } = useChildContext();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { t } = useTranslation();

  const [userRole, setUserRole] = useState<'parent' | 'scholar' | 'loading'>('loading');
  const [tarbiyahIsAdmin, setTarbiyahIsAdmin] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeDrawer, setActiveDrawer] = useState<'students' | 'leaderboard' | 'none'>('none');
  const [currentSession, setCurrentSession] = useState<LiveSession | null>(null);
  const [currentSessionScore, setCurrentSessionScore] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<any[] | null>(null);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean | string>(false);
  const [confirmEndClass, setConfirmEndClass] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [attendedSessionIds, setAttendedSessionIds] = useState<string[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);

  const syncChannelRef = useRef<any>(null);
  const joinedSessionIdRef = useRef<string | null>(null);
  const emitThrottleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emitPendingRef = useRef<{ surah: number; ayah: number } | null>(null);

  // 📡 REF REFS FOR INSTANT SYNC
  const activeStudentSurahRef = useRef<number | undefined>(undefined);
  const activeStudentAyahRef = useRef<number | undefined>(undefined);

  // 1. Core Synchronization Hook (Supabase + React Query)
  const { 
    batchState, 
    activeSessions, 
    qaidaSyncData, 
    showQaidaViewer, 
    setShowQaidaViewer,
    refetchBatchState
  } = useClassroomSync(
    currentSession?.batchId, 
    currentSession?.childId, 
    getToken, 
    userRole,
    (gain) => {
        triggerRewardAnimation(gain);
        setCurrentSessionScore(prev => prev + gain);
    },
    (surah, ayah) => {
      if (userRole === 'parent') {
        setCurrentSession(prev => prev ? { ...prev, currentSurah: surah, currentAyah: ayah } : null);
      }
    }
  );

  // 2. Scholar Action Hook
  const {
    handleSetTurn,
    handleScoreRecitation,
    handleScoreParticipation,
    handleEvaluatePrompt,
    handleEndClass
  } = useClassroomActions(getToken, syncChannelRef);

  // 📡 CHANNEL PERSISTENCE (Needed for broadcasts)
  useEffect(() => {
    if (!currentSession?.batchId) return;
    const channel = supabase.channel(`class-sync:${currentSession.batchId}`);
    syncChannelRef.current = channel;
    return () => { syncChannelRef.current = null; };
  }, [currentSession?.batchId]);

  // Responsive Detection
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine Role & Check Access
  useEffect(() => {
    if (user === undefined) return;
    if (user === null) {
      setUserRole('parent'); // Treats guests as parents
      return;
    }
    const role = user?.publicMetadata?.role;
    const email = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
    const isScholar = role === 'scholar' || email === "scholar1.imam@gmail.com";
    
    setUserRole(isScholar ? 'scholar' : 'parent');
    setTarbiyahIsAdmin(role === 'admin');
  }, [user]);

  // Handle Exit Logic
  const handleExitSession = () => {
    joinedSessionIdRef.current = null;
    setCurrentSession(null);
  };

  const handleScholarJoinSession = async (batch: any) => {
    try {
      const token = await getToken();
      const res = await axios.post(`${APPLICATION_API_URL}/api/live/${batch._id}/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.session) {
        joinedSessionIdRef.current = res.data.session.sessionId || res.data.session._id || null;
        setCurrentSession(res.data.session);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to start live session");
    }
  };

  const emitPosition = useCallback((surahNumber: number, ayahNumber: number) => {
    if (!currentSession?.batchId || userRole === 'scholar') return;
    
    // Broadcast for instant scholar visibility
    if (syncChannelRef.current) {
      syncChannelRef.current.send({
        type: 'broadcast',
        event: 'ayah-change',
        payload: { surah: surahNumber, ayah: ayahNumber, childId: currentSession.childId, ts: Date.now() }
      });
    }

    emitPendingRef.current = { surah: surahNumber, ayah: ayahNumber };
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
      } catch (e) {}
    }, POSITION_THROTTLE_MS);
  }, [currentSession?.batchId, currentSession?.childId, userRole, getToken]);

  const handleAyahClick = async (surah: number, ayah: number) => {
    if (!currentSession || userRole === 'scholar') return;
    setCurrentSession(prev => prev ? { ...prev, currentSurah: surah, currentAyah: ayah } : null);
    emitPosition(surah, ayah);
  };

  // -------------------------------------------------------------------
  // 🎭 RENDER HELPERS
  // -------------------------------------------------------------------

  const activeStudentSurah = useMemo(() => 
    batchState?.activeParticipants?.find(p => p.childId === batchState?.activeChildId)?.currentSurah,
    [batchState?.activeParticipants, batchState?.activeChildId]
  );
  
  const activeStudentAyah = useMemo(() =>
    batchState?.activeParticipants?.find(p => p.childId === batchState?.activeChildId)?.currentAyah,
    [batchState?.activeParticipants, batchState?.activeChildId]
  );

  const renderScholarStage = () => {
    if (!currentSession) return null;
    return (
      <div className="flex flex-col h-full relative overflow-hidden">
        <MovingBackground />
        
        <StudentSpeedDock 
           activeSessions={activeSessions}
           activeChildId={batchState?.activeChildId || null}
           onSetTurn={(cid, bid) => handleSetTurn(cid, bid, activeStudentSurah, activeStudentAyah)}
        />

         <div className="flex-1 relative flex flex-col md:flex-row gap-4 p-4 overflow-hidden z-10">
            <div className={`relative flex-1 bg-black/60 backdrop-blur-xl rounded-[2.5rem] border border-emerald-500/20 shadow-2xl overflow-hidden group transition-all duration-700 ${batchState?.activeChildId ? 'md:flex-[0.4]' : 'md:flex-1'}`}>
               <AgoraVideoPane
                 appId={currentSession.agoraAppId || ""}
                 token={currentSession.agoraToken || ""}
                 channel={currentSession.channel || currentSession.batchId || ""}
                 uid={getNumericUid(user?.id || '')}
                 role="scholar"
                 layout="grid"
                 scholarId={currentSession.scholarId}
               />
               
               <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between gap-3 z-40">
                 <button onClick={() => setShowQaidaViewer(true)} className="px-5 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all backdrop-blur-xl shadow-lg">📖 Qaida</button>
                 <button onClick={() => setConfirmEndClass(currentSession.batchId!)} className="px-6 py-2.5 bg-red-900/30 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all backdrop-blur-xl">End Class</button>
               </div>
            </div>

            <ActiveStudentFocus 
               activeChildId={batchState?.activeChildId || null}
               activeStudentSurah={activeStudentSurah}
               activeStudentAyah={activeStudentAyah}
            />

            {!isMobile && (
              <ScholarControlPanel 
                activeChildId={batchState?.activeChildId || null}
                batchId={currentSession.batchId!}
                activeSessions={activeSessions}
                batchState={batchState}
                onScoreRecitation={handleScoreRecitation}
                onScoreParticipation={handleScoreParticipation}
                onEvaluatePrompt={(decision) => handleEvaluatePrompt(currentSession.batchId!, decision)}
                onShowAssignModal={() => setShowAssignModal(true)}
              />
            )}
         </div>
         
         {isMobile && (
           <ScholarControlPanel 
             activeChildId={batchState?.activeChildId || null}
             batchId={currentSession.batchId!}
             activeSessions={activeSessions}
             batchState={batchState}
             onScoreRecitation={handleScoreRecitation}
             onScoreParticipation={handleScoreParticipation}
             onEvaluatePrompt={(decision) => handleEvaluatePrompt(currentSession.batchId!, decision)}
             onShowAssignModal={() => setShowAssignModal(true)}
             isMobile
           />
         )}
      </div>
    );
  };

  const renderRecitationStage = () => {
    if (!currentSession) return null;
    return (
      <div className="flex flex-col h-full relative overflow-hidden">
        <div className="absolute inset-0 bg-[#011a11] pointer-events-none" />
        <div className="relative z-20 px-6 pt-4 pb-2 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30"><Mic size={20} /></div>
              <div>
                 <h3 className="text-white font-serif font-bold text-base mb-0.5">Live Recitation</h3>
                 <p className="text-emerald-400/60 text-[10px] font-bold uppercase tracking-widest">Scholar is listening</p>
              </div>
           </div>
           <div className="bg-[#022c22]/80 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-emerald-700/30 flex flex-col items-center">
              <span className="text-[8px] text-emerald-400/50 uppercase font-black">Class Points</span>
              <span className="text-xl font-black text-emerald-400">{currentSessionScore}</span>
           </div>
        </div>

        <div className="flex-1 min-h-0 relative px-4 pb-4 z-10">
           <div id="student-quran-container" className="w-full h-full rounded-[2.5rem] overflow-y-auto" style={{ background: '#fdfaf3' }}>
              <QuranPage
                onBack={handleExitSession}
                sessionCurrentSurah={currentSession.currentSurah}
                sessionCurrentAyah={currentSession.currentAyah}
                onAyahClick={handleAyahClick}
                onPositionChange={emitPosition}
                readOnly={false}
                scrollContainerId="student-quran-container"
              />
              <div className="absolute top-8 right-8 w-44 md:w-64 aspect-video z-30 rounded-3xl overflow-hidden border border-emerald-900/40">
                 <AgoraVideoPane appId={currentSession.agoraAppId || ""} token={currentSession.agoraToken || ""} channel={currentSession.channel || currentSession.batchId || ""} uid={getNumericUid(user?.id || '')} role="student" layout="inset" scholarId={currentSession.scholarId} />
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
        <MovingBackground />
        <div className="relative z-20 px-6 pt-4 pb-2 flex items-center justify-between">
           <div className="flex flex-col"><h3 className="text-white font-serif font-bold text-lg mb-1">Focus & Learn 🌟</h3><p className="text-emerald-400/80 text-xs">Listen closely to your classmate.</p></div>
           {leaderboard && <button onClick={() => setActiveDrawer('leaderboard')} className="flex items-center gap-3 px-5 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl"><Trophy size={16} className="text-amber-400" /><span className="text-[10px] font-black text-amber-400 uppercase">Leaderboard</span></button>}
        </div>
        <div className="flex-1 px-4 pb-4 flex flex-col md:flex-row gap-4 overflow-hidden z-10">
           <div className="flex-[3] bg-black/60 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border border-emerald-800/30">
              <AgoraVideoPane appId={currentSession.agoraAppId || ""} token={currentSession.agoraToken || ""} channel={currentSession.channel || currentSession.batchId || ""} uid={getNumericUid(user?.id || '')} role="student" layout="spotlight" scholarId={currentSession.scholarId} />
           </div>
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

  if (currentSession) {
    return (
      <div className="fixed inset-0 z-[1000] flex flex-col font-sans text-white overflow-hidden" style={{ background: '#011a11' }}>
        <div className="flex-none h-14 bg-[#022c22]/70 backdrop-blur-3xl border-b border-emerald-800/40 px-6 flex items-center justify-between z-50 relative">
          <div className="flex items-center gap-2">
             {(userRole === 'scholar') && (
               <button onClick={() => setConfirmEndClass(currentSession.batchId!)} className="flex items-center gap-2 bg-red-900/30 text-red-400 px-4 py-2 rounded-xl text-[9px] font-black uppercase">End Class</button>
             )}
             <button onClick={handleExitSession} className="flex items-center gap-2 bg-white/5 text-emerald-200/60 px-4 py-2 rounded-xl text-[9px] font-black uppercase">Exit</button>
          </div>
        </div>
        <div className="flex-1 relative overflow-hidden z-10">{renderMainStage()}</div>

        {showAssignModal && currentSession?.batchId && (
          <div className="fixed inset-0 z-[6000] bg-[#011a11]/95 backdrop-blur-3xl flex items-center justify-center p-6">
             <div className="w-full max-w-6xl h-[90vh] bg-[#022c22] rounded-[3rem] overflow-y-auto p-4"><ScholarQuranManager batchId={currentSession.batchId} batchName="Curriculum" onClose={() => setShowAssignModal(false)} /></div>
          </div>
        )}

        {confirmEndClass && (
          <div className="fixed inset-0 z-[7000] bg-[#011a11]/90 backdrop-blur-3xl flex items-center justify-center p-8">
            <div className="bg-[#022c22] border border-red-500/20 rounded-[3rem] p-12 max-w-md w-full text-center">
               <h3 className="text-2xl font-bold mb-4">End the Session?</h3>
               <div className="flex gap-3">
                 <button onClick={() => setConfirmEndClass(null)} className="flex-1 border py-4 rounded-2xl">Stay Live</button>
                 <button onClick={() => { handleEndClass(confirmEndClass); setConfirmEndClass(null); handleExitSession(); }} className="flex-1 bg-red-500 py-4 rounded-2xl">End Session</button>
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
      onJoinSession={(session) => { joinedSessionIdRef.current = session?.sessionId || session?._id || null; setCurrentSession(session); }} 
      onScholarJoinSession={handleScholarJoinSession}
      userRole={userRole as 'parent' | 'scholar'}
      attendedSessionIds={attendedSessionIds}
      attendanceHistory={attendanceHistory}
      isAdmin={tarbiyahIsAdmin}
      selectedBatchId={selectedBatchId}
      setSelectedBatchId={setSelectedBatchId}
    />
  );
};

export default LiveClassRoom;
