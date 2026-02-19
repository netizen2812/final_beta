import User from "../models/User.js";
import Child from "../models/Child.js";
import LiveSession from "../models/LiveSession.js"; // Legacy live session for now, switching to Session model in future phases? keeping primarily for backward compat if needed, but we should use new Session model.
// Wait, prompt specific "Session Management". We should use new Session model but keep LiveSession if it was used for the WebRTC logic? 
// The prompt implies "Restructure... Create batch ... Session belongs to batch".
// I'll import new models.
import Batch from "../models/Batch.js";
import Session from "../models/Session.js";
import TarbiyahProgress from "../models/TarbiyahProgress.js";
import ChildActivity from "../models/ChildActivity.js";

// GET /api/admin/stats
export const getAdminStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(today.getDate() - 7);
        const thirtyDaysAgo = new Date(today); thirtyDaysAgo.setDate(today.getDate() - 30);

        // 1. PLATFORM HEALTH
        const totalUsers = await User.countDocuments();
        const usersD1 = await User.countDocuments({ createdAt: { $gte: startOfDay } }); // Created Today (Proxy for D1 retention cohort start)
        // Retention calculation requires elaborate logs, simplified for now:
        const activeToday = await ChildActivity.distinct("child_id", { date: { $gte: startOfDay } });
        const dau = activeToday.length;

        const activeWeek = await ChildActivity.distinct("child_id", { date: { $gte: sevenDaysAgo } });
        const wau = activeWeek.length;

        // 2. LEARNING PROGRESS
        const lessonsToday = await TarbiyahProgress.countDocuments({ completedAt: { $gte: startOfDay } });
        const totalChildren = await Child.countDocuments();
        const avgLessonsPerChild = totalChildren ? (await TarbiyahProgress.countDocuments() / totalChildren).toFixed(1) : 0;

        // XP Distribution (Simple buckets)
        const xpDist = {
            low: await Child.countDocuments({ "child_progress.0.xp": { $lt: 100 } }),
            mid: await Child.countDocuments({ "child_progress.0.xp": { $gte: 100, $lt: 1000 } }),
            high: await Child.countDocuments({ "child_progress.0.xp": { $gte: 1000 } })
        };

        // 3. ENGAGEMENT
        // Mocking % based on feature flags or activity types if specific logs missing
        // For now, returning raw counts which provided layout can convert to %
        const chatUsers = await User.countDocuments({ dailyChatCount: { $gt: 0 } }); // Users who used chat ever (or reset daily)

        // 4. RISK ALERTS
        const inactive7Days = await Child.countDocuments({ "child_progress.0.last_activity": { $lt: sevenDaysAgo } });

        res.json({
            health: {
                totalUsers,
                dau,
                wau,
                newUsersToday: usersD1
            },
            learning: {
                lessonsToday,
                avgLessonsPerChild,
                xpDistribution: xpDist
            },
            risk: {
                inactive7Days,
                incompleteLessons: 0 // Placeholder
            }
        });

    } catch (error) {
        console.error("Admin stats error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/admin/users (Structure: Parent -> Children)
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: "parent" }).sort({ createdAt: -1 }).lean();

        const enriched = await Promise.all(users.map(async (parent) => {
            const children = await Child.find({ parent_id: parent._id }).populate('batch', 'name').lean();

            return {
                _id: parent._id,
                name: parent.name,
                email: parent.email,
                joinedAt: parent.createdAt,
                children: children.map(c => ({
                    _id: c._id,
                    name: c.name,
                    xp: c.child_progress?.[0]?.xp || 0,
                    completed: c.child_progress?.[0]?.lessons_completed || 0,
                    lastActive: c.child_progress?.[0]?.last_activity,
                    batchName: c.batch?.name || "Unassigned"
                }))
            };
        }));

        res.json(enriched);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching users" });
    }
};

// --- BATCH MANAGEMENT ---

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

// --- SESSION MANAGEMENT ---

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

// Re-export old methods if needed for other routes or safely deprecate
export const forceEndSession = async (req, res) => {
    res.json({ message: "Use new session management" });
    // Simplified for this migration.
};

export const updateUser = async (req, res) => {
    // Keep existing logic for locking accounts
    try {
        await User.findByIdAndUpdate(req.params.id, req.body);
        res.json({ message: "Updated" });
    } catch (e) { res.status(500).json({ message: "Error" }); }
};

export const resetUserProgress = async (req, res) => {
    // Keep existing logic
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
