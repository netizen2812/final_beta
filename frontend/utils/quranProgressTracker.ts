import axios from 'axios';
import { API_BASE as CENTRAL_API_BASE } from '../lib/api';

interface QuranProgressData {
    readAyahs: string[]; // Set of "SurahNum:AyahNum"
    activeSeconds: number;
    lastReadDate: string | null; // YYYY-MM-DD
    streak: number;
}

class QuranProgressTracker {
    private readonly STORAGE_KEY = 'faithtech_quran_progress';
    private readonly API_BASE = CENTRAL_API_BASE + "/api/ibadah/quran";
    private data: QuranProgressData;
    private timerInterval: ReturnType<typeof setInterval> | null = null;
    private isTrackingTime = false;
    private isSyncing = false;

    constructor() {
        this.data = this.loadData();
    }

    private loadData(): QuranProgressData {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (e) {
            console.error("Failed to parse Quran progress data:", e);
        }
        return {
            readAyahs: [],
            activeSeconds: 0,
            lastReadDate: null,
            streak: 0
        };
    }

    private saveData() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    }

    private getTodayDateStr(): string {
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    private updateStreak() {
        const todayStr = this.getTodayDateStr();
        if (this.data.lastReadDate === todayStr) {
            return; // Already calculated today
        }

        if (!this.data.lastReadDate) {
            this.data.streak = 1;
        } else {
            const lastDate = new Date(this.data.lastReadDate);
            const today = new Date(todayStr);

            // Calculate difference in days, ignoring time
            const diffTime = Math.abs(today.getTime() - lastDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Read yesterday, increment streak
                this.data.streak += 1;
            } else if (diffDays > 1) {
                // Missed a day, reset streak
                this.data.streak = 1;
            }
            // If diffDays is 0, it means it's the same day (already handled above)
        }

        this.data.lastReadDate = todayStr;
        this.saveData();
    }

    // Call this when an Ayah is actively on screen or being played
    public markAyahRead(surahNumber: number, ayahNumber: number) {
        this.updateStreak(); // Ensure streak is active

        const key = `${surahNumber}:${ayahNumber}`;
        if (!this.data.readAyahs.includes(key)) {
            this.data.readAyahs.push(key);
            this.saveData();
        }
    }

    // --- Time Tracking Methods ---

    public startTimeTracking() {
        if (this.isTrackingTime) return;
        this.isTrackingTime = true;

        this.timerInterval = setInterval(() => {
            this.updateStreak();
            this.data.activeSeconds += 5; // Track in 5-second intervals
            this.saveData();
        }, 5000);
    }

    public stopTimeTracking() {
        if (!this.isTrackingTime) return;
        this.isTrackingTime = false;

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    // --- Getter Methods for UI ---

    public getStats() {
        return {
            totalUniqueAyahsRead: this.data.readAyahs.length,
            khatmPercentage: Math.min(100, Math.round((this.data.readAyahs.length / 6236) * 100)), // 6236 total Ayahs
            minutesRead: Math.floor(this.data.activeSeconds / 60),
            streak: this.data.streak
        };
    }

    // --- Server Sync Methods ---

    public async fetchFromServer(getToken: () => Promise<string | null>) {
        try {
            const token = await getToken();
            if (!token) return;

            const res = await axios.get(`${this.API_BASE}/progress`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data?.progress) {
                const serverData = res.data.progress;

                // Merge local data with server data
                const mergedAyahs = new Set([...this.data.readAyahs, ...(serverData.readAyahs || [])]);
                this.data.readAyahs = Array.from(mergedAyahs);

                this.data.activeSeconds = Math.max(this.data.activeSeconds, serverData.activeSeconds || 0);
                this.data.streak = Math.max(this.data.streak, serverData.streak || 0);

                // Keep the most recent date
                if (serverData.lastReadDate && (!this.data.lastReadDate || serverData.lastReadDate > this.data.lastReadDate)) {
                    this.data.lastReadDate = serverData.lastReadDate;
                }

                this.saveData();
            }
        } catch (error) {
            console.error("Failed to fetch Quran progress from server", error);
        }
    }

    public async syncWithServer(getToken: () => Promise<string | null>) {
        if (this.isSyncing) return;

        try {
            this.isSyncing = true;
            const token = await getToken();
            if (!token) return;

            // Only send if we have some data
            if (this.data.readAyahs.length === 0 && this.data.activeSeconds === 0) return;

            await axios.post(`${this.API_BASE}/sync-progress`, {
                readAyahs: this.data.readAyahs,
                activeSeconds: this.data.activeSeconds,
                streak: this.data.streak,
                lastReadDate: this.data.lastReadDate
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

        } catch (error) {
            console.error("Failed to sync Quran progress to server", error);
        } finally {
            this.isSyncing = false;
        }
    }
}

// Export a singleton instance
export const quranTracker = new QuranProgressTracker();
