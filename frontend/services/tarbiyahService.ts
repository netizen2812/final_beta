import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface TarbiyahDashboardStats {
    timeThisWeek: string;
    totalMinutes: number;
    lessonsDone: number;
    currentXP: number;
    currentLevel: number;
    averageAccuracy: number;
    totalRevisions: number;
    attendanceRate: number;
    streak: number;
    activeDays: number;
}

export interface DetailedActivity {
    date: string;
    minutes: number;
    sessions: number;
    topics: Record<string, number>;
}

export interface ParentDashboardData {
    stats: TarbiyahDashboardStats;
    topicBreakdown: { name: string; value: number; fill: string }[];
    activityLog: {
        days: string[];
        minutes: number[];
    };
    detailedActivity: DetailedActivity[];
    settings: {
        dailyLimitMinutes: number;
    };
    child: {
        name: string;
        age: number;
    };
    timeThisWeek: {
        total: string;
        percentChange: string;
        comparisonText: string;
    };
}

export const tarbiyahService = {
  getParentDashboard: async (childId: string, getToken: () => Promise<string | null>): Promise<ParentDashboardData> => {
    const token = await getToken();
    const response = await axios.get(`${API_BASE}/api/parent/dashboard/${childId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  },

  updateParentSettings: async (childId: string, settings: { dailyLimitMinutes: number }, getToken: () => Promise<string | null>): Promise<void> => {
    const token = await getToken();
    await axios.put(`${API_BASE}/api/parent/settings/${childId}`, settings, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};
