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

// GET /api/admin/users
export const getAllUsers = async (req, res) => {
    try {
        // Fetch all users
        const users = await User.find().sort({ createdAt: -1 });

        // Enhance with children count
        // Optimisation: Aggregate directly or just loop parallel
        const enrichedUsers = await Promise.all(users.map(async (u) => {
            const childCount = await Child.countDocuments({ parent: u._id });
            return {
                _id: u._id,
                name: u.name,
                email: u.email,
                role: u.role,
                createdAt: u.createdAt,
                childCount,
                liveAccess: u.features?.liveAccess || false
            };
        }));

        res.json(enrichedUsers);
    } catch (error) {
        console.error("Admin get users error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// PATCH /api/admin/user/:id
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { liveAccess, role } = req.body;

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (liveAccess !== undefined) {
            if (!user.features) user.features = {};
            user.features.liveAccess = liveAccess;
        }

        if (role) {
            user.role = role.toLowerCase();
        }

        await user.save();

        res.json({
            message: "User updated",
            user: {
                _id: user._id,
                role: user.role,
                liveAccess: user.features?.liveAccess
            }
        });
    } catch (error) {
        console.error("Admin update user error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/admin/user/:id/reset-progress
export const resetUserProgress = async (req, res) => {
    try {
        const { id } = req.params; // User ID (Parent)

        // 1. Find all children for this parent
        const children = await Child.find({ parent_id: id });
        const childUserIds = children.map(c => c.childUserId).filter(Boolean);

        if (childUserIds.length === 0) {
            return res.json({ message: "No children found for this user to reset." });
        }

        // 2. Delete all TarbiyahProgress for these children
        const deleteResult = await TarbiyahProgress.deleteMany({ childUserId: { $in: childUserIds } });

        // 3. Reset Child Stats in Child collection
        await Child.updateMany(
            { parent_id: id },
            {
                $set: {
                    "child_progress.0.xp": 0,
                    "child_progress.0.level": 1,
                    "child_progress.0.lessons_completed": 0,
                    "child_progress.0.last_activity": null
                }
            }
        );

        // 4. Reset Session Logs? (Optional, maybe keep them for history)

        console.log(`[Admin] Reset progress for user ${id}. Deleted ${deleteResult.deletedCount} progress records.`);

        res.json({ message: `Progress reset. cleared ${deleteResult.deletedCount} lesson records.` });

    } catch (error) {
        console.error("Admin reset progress error:", error);
        res.status(500).json({ message: "Server error resetting progress" });
    }
};
