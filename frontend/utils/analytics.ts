import axios from 'axios';

// Native UUID generator fallback
const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:5000") + "/api/analytics";
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

class AnalyticsService {
    private sessionId: string | null = null;
    private lastActivity: number = Date.now();
    private userId: string | null = null;
    private userRole: string = 'parent';
    private getToken: (() => Promise<string | null>) | null = null;

    init(userId: string, role: string, getToken: () => Promise<string | null>) {
        this.userId = userId;
        this.userRole = role;
        this.getToken = getToken;
        this.refreshSession();
        this.trackEvent('session_start');
    }

    private refreshSession() {
        const now = Date.now();
        if (!this.sessionId || (now - this.lastActivity > SESSION_TIMEOUT)) {
            if (this.sessionId) {
                this.trackEvent('session_end', { reason: 'timeout' });
            }
            this.sessionId = generateUUID();
        }
        this.lastActivity = now;
        localStorage.setItem('imam_session_id', this.sessionId);
        localStorage.setItem('imam_last_activity', this.lastActivity.toString());
    }

    async trackEvent(eventType: string, metadata: any = {}, feature: string | null = null, durationMs: number | null = null) {
        this.refreshSession();

        if (!this.userId || !this.sessionId || !this.getToken) return;

        try {
            const token = await this.getToken();
            if (!token) return;

            await axios.post(`${API_BASE}/event`, {
                eventType,
                role: this.userRole,
                sessionId: this.sessionId,
                feature,
                durationMs,
                metadata
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch (error) {
            console.error('[Analytics] Error tracking event:', eventType, error);
        }
    }

    trackPageView(page: string) {
        this.trackEvent('page_view', { url: page });
    }

    trackScreenEnter(screen: string) {
        this.trackEvent('screen_enter', { screen });
    }

    trackScreenExit(screen: string, durationMs: number) {
        this.trackEvent('screen_exit', { screen }, null, durationMs);
    }
}

export const Analytics = new AnalyticsService();
