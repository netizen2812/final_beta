import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { APPLICATION_API_URL } from '../../../lib/api';

export const useClassroomActions = (syncChannelRef: React.MutableRefObject<any>, getToken: () => Promise<string | null>) => {
  const queryClient = useQueryClient();
  
  const handleSetTurn = async (childId: string, batchId: string, surah?: number, ayah?: number) => {
    try {
      const token = await getToken();
      await axios.post(`${APPLICATION_API_URL}/api/live/batch/${batchId}/select-turn`, { 
        activeChildId: childId 
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      // ⚡ INSTANT LOCAL UPDATE: Update React Query cache so Scholar sees Quran immediately
      queryClient.setQueryData(['batchState', batchId, undefined], (old: any) => {
        if (!old) return old;
        return { ...old, activeChildId: childId };
      });
      
      if (syncChannelRef.current) {
        syncChannelRef.current.send({
          type: 'broadcast',
          event: 'turn-assigned',
          payload: { activeChildId: childId, surah, ayah, ts: Date.now() }
        });
      }
    } catch (err) { console.error(err); }
  };

  const handleScoreRecitation = async (childId: string, batchId: string, rating: number, correctAnswer?: 'yes' | 'no') => {
    try {
      const token = await getToken();
      const pointsMap = [0, 2, 5, 7, 10];
      const xpGained = pointsMap[rating] || 0;
      
      await axios.post(`${APPLICATION_API_URL}/api/live/batch/${batchId}/score-recitation`, { 
        childId, score: rating, correctAnswer 
      }, { headers: { Authorization: `Bearer ${token}` } });

      if (syncChannelRef.current) {
        syncChannelRef.current.send({
          type: 'broadcast',
          event: 'score-updated',
          payload: { childId, xpGained, ts: Date.now() }
        });
      }
    } catch (err) { console.error(err); }
  };

  const handleScoreParticipation = async (childId: string, batchId: string) => {
    try {
      const token = await getToken();
      await axios.post(`${APPLICATION_API_URL}/api/live/batch/${batchId}/score-participation`, { 
        childId, points: 2 
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      if (syncChannelRef.current) {
        syncChannelRef.current.send({
          type: 'broadcast',
          event: 'score-updated',
          payload: { childId, xpGained: 2, ts: Date.now() }
        });
      }
    } catch (err) { console.error(err); }
  };

  const handleEvaluatePrompt = async (batchId: string, correctAnswer: 'yes' | 'no') => {
    try {
      const token = await getToken();
      await axios.post(`${APPLICATION_API_URL}/api/live/batch/${batchId}/evaluate-prompt`, { 
        correctAnswer 
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      if (syncChannelRef.current) {
        syncChannelRef.current.send({
          type: 'broadcast',
          event: 'prompt-event',
          payload: { type: 'evaluation', correctAnswer, ts: Date.now() }
        });
      }
    } catch (err) { console.error(err); }
  };

  const handleSubmitPrompt = async (childId: string, batchId: string, answer: 'yes' | 'no') => {
    try {
      const token = await getToken();
      await axios.post(`${APPLICATION_API_URL}/api/live/batch/${batchId}/submit-prompt`, { 
        childId, answer 
      }, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) { console.error(err); }
  };

  const handleEndClass = async (batchId: string) => {
    try {
      const token = await getToken();
      await axios.post(`${APPLICATION_API_URL}/api/live/batch/${batchId}/end`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) { alert("Failed to terminate class. Please retry."); }
  };

  return {
    handleSetTurn,
    handleScoreRecitation,
    handleScoreParticipation,
    handleEvaluatePrompt,
    handleSubmitPrompt,
    handleEndClass
  };
};
