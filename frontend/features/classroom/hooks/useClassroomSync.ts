import { useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { supabase } from '../../../lib/supabase';
import { APPLICATION_API_URL } from '../../../lib/api';

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
  currentPromptAnswers?: any[];
  promptEvaluated?: boolean;
  activeParticipants?: ActiveParticipant[];
  pastSessions?: any[];
  currentScore?: number;
}

export const useClassroomSync = (
  batchId: string | undefined, 
  childId: string | undefined, 
  getToken: () => Promise<string | null>,
  userRole: string,
  onXpGain?: (amount: number) => void,
  onSync?: (surah: number, ayah: number) => void
) => {
  const queryClient = useQueryClient();
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [qaidaSyncData, setQaidaSyncData] = useState({ language: 'english', pageNumber: 1 });
  const [showQaidaViewer, setShowQaidaViewer] = useState(false);
  const lastSeenScoreRef = useRef<number | null>(null);
  const lastSyncTsRef = useRef<number>(0);
  const activeChildIdRef = useRef<string | null>(null);

  // 1. Fetch Batch State using React Query
  const { data: batchState, refetch: refetchBatchState } = useQuery({
    queryKey: ['batchState', batchId, childId],
    queryFn: async () => {
      if (!batchId) return null;
      const token = await getToken();
      const res = await axios.get(`${APPLICATION_API_URL}/api/live/batch/${batchId}/state?childId=${childId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data as BatchState;
    },
    enabled: !!batchId,
    refetchInterval: 15000, // 15s Fallback Heartbeat
  });

  // Track XP and Deduplicate Participants
  useEffect(() => {
    if (!batchState) return;

    // XP Animation Handling for Students
    if (userRole === 'parent' && batchState.currentScore !== undefined) {
      const newScore = batchState.currentScore;
      if (lastSeenScoreRef.current !== null && newScore > lastSeenScoreRef.current) {
        onXpGain?.(newScore - lastSeenScoreRef.current);
      }
      lastSeenScoreRef.current = newScore;
    }

    // Scholar-side Deduplication
    if (batchState.activeParticipants && userRole === 'scholar') {
      const uniqueP = Array.from(new Map(
        batchState.activeParticipants
          .filter(p => p.isActive)
          .map(p => [p.childId.toString(), p])
      ).values());
      
      setActiveSessions(uniqueP.map(p => ({
        _id: `${p.childId}-${batchId}`,
        childId: p.childId,
        studentName: p.childName || 'Student',
        batchId,
        currentSurah: p.currentSurah,
        currentAyah: p.currentAyah,
        status: 'active'
      })));
    }

    activeChildIdRef.current = batchState.activeChildId;
  }, [batchState, userRole, batchId, onXpGain]);

  // 2. Real-time Sync (Supabase)
  useEffect(() => {
    if (!batchId) return;

    const channel = supabase.channel(`class-sync:${batchId}`, {
      config: { broadcast: { ack: false } }
    })
    .on('broadcast', { event: 'ayah-change' }, ({ payload }) => {
      // 🛡️ Scholar side performance: Only follow if the update comes from the active student
      if (userRole === 'scholar' && payload.childId === activeChildIdRef.current && payload.ts > lastSyncTsRef.current) {
        lastSyncTsRef.current = payload.ts;
        queryClient.setQueryData(['batchState', batchId, childId], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            activeParticipants: old.activeParticipants?.map((p: any) =>
              p.childId === payload.childId
              ? { ...p, currentSurah: payload.surah, currentAyah: payload.ayah }
              : p
            )
          };
        });
      }
    })
    .on('broadcast', { event: 'turn-assigned' }, ({ payload }) => {
      // ⚡ Update local state instantly when turn is assigned (for both scholar and student)
      if (payload.ts > lastSyncTsRef.current) {
        lastSyncTsRef.current = payload.ts;
        queryClient.setQueryData(['batchState', batchId, childId], (old: any) => {
          if (!old) return old;
          return { ...old, activeChildId: payload.activeChildId };
        });

        // If it's my turn as a student, sync to the specified surah/ayah
        if (userRole === 'parent' && payload.activeChildId === childId && payload.surah) {
          onSync?.(payload.surah, payload.ayah);
        }
      }
    })
    .on('broadcast', { event: 'qaida-sync' }, ({ payload }) => {
      if (payload.isOpen !== undefined) setShowQaidaViewer(payload.isOpen);
      if (payload.language && payload.pageNumber) {
        setQaidaSyncData({ language: payload.language, pageNumber: payload.pageNumber });
      }
    })
    .on('broadcast', { event: 'score-updated' }, ({ payload }) => {
      if (userRole === 'parent' && payload.childId === childId) {
        onXpGain?.(payload.xpGained);
        queryClient.setQueryData(['batchState', batchId, childId], (old: any) => {
           if (!old) return old;
           return { ...old, currentScore: (old.currentScore || 0) + payload.xpGained };
        });
      }
    })
    // ⚡ Handshake: Scholar responds to sync requests
    .on('broadcast', { event: 'sync-request' }, () => {
      if (userRole === 'scholar' && batchState?.activeChildId) {
        const activeStudent = batchState.activeParticipants?.find(p => p.childId === batchState.activeChildId);
        channel.send({
          type: 'broadcast',
          event: 'current-state',
          payload: {
            activeChildId: batchState.activeChildId,
            surah: activeStudent?.currentSurah,
            ayah: activeStudent?.currentAyah,
            ts: Date.now()
          }
        });
      }
    })
    // ⚡ Handshake: Student receives current state from scholar
    .on('broadcast', { event: 'current-state' }, ({ payload }) => {
      if (userRole === 'parent' && payload.ts > lastSyncTsRef.current) {
        lastSyncTsRef.current = payload.ts;
        queryClient.setQueryData(['batchState', batchId, childId], (old: any) => {
           if (!old) return old;
           return { ...old, activeChildId: payload.activeChildId };
        });
        
        // ⚡ Trigger local jump if it's my turn
        if (payload.activeChildId === childId && payload.surah) {
          onSync?.(payload.surah, payload.ayah);
        }
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED' && userRole === 'parent') {
        // 🆕 Student broadcasts a sync request upon connection to align instantly
        channel.send({
          type: 'broadcast',
          event: 'sync-request',
          payload: { ts: Date.now() }
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [batchId, childId, userRole, queryClient, onXpGain]);

  return {
    batchState,
    activeSessions,
    qaidaSyncData,
    showQaidaViewer,
    setShowQaidaViewer,
    refetchBatchState
  };
};
