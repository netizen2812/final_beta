import { trackEvent } from "../services/analyticsService.js";
import AnalyticsEvent from "../models/AnalyticsEvent.js";

export const ingestEvent = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { eventType, role, sessionId, feature, durationMs, metadata } = req.body;

        if (!eventType || !sessionId || !role) {
            return res.status(400).json({ message: "Missing required fields: eventType, sessionId, role" });
        }

        await trackEvent(userId, eventType, {
            role,
            sessionId,
            feature,
            durationMs,
            metadata
        });

        res.status(200).json({ message: "Event ingested" });
    } catch (error) {
        console.error("Ingestion error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getAggregatedMetrics = async (req, res) => {
    try {
        const now = new Date();
        const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // 1. DAU / WAU
        const dau = await AnalyticsEvent.distinct("userId", { timestamp: { $gte: last24h } });
        const wau = await AnalyticsEvent.distinct("userId", { timestamp: { $gte: last7d } });

        // 2. Feature Engagement Distribution
        const featureEngagement = await AnalyticsEvent.aggregate([
            { $match: { feature: { $ne: null }, timestamp: { $gte: last7d } } },
            { $group: { _id: "$feature", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // 3. Avg Session Depth (Features per session)
        const sessionDepth = await AnalyticsEvent.aggregate([
            { $match: { timestamp: { $gte: last7d } } },
            { $group: { _id: "$sessionId", uniqueFeatures: { $addToSet: "$feature" } } },
            { $project: { featureCount: { $size: "$uniqueFeatures" } } },
            { $group: { _id: null, avgDepth: { $avg: "$featureCount" } } }
        ]);

        // 4. Time Spent per Feature
        const timeSpent = await AnalyticsEvent.aggregate([
            { $match: { durationMs: { $ne: null }, timestamp: { $gte: last7d } } },
            { $group: { _id: "$feature", totalTimeMs: { $sum: "$durationMs" } } },
            { $sort: { totalTimeMs: -1 } }
        ]);

        // 5. Activation Funnel (Basic)
        // Signup -> Any Event -> Any Tarbiyah/Chat Event
        // (This is a bit simplified, but gives an idea)
        const totalUsers = await AnalyticsEvent.distinct("userId");
        const activeUsersCount = wau.length;

        res.status(200).json({
            health: {
                dau: dau.length,
                wau: wau.length,
                engagementRate: totalUsers.length > 0 ? (activeUsersCount / totalUsers.length) * 100 : 0
            },
            engagement: {
                featureDistribution: featureEngagement,
                avgSessionDepth: sessionDepth.length > 0 ? sessionDepth[0].avgDepth : 0,
                timeSpentDistribution: timeSpent
            },
            timestamp: now
        });
    } catch (error) {
        console.error("Aggregation error:", error);
        res.status(500).json({ message: "Failed to compute stats" });
    }
};
