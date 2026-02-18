import Child from "../models/Child.js";
import ChildActivity from "../models/ChildActivity.js";
import ChildSettings from "../models/ChildSettings.js";
import ChildBadge from "../models/ChildBadge.js";
import User from "../models/User.js";

// GET /api/parent/dashboard/:childId
export const getDashboardStats = async (req, res) => {
    try {
        const { childId } = req.params;
        const userId = req.auth.sub;

        // Verify child belongs to parent
        const child = await Child.findOne({ _id: childId, parent_id: userId });
        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }

        // Get last 7 days of activity
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const weeklyActivity = await ChildActivity.find({
            child_id: childId,
            date: { $gte: sevenDaysAgo },
        }).sort({ date: 1 });

        // Calculate weekly stats
        const totalMinutes = weeklyActivity.reduce((sum, day) => sum + day.minutes_spent, 0);
        const totalLessons = weeklyActivity.reduce((sum, day) => sum + day.lessons_completed, 0);

        // Aggregate topic breakdown
        const topicBreakdown = {};
        weeklyActivity.forEach(day => {
            if (day.topics_studied) {
                day.topics_studied.forEach((minutes, topic) => {
                    topicBreakdown[topic] = (topicBreakdown[topic] || 0) + minutes;
                });
            }
        });

        // Format for pie chart
        const topicStats = Object.entries(topicBreakdown).map(([name, value]) => ({
            name,
            value,
        }));

        // Format weekly activity for bar chart
        const activityLog = weeklyActivity.map(day => ({
            day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
            min: day.minutes_spent,
            date: day.date,
        }));

        // Get badge count
        const badgeCount = await ChildBadge.countDocuments({ child_id: childId });

        // Get child progress
        const progress = child.child_progress?.[0] || { xp: 0, level: 1, lessons_completed: 0 };

        res.json({
            stats: {
                timeThisWeek: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
                totalMinutes,
                lessonsDone: progress.lessons_completed,
                currentXP: progress.xp,
                currentLevel: progress.level,
                totalBadges: badgeCount,
            },
            topicBreakdown: topicStats,
            weeklyActivity: activityLog,
            child: {
                name: child.name,
                age: child.age,
            },
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/parent/settings/:childId
export const getSettings = async (req, res) => {
    try {
        const { childId } = req.params;
        const userId = req.auth.sub;

        // Verify child belongs to parent
        const child = await Child.findOne({ _id: childId, parent_id: userId });
        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }

        // Get or create settings
        let settings = await ChildSettings.findOne({ child_id: childId });
        if (!settings) {
            settings = await ChildSettings.create({ child_id: childId });
        }

        res.json(settings);
    } catch (error) {
        console.error("Get settings error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/parent/settings/:childId
export const updateSettings = async (req, res) => {
    try {
        const { childId } = req.params;
        const userId = req.auth.sub;
        const updates = req.body;

        // Verify child belongs to parent
        const child = await Child.findOne({ _id: childId, parent_id: userId });
        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }

        // Update or create settings
        const settings = await ChildSettings.findOneAndUpdate(
            { child_id: childId },
            { $set: updates },
            { new: true, upsert: true }
        );

        res.json(settings);
    } catch (error) {
        console.error("Update settings error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/parent/badges/:childId
export const getBadges = async (req, res) => {
    try {
        const { childId } = req.params;
        const userId = req.auth.sub;

        // Verify child belongs to parent
        const child = await Child.findOne({ _id: childId, parent_id: userId });
        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }

        const badges = await ChildBadge.find({ child_id: childId }).sort({ earned_at: -1 });

        res.json(badges);
    } catch (error) {
        console.error("Get badges error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/parent/report/:childId
export const getReportCard = async (req, res) => {
    try {
        const { childId } = req.params;
        const userId = req.auth.sub;

        // Verify child belongs to parent
        const child = await Child.findOne({ _id: childId, parent_id: userId });
        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }

        // Get last 7 days of activity
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const weeklyActivity = await ChildActivity.find({
            child_id: childId,
            date: { $gte: sevenDaysAgo },
        }).sort({ date: 1 });

        // Calculate metrics
        const totalDays = weeklyActivity.length;
        const avgMinutesPerDay = totalDays > 0
            ? weeklyActivity.reduce((sum, day) => sum + day.minutes_spent, 0) / totalDays
            : 0;

        // Analyze topic engagement
        const topicEngagement = {};
        weeklyActivity.forEach(day => {
            if (day.topics_studied) {
                day.topics_studied.forEach((minutes, topic) => {
                    if (!topicEngagement[topic]) {
                        topicEngagement[topic] = { total: 0, days: 0 };
                    }
                    topicEngagement[topic].total += minutes;
                    topicEngagement[topic].days += 1;
                });
            }
        });

        // Identify strengths and areas to grow
        const strengths = [];
        const areasToGrow = [];

        // Consistency strength
        if (totalDays >= 6) {
            strengths.push({
                emoji: "🌟",
                title: "Consistency",
                description: "Has logged in every day this week.",
            });
        }

        // Topic-based analysis
        Object.entries(topicEngagement).forEach(([topic, data]) => {
            const avgPerDay = data.total / data.days;
            if (avgPerDay > 10) {
                strengths.push({
                    emoji: "📖",
                    title: `${topic} Mastery`,
                    description: `Strong engagement with ${topic} topics.`,
                });
            } else if (avgPerDay < 5) {
                areasToGrow.push({
                    emoji: "🌍",
                    title: `${topic} Practice`,
                    description: `Could benefit from more ${topic} content.`,
                });
            }
        });

        // Session length analysis
        const avgSessionLength = avgMinutesPerDay;
        if (avgSessionLength < child.daily_limit * 0.7) {
            areasToGrow.push({
                emoji: "⏳",
                title: "Session Length",
                description: "Often finishes before reaching daily potential.",
            });
        }

        // Generate tip
        const tip = areasToGrow.length > 0
            ? `Try exploring ${areasToGrow[0].title.split(' ')[0]} topics together to boost engagement.`
            : "Great progress! Keep up the consistent learning routine.";

        res.json({
            dateRange: {
                start: sevenDaysAgo.toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0],
            },
            strengths: strengths.slice(0, 2),
            areasToGrow: areasToGrow.slice(0, 2),
            tip,
            metrics: {
                totalDays,
                avgMinutesPerDay: Math.round(avgMinutesPerDay),
                totalLessons: weeklyActivity.reduce((sum, day) => sum + day.lessons_completed, 0),
            },
        });
    } catch (error) {
        console.error("Get report card error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/parent/activity/:childId
export const logActivity = async (req, res) => {
    try {
        const { childId } = req.params;
        const { minutes_spent, lessons_completed, topics_studied } = req.body;
        const userId = req.auth.sub;

        // Verify child belongs to parent
        const child = await Child.findOne({ _id: childId, parent_id: userId });
        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }

        // Get today's date (start of day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Update or create today's activity
        const activity = await ChildActivity.findOneAndUpdate(
            { child_id: childId, date: today },
            {
                $inc: {
                    minutes_spent: minutes_spent || 0,
                    lessons_completed: lessons_completed || 0,
                },
                $set: {
                    topics_studied: topics_studied || {},
                },
            },
            { new: true, upsert: true }
        );

        res.json(activity);
    } catch (error) {
        console.error("Log activity error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
