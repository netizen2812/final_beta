
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Child, ChildProgress } from '../types';
import { childService } from '../services/childService';
import { useAuth } from '@clerk/clerk-react';

interface ChildContextType {
  children: Child[];
  activeChild: Child | null;
  loading: boolean;
  addChild: (payload: Partial<Child>) => void;
  updateChild: (updatedChild: Child) => void;
  deleteChild: (id: string) => void;
  setActiveChild: (id: string) => void;
  incrementProgress: (childId: string, xpGain: number) => void;
  refreshChildren: () => Promise<void>;
  lastReward: { amount: number, id: number } | null;
  triggerRewardAnimation: (amount: number) => void;
  updateLocalProgress: (childId: string, xpGain: number) => void;
}

const ChildContext = createContext<ChildContextType | undefined>(undefined);

const STORAGE_KEY_CHILDREN = 'imam_children_data';
const STORAGE_KEY_ACTIVE = 'imam_active_child_id';

export const ChildProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastReward, setLastReward] = useState<{ amount: number; id: number } | null>(null);
  const { getToken } = useAuth(); // Need auth for API calls

  // Load from Backend on Mount
  useEffect(() => {
    const fetchChildren = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        if (token) {
          const data = await childService.getChildren(getToken);
          setChildrenList(data);
        }
      } catch (error) {
        console.error("Failed to fetch children", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [getToken]);

  // Persist Active Child ID only
  useEffect(() => {
    const savedActiveId = localStorage.getItem(STORAGE_KEY_ACTIVE);
    if (savedActiveId) setActiveChildId(savedActiveId);
  }, []);

  useEffect(() => {
    if (activeChildId) {
      localStorage.setItem(STORAGE_KEY_ACTIVE, activeChildId);
    }
  }, [activeChildId]);

  const activeChild = childrenList.find(c => c.id === activeChildId) || (childrenList.length > 0 ? childrenList[0] : null);

  const addChild = async (payload: Partial<Child>) => {
    try {
      const newChild = await childService.addChild(payload, getToken);
      setChildrenList(prev => [...prev, newChild]);
      if (!activeChildId) setActiveChildId(newChild.id);
    } catch (error) {
      console.error("Failed to add child", error);
      throw error;
    }
  };

  const updateChild = async (updatedChild: Child) => {
    try {
      const result = await childService.updateChild(updatedChild.id, updatedChild, getToken);
      setChildrenList(prev => prev.map(c => c.id === result.id ? result : c));
    } catch (error) {
      console.error("Failed to update child", error);
    }
  };

  const deleteChild = async (id: string) => {
    try {
      await childService.deleteChild(id, getToken);
      setChildrenList(prev => prev.filter(c => c.id !== id));
      if (activeChildId === id) setActiveChildId(null);
    } catch (error) {
      console.error("Failed to delete child", error);
    }
  };

  const setActiveChild = (id: string) => {
    setActiveChildId(id);
  };

  const refreshChildren = async () => {
    try {
      const token = await getToken();
      if (token) {
        const data = await childService.getChildren(getToken);
        setChildrenList(data);
      }
    } catch (error) {
      console.error("Failed to refresh children", error);
    }
  };

  const triggerRewardAnimation = (amount: number) => {
    setLastReward({ amount, id: Date.now() });
    // Reset after some time just in case, though XPRewardEffect should watch for id changes
  };

  const updateLocalProgress = (childId: string, xpGain: number) => {
    // Show animation locally immediately
    triggerRewardAnimation(xpGain);
    
    setChildrenList(prev => prev.map(c => {
      if (c.id !== childId) return c;
      const prog = c.child_progress?.[0] || { xp: 0, total_xp: 0, level: 1, lessons_completed: 0 };
      const currentXp = prog.total_xp !== undefined ? prog.total_xp : (prog.xp || 0);
      const newXp = currentXp + xpGain;
      const newLevel = Math.floor(newXp / 100) + 1;

      return {
        ...c,
        child_progress: [{
          ...prog,
          total_xp: newXp,
          xp: newXp,
          level: newLevel,
          last_activity: new Date().toISOString()
        }]
      };
    }));
  };

  const incrementProgress = async (childId: string, xpGain: number) => {
    // Show animation locally immediately
    updateLocalProgress(childId, xpGain);
    
    // Sync XP/Level with Backend (but NOT lessons_completed)
    try {
      // Optimistic state is already updated via updateLocalProgress, 
      // but we need the state for the sync call if handled separately.
      // Actually, since updateLocalProgress is called synchronously above, 
      // the state in setChildrenList will update eventually. 
      // We'll calculate the sync payload directly to be safe.
      const child = childrenList.find(c => c.id === childId);
      const prog = child?.child_progress?.[0] || { xp: 0, total_xp: 0, level: 1 };
      const currentXp = prog.total_xp !== undefined ? prog.total_xp : (prog.xp || 0);
      const newXp = currentXp + xpGain;
      const newLevel = Math.floor(newXp / 100) + 1;

      await childService.updateProgress(childId, { xp: newXp, level: newLevel, lessons_completed: undefined } as any, getToken);
    } catch (error) {
      console.error("Failed to sync progress", error);
    }
  };

  return (
    <ChildContext.Provider value={{
      children: childrenList,
      activeChild,
      loading,
      addChild,
      updateChild,
      deleteChild,
      setActiveChild,
      incrementProgress,
      refreshChildren,
      lastReward,
      triggerRewardAnimation,
      updateLocalProgress
    }}>
      {children}
    </ChildContext.Provider>
  );
};

export const useChildContext = () => {
  const context = useContext(ChildContext);
  if (context === undefined) {
    throw new Error('useChildContext must be used within a ChildProvider');
  }
  return context;
};
