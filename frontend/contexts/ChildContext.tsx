
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Child, ChildProgress } from '../types';
import { tarbiyahService } from '../services/tarbiyahService';
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
}

const ChildContext = createContext<ChildContextType | undefined>(undefined);

const STORAGE_KEY_CHILDREN = 'imam_children_data';
const STORAGE_KEY_ACTIVE = 'imam_active_child_id';

export const ChildProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth(); // Need auth for API calls

  // Load from Backend on Mount
  useEffect(() => {
    const fetchChildren = async () => {
      setLoading(true);
      try {
        const token = await getToken();
        if (token) {
          const data = await tarbiyahService.getChildren(getToken);
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
      const newChild = await tarbiyahService.addChild(payload, getToken);
      setChildrenList(prev => [...prev, newChild]);
      if (!activeChildId) setActiveChildId(newChild.id);
    } catch (error) {
      console.error("Failed to add child", error);
    }
  };

  const updateChild = async (updatedChild: Child) => {
    try {
      const result = await tarbiyahService.updateChild(updatedChild.id, updatedChild, getToken);
      setChildrenList(prev => prev.map(c => c.id === result.id ? result : c));
    } catch (error) {
      console.error("Failed to update child", error);
    }
  };

  const deleteChild = async (id: string) => {
    try {
      await tarbiyahService.deleteChild(id, getToken);
      setChildrenList(prev => prev.filter(c => c.id !== id));
      if (activeChildId === id) setActiveChildId(null);
    } catch (error) {
      console.error("Failed to delete child", error);
    }
  };

  const setActiveChild = (id: string) => {
    setActiveChildId(id);
  };

  const incrementProgress = async (childId: string, xpGain: number) => {
    // Optimistic Update
    let newProgressState = { xp: 0, level: 1, lessons_completed: 0 };

    setChildrenList(prev => prev.map(c => {
      if (c.id !== childId) return c;
      const prog = c.child_progress?.[0] || { xp: 0, level: 1, lessons_completed: 0 };
      const newXp = prog.xp + xpGain;
      const newLevel = Math.floor(newXp / 1000) + 1;

      const updatedChild = {
        ...c,
        child_progress: [{
          ...prog,
          xp: newXp,
          level: newLevel,
          lessons_completed: (prog.lessons_completed || 0) + 1,
          last_activity: new Date().toISOString()
        }]
      };

      newProgressState = { xp: newXp, level: newLevel, lessons_completed: updatedChild.child_progress[0].lessons_completed };
      return updatedChild;
    }));

    // Sync with Backend
    try {
      await tarbiyahService.updateProgress(childId, newProgressState, getToken);
    } catch (error) {
      console.error("Failed to sync progress", error);
      // Could revert here if needed
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
      incrementProgress
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
