
export interface NotificationSchedule {
    id: string;
    title: string;
    body: string;
    time: Date;
}

class NotificationService {
    private hasPermission: boolean = false;

    constructor() {
        this.checkPermission();
    }

    private async checkPermission() {
        if (!("Notification" in window)) return;
        this.hasPermission = Notification.permission === "granted";
    }

    public async requestPermission(): Promise<boolean> {
        if (!("Notification" in window)) {
            console.warn("Notifications not supported in this browser.");
            return false;
        }

        const permission = await Notification.requestPermission();
        this.hasPermission = permission === "granted";
        return this.hasPermission;
    }

    /**
     * Schedule a notification for a specific time.
     * Since native local scheduling is limited, we use a timeout for active sessions
     * and rely on the Service Worker for background persistence (to be added in sw.js).
     */
    public scheduleLocal(notification: NotificationSchedule) {
        if (!this.hasPermission) return;

        const delay = notification.time.getTime() - Date.now();
        if (delay <= 0) return;

        console.log(`Scheduling notification: ${notification.title} in ${Math.round(delay / 1000 / 60)} mins`);

        setTimeout(() => {
            this.showNow(notification.title, notification.body);
        }, delay);
    }

    public showNow(title: string, body: string) {
        if (!this.hasPermission) return;

        new Notification(title, {
            body,
            icon: '/imam_logo.png',
            badge: '/imam_logo.png',
        });
    }

    /**
     * Schedules prayer notifications based on Aladhan data
     */
    public schedulePrayerReminders(timings: Record<string, string>) {
        const prayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

        prayers.forEach(name => {
            const timeStr = timings[name];
            const prayerTime = this.parseTime(timeStr);

            // 1. 10 Minute Warning
            const warningTime = new Date(prayerTime.getTime() - 10 * 60000);
            this.scheduleLocal({
                id: `${name}-warning`,
                title: `${name} in 10 minutes`,
                body: "Prepare your heart for the meeting with Allah. It's time for Wudu.",
                time: warningTime
            });

            // 2. Primary Iqamah Alert
            this.scheduleLocal({
                id: `${name}-now`,
                title: `Time for ${name}`,
                body: `It is now time for ${name} prayer. May Allah accept your devotion.`,
                time: prayerTime
            });
        });
    }

    private parseTime(timeStr: string): Date {
        const [h, m] = timeStr.split(':').map(Number);
        const now = new Date();
        const date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);

        // If time has already passed today, assume it's for tomorrow
        if (date.getTime() <= now.getTime()) {
            date.setDate(date.getDate() + 1);
        }
        return date;
    }

    /**
     * Schedules a random engagement nudge once a day
     */
    public scheduleDailyNudges() {
        const nudges = [
            { id: 'ai-imam', title: "Seek Guidance", body: "The AI Imam is ready to answer your questions today. Why not seek some knowledge?" },
            { id: 'quran', title: "Daily Verse", body: "Unlock your heart with a few verses from the Quran today." },
            { id: 'tarbiyah', title: "Learning Journey", body: "The kids' Tarbiyah path is waiting! Continue the adventure of light." }
        ];

        const randomNudge = nudges[Math.floor(Math.random() * nudges.length)];

        // Schedule for 2 hours from now for demonstration, or mid-day
        const nudgeTime = new Date();
        nudgeTime.setHours(nudgeTime.getHours() + 2);

        this.scheduleLocal({
            ...randomNudge,
            time: nudgeTime
        });
    }
}

export const notificationService = new NotificationService();
