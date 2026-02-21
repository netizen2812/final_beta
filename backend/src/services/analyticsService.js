import AnalyticsEvent from "../models/AnalyticsEvent.js";

/**
 * Tracks a user event for analytics purposes.
 * @param {string} userId - The Clerk ID or User ID of the actor.
 * @param {string} eventType - The type of event (e.g., 'LESSON_COMPLETE').
 * @param {object} metadata - Additional context (e.g., lessonId, xpEarned).
 */
export const trackEvent = async (userId, eventType, data = {}) => {
    try {
        const { role, sessionId, feature, durationMs, metadata = {} } = data;

        // Fire and forget - don't await to avoid slowing down the main request
        AnalyticsEvent.create({
            userId,
            role: role || 'parent', // Default to parent if not provided
            eventType,
            sessionId: sessionId || 'unknown',
            feature: feature || null,
            durationMs: durationMs || null,
            metadata,
        }).catch((err) => {
            console.error(`[Analytics] Failed to save event ${eventType}:`, err.message);
        });

        // Optional: Log to console in dev
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[Analytics] ${eventType} tracked for ${userId}`);
        }
    } catch (error) {
        console.error("[Analytics] Error in trackEvent wrapper:", error);
    }
};
