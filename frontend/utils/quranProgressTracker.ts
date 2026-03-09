interface QuranProgressData {
    readAyahs: string[]; // Set of "SurahNum:AyahNum"
    activeSeconds: number;
    lastReadDate: string | null; // YYYY-MM-DD
    streak: number;
}

class QuranProgressTracker {
    private readonly STORAGE_KEY = 'faithtech_quran_progress';
    private data: QuranProgressData;
    private timerInterval: ReturnType<typeof setInterval> | null = null;
    private isTrackingTime = false;

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
}

// Export a singleton instance
export const quranTracker = new QuranProgressTracker();
