
import { supabase } from '../lib/supabase';
import { Child, Profile } from '../types';

export interface Progress {
  child_id: string;
  xp: number;
  level: number;
  lessons_completed: number;
  last_activity: string;
}

export interface ParentDashboardData {
  currentXP: number;
  currentLevel: number;
  timeThisWeek: {
    total: string;
    percentChange: string;
    comparisonText: string;
  };
  lessonsDone: {
    completed: number;
    inProgress: number;
    total: number;
  };
  currentFocus: {
    moduleName: string;
    progress: string;
    lessonTitle: string;
  };
  totalBadges: {
    count: number;
    showcaseUrl: string;
  };
  topicBreakdown: {
    name: string;
    value: number;
    fill: string;
  }[];
  totalProgress: {
    completed: number;
    total: number;
    percentage: number;
  };
  activityLog: {
    days: string[];
    minutes: number[];
  };
  settings: {
    dailyLimitMinutes: number;
  };
}

export const tarbiyahService = {
  async getProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Fetch or create profile
    let { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    if (!data) {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert([{
          id: user.id,
          name: user.user_metadata.full_name || user.user_metadata.name || 'Parent',
          email: user.email
        }])
        .select()
        .single();
      if (createError) throw createError;
      return newProfile as Profile;
    }

    return { ...data, email: user.email } as Profile;
  },

  async updateProfile(payload: Partial<Profile>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', user.id);

    if (error) throw error;
  },

  async getChildren(getToken: () => Promise<string | null>) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const token = await getToken();

    const response = await fetch(`${API_URL}/api/child`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to fetch children');
    const data = await response.json();
    return data.map((child: any) => ({
      ...child,
      id: child._id, // Map MongoDB _id to frontend id
    })) as (Child & { child_progress: Progress[] })[];
  },

  async addChild(payload: Partial<Child>, getToken: () => Promise<string | null>) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const token = await getToken();

    const response = await fetch(`${API_URL}/api/child`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Failed to add child');
    return await response.json() as Child;
  },

  async updateChild(id: string, payload: Partial<Child>, getToken: () => Promise<string | null>) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const token = await getToken();

    const response = await fetch(`${API_URL}/api/child/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Failed to update child');
    return await response.json() as Child;
  },

  async deleteChild(id: string, getToken: () => Promise<string | null>) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const token = await getToken();

    const response = await fetch(`${API_URL}/api/child/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Failed to delete child');
  },

  async getProgress(childId: string) {
    // This might need a backend endpoint too if we want to stop using Supabase entirely
    // For now, let's assume getChildren returns progress or use existing if it works?
    // Actually the backend getChildren returns child_progress array.
    // So we might not need this standalone if we use the context.
    const { data, error } = await supabase
      .from('child_progress')
      .select('*')
      .eq('child_id', childId)
      .maybeSingle();

    if (error) throw error;
    return data as Progress | null;
  },

  async updateProgress(childId: string, progress: { xp: number, level: number, lessons_completed: number }, getToken: () => Promise<string | null>) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const token = await getToken();

    const response = await fetch(`${API_URL}/api/child/${childId}/progress`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(progress)
    });

    if (!response.ok) throw new Error('Failed to update progress');
  },

  // Parent Dashboard API functions
  async getParentDashboard(childUserId: string, getToken: () => Promise<string | null>): Promise<ParentDashboardData> {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const token = await getToken();

    const response = await fetch(`${API_URL}/api/tarbiyah/parent/dashboard/${childUserId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch parent dashboard');
    }

    const data = await response.json();
    return data.dashboard;
  },

  async updateParentSettings(childUserId: string, settings: {
    dailyLimitMinutes: number;
  }, getToken: () => Promise<string | null>) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const token = await getToken();

    const response = await fetch(`${API_URL}/api/tarbiyah/parent/settings/${childUserId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      throw new Error('Failed to update parent settings');
    }

    const data = await response.json();
    return data.settings;
  },

  async saveLessonProgress(payload: {
    childUserId: string;
    lessonId: string;
    lessonTitle: string;
    xpEarned: number;
    completed: boolean;
    scores?: { score: number; attemptDate: Date };
  }, getToken: () => Promise<string | null>) {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const token = await getToken();

    const response = await fetch(`${API_URL}/api/tarbiyah/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Failed to save lesson progress');
    }

    return await response.json();
  }
};
