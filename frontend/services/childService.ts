import axios from 'axios';
import { Child } from '../types';

import { APPLICATION_API_URL } from '../lib/api';

const getHeaders = async (getToken: () => Promise<string | null>) => {
  const token = await getToken();
  return { Authorization: `Bearer ${token}` };
};

export const childService = {
  // Fetch all children for the current parent
  getChildren: async (getToken: () => Promise<string | null>): Promise<Child[]> => {
    const headers = await getHeaders(getToken);
    const res = await axios.get(`${APPLICATION_API_URL}/api/child`, { headers });
    return res.data;
  },

  // Add a new child
  addChild: async (payload: Partial<Child>, getToken: () => Promise<string | null>): Promise<Child> => {
    const headers = await getHeaders(getToken);
    const res = await axios.post(`${APPLICATION_API_URL}/api/child`, payload, { headers });
    return res.data;
  },

  // Update a child
  updateChild: async (childId: string, payload: Partial<Child>, getToken: () => Promise<string | null>): Promise<Child> => {
    const headers = await getHeaders(getToken);
    const res = await axios.put(`${APPLICATION_API_URL}/api/child/${childId}`, payload, { headers });
    return res.data;
  },

  // Delete a child
  deleteChild: async (childId: string, getToken: () => Promise<string | null>): Promise<void> => {
    const headers = await getHeaders(getToken);
    await axios.delete(`${APPLICATION_API_URL}/api/child/${childId}`, { headers });
  },

  // Update child progress (XP/Level logic is managed in gamificationService too, but this hits the old fallback /progress if needed)
  updateProgress: async (
    childId: string,
    progressData: { xp: number; level: number; lessons_completed?: number },
    getToken: () => Promise<string | null>
  ): Promise<void> => {
    const headers = await getHeaders(getToken);
    await axios.put(`${APPLICATION_API_URL}/api/child/${childId}/progress`, progressData, { headers });
  }
};
