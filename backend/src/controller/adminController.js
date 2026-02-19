import User from "../models/User.js";
import Child from "../models/Child.js";
import Batch from "../models/Batch.js";
import Session from "../models/Session.js";
import TarbiyahProgress from "../models/TarbiyahProgress.js";
import AnalyticsEvent from "../models/AnalyticsEvent.js";
import mongoose from "mongoose";

// --- PART 1: REPLACE ADMIN KPIs (TIER-BASED STRUCTURE) ---

export const getAdminStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 7);
        const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);

        // 🥇 TIER 1 — CORE STARTUP HEALTH

        // 1. Retention (Cohort-based)
        // Definition: User returns and performs ANY activity after first signup day.
        // Simplified Logic: D1 = % of users created yesterday who active today. D7 = Created 7 days ago active today.
        // More Robust Logic: % of users created in [Period] who were active in [Subsequent Period].
        // Implementing "Day N Retention" snapshot for *users created N days ago*.

        const calculateRetention = async (daysAgo) => {
            const start = new Date(now); start.setDate(now.getDate() - daysAgo - 1); // Window Start
            const end = new Date(now); end.setDate(now.getDate() - daysAgo);       // Window End

            // Users created between D-(N+1) and D-N
            const cohortUsers = await User.find({ createdAt: { $gte: start, $lt: end } }).select('_id');
            if (cohortUsers.length === 0) return 0;
            const cohortIds = cohortUsers.map(u => u._id.toString()); // Ensure string for Analytics check

            // Users from cohort active in last 24h
            const activeCohort = await AnalyticsEvent.distinct('userId', {
                userId: { $in: cohortIds },
                timestamp: { $gte: startOfDay }
            });

            return Math.round((activeCohort.length / cohortUsers.length) * 100);
        };

        const retention = {
            d1: await calculateRetention(1),
            d7: await calculateRetention(7),
            d30: await calculateRetention(30)
        };

        // 2. Active Users (Real Data)
        const dau = (await AnalyticsEvent.distinct('userId', { timestamp: { $gte: startOfDay } })).length;
        const wau = (await AnalyticsEvent.distinct('userId', { timestamp: { $gte: sevenDaysAgo } })).length;
        const mau = (await AnalyticsEvent.distinct('userId', { timestamp: { $gte: thirtyDaysAgo } })).length;

        // 3. Habit Formation
        // Avg sessions per user per week (Session = generic activity for now, distinct days active?)
        // Let's use "Active Days per User" avg
        // For strictly "Sessions", we'd need to segment events by >30min gaps. 
        // Approximation: Events grouped by hour count / total active users
        const activeUsersCount = wau || 1;
        const totalEventsWeek = await AnalyticsEvent.countDocuments({ timestamp: { $gte: sevenDaysAgo } });
        // Assume avg 10 events per session? Or simplified:
        // Let's count distinct (User, Day) tuples
        const dailyActiveTuples = await AnalyticsEvent.aggregate([
            { $match: { timestamp: { $gte: sevenDaysAgo } } },
            { $group: { _id: { userId: "$userId", day: { $dayOfYear: "$timestamp" } } } },
            { $group: { _id: "$_id.userId", daysActive: { $sum: 1 } } }
        ]);

        const avgActiveDays = dailyActiveTuples.length ?
            (dailyActiveTuples.reduce((acc, curr) => acc + curr.daysActive, 0) / dailyActiveTuples.length).toFixed(1)
            : 0;

        const threeDayHabit = dailyActiveTuples.filter(u => u.daysActive >= 3).length;
        const habitPercent = Math.round((threeDayHabit / (activeUsersCount || 1)) * 100);

        // 4. Feature Engagement (% of WAU)
        const getFeatureUsage = async (eventType) => {
            const count = (await AnalyticsEvent.distinct('userId', {
                timestamp: { $gte: sevenDaysAgo },
                eventType: eventType
            })).length;
            return Math.round((count / activeUsersCount) * 100);
        };

        const engagement = {
            chat: await getFeatureUsage('CHAT_MESSAGE_SENT'),
            tarbiyah: await getFeatureUsage('LESSON_COMPLETED'), // or STARTED
            ibadah: await getFeatureUsage('IBADAH_USED'), // If tracked
            live: await getFeatureUsage('LIVE_JOINED')
        };

        // 5. Depth
        // Msg per session: total msgs / total chat sessions (approx by users?)
        const totalMsgs = await AnalyticsEvent.countDocuments({ eventType: 'CHAT_MESSAGE_SENT', timestamp: { $gte: sevenDaysAgo } });
        // Lessons per week
        const totalLessons = await AnalyticsEvent.countDocuments({ eventType: 'LESSON_COMPLETED', timestamp: { $gte: sevenDaysAgo } });


        // 🧒 TIER 2 — PARENT + CHILD

        // Child Learning
        const avgLessons = totalChildren ? (totalLessons / (await Child.countDocuments() || 1)).toFixed(1) : 0;

        // Parent Involvement
        const parentViews = await AnalyticsEvent.countDocuments({ eventType: 'PARENT_DASHBOARD_VIEW', timestamp: { $gte: sevenDaysAgo } });

        // 🚨 TIER 3 — RISK

        // Inactive > 7 days
        // Users created > 7 days ago but NO event in last 7 days
        const potentialChurners = await User.countDocuments({ createdAt: { $lt: sevenDaysAgo } });
        // This is tricky without a "lastActive" field on User. Child has it. User doesn't reliably.
        // We can rely on `wau` vs `totalUsers`.
        // Better: Explicit query for users with lastEvent < 7 days ago? Expensive on Events.
        // Let's use the Child `last_activity` since that's the core value.
        const inactiveChildren = await Child.countDocuments({ "child_progress.0.last_activity": { $lt: sevenDaysAgo } });

        const incompleteLessons = await TarbiyahProgress.countDocuments({ completedAt: null, activeSessionStart: { $ne: null } });

        res.json({
            startup: {
                retention,
                active: { dau, wau, mau },
                habit: { avgActiveDays, habitPercent }
            },
            features: engagement,
            depth: {
                msgsPerWeek: totalMsgs,
                lessonsPerWeek: totalLessons
            },
            learning: {
                avgLessonsPerChild: avgLessons,
                parentViews
            },
            risk: {
                inactiveChildren,
                incompleteLessons
            }
        });

    } catch (error) {
        console.error("Admin stats error:", error);
        res.status(500).json({ message: "Analytics Engine Error" });
    }
};

