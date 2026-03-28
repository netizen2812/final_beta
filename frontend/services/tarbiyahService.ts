import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface ParentDashboardData {
  stats: {
    totalXP: number;
    level: number;
    averageAccuracy: number;
    totalRevisions: number;
    attendanceRate: number;
  };
  timeThisWeek: {
    total: string;
    percentChange: string;
    comparisonText: string;
  };
  lessonsDone: {
    completed: number;
    total: number;
    inProgress: number;
  };
  currentFocus: {
    progress: string;
    lessonTitle: string;
  };
  topicBreakdown: Array<{
    name: string;
    value: number;
    fill: string;
  }>;
  activityLog: {
    days: string[];
    minutes: number[];
  };
  settings: {
    dailyLimitMinutes: number;
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
    await axios.post(`${API_BASE}/api/parent/settings/${childId}`, settings, {
      headers: { Authorization: `Bearer ${token}` }
    });
  }
};
