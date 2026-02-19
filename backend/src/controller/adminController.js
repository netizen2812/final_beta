import User from "../models/User.js";
import Child from "../models/Child.js";
import LiveSession from "../models/LiveSession.js";
import TarbiyahProgress from "../models/TarbiyahProgress.js";
import ChildActivity from "../models/ChildActivity.js";

// GET /api/admin/stats
export const getAdminStats = async (req, res) => {
    try {
        // 1. User Growth
        const totalUsers = await User.countDocuments();
        const totalParents = await User.countDocuments({ role: "parent" });
        const totalChildren = await Child.countDocuments();

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newUsersLast7Days = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

        // 2. Engagement (Simple approximation for now)
        // Active in last 24h (based on ChildActivity updated)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const activeChildrenToday = await ChildActivity.distinct("child_id", { date: { $gte: oneDayAgo } });
        const dau = activeChildrenToday.length;

        // Total Lessons Completed
        const totalLessonsCompleted = await TarbiyahProgress.countDocuments({ completedAt: { $ne: null } });

        // Live Sessions
        const activeLiveSessions = await LiveSession.countDocuments({ status: "active" });
        const totalLiveSessions = await LiveSession.countDocuments();

        res.json({
            growth: {
                totalUsers,
                totalParents,
                totalChildren,
                newUsersLast7Days
            },
            engagement: {
                dau,
                totalLessonsCompleted,
                avgSessionDuration: "N/A" // Complex to calc on fly without aggregation pipeline
            },
            live: {
                active: activeLiveSessions,
                total: totalLiveSessions
            }
        });

    } catch (error) {
        console.error("Admin stats error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/admin/sessions
export const getLiveSessions = async (req, res) => {
    try {
        const sessions = await LiveSession.find().sort({ createdAt: -1 }).limit(50);

        // Populate parent names manually or via populate if schema refs set up (Schema refs are mixed string/ObjectId for Parent currently)
        // Let's just return raw for now, or fetch parent names if critical.

        res.json({ sessions });
    } catch (error) {
        console.error("Admin sessions error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/admin/session/:id/end
export const forceEndSession = async (req, res) => {
    try {
        const { id } = req.params;
        const session = await LiveSession.findById(id);

        if (!session) return res.status(404).json({ message: "Session not found" });

        session.status = "ended";
        session.endedAt = new Date();
        // We can skip duration calc for force end or handle it.
        await session.save();

        res.json({ message: "Session force ended" });
    } catch (error) {
        console.error("Admin force end error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