// --- PART 2: USER DASHBOARD ROLE MANAGEMENT ---

// GET /api/admin/users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 }).lean();

        // Enhance with child count
        const enhanced = await Promise.all(users.map(async u => {
            const childCount = await Child.countDocuments({ parent_id: u._id });
            return { ...u, childCount };
        }));

        res.json(enhanced);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users" });
    }
};

// PATCH /api/admin/user/:id (Role Update with Safety)
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, liveAccess } = req.body; // Accepts role update

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // SAFETY: Prevent removing last admin
        if (role && user.role === 'admin' && role !== 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return res.status(400).json({ message: "Cannot remove the last Admin." });
            }
        }

        if (role) user.role = role;
        if (liveAccess !== undefined) {
            if (!user.features) user.features = {};
            user.features.liveAccess = liveAccess;
        }

        await user.save();

        // Track role change
        // AnalyticsEvent.create(...) // Optional

        res.json({ message: "User updated", user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Update failed" });
    }
};

// --- EXISTING BATCH/SESSION METHODS (Keep for functionality) ---

export const getBatches = async (req, res) => {
    try {
        const batches = await Batch.find().populate('scholar', 'name').populate('students', 'name');
        res.json(batches);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createBatch = async (req, res) => {
    try {
        const batch = new Batch(req.body);
        await batch.save();
        res.status(201).json(batch);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

export const updateBatch = async (req, res) => {
    try {
        const batch = await Batch.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(batch);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

export const getSessions = async (req, res) => {
    try {
        const sessions = await Session.find()
            .populate('batchId', 'name')
            .populate('scholarId', 'name')
            .sort({ scheduledAt: 1 });
        res.json(sessions);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

export const createSession = async (req, res) => {
    try {
        const session = new Session(req.body);
        await session.save();
        res.status(201).json(session);
    } catch (err) { res.status(500).json({ message: err.message }); }
};

export const forceEndSession = async (req, res) => {
    res.json({ message: "Use new session management" });
};

export const resetUserProgress = async (req, res) => {
    try {
        const { id } = req.params;
        const children = await Child.find({ parent_id: id });
        const childUserIds = children.map(c => c.childUserId).filter(Boolean);
        if (childUserIds.length > 0) {
            await TarbiyahProgress.deleteMany({ childUserId: { $in: childUserIds } });
            await Child.updateMany({ parent_id: id }, {
                $set: { "child_progress.0.xp": 0, "child_progress.0.level": 1, "child_progress.0.lessons_completed": 0 }
            });
        }
        res.json({ message: "Reset complete" });
    } catch (e) { res.status(500).json({ message: "Error" }); }
};
