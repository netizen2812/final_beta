import Child from "../models/Child.js";
import ChildActivity from "../models/ChildActivity.js";
import ChildSettings from "../models/ChildSettings.js";
import ChildBadge from "../models/ChildBadge.js";
import User from "../models/User.js";

// GET /api/parent/dashboard/:childId
export const getDashboardStats = async (req, res) => {
    try {
        const { childId } = req.params;
        const child = req.child; // Provided by isParentOfChild middleware

        // Get last 7 days of activity
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const weeklyActivity = await ChildActivity.find({
            child_id: childId,
            date: { $gte: sevenDaysAgo },
        }).sort({ date: 1 });

        // Calculate weekly stats
        const totalMinutes = weeklyActivity.reduce((sum, day) => sum + day.minutes_spent, 0);
        const totalLessons = weeklyActivity.reduce((sum, day) => sum + day.sessions_attended, 0);

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

        // Get child progress and assignments for deeper KPIs
        const { default: QuranAssignment } = await import("../models/QuranAssignment.js");
        const assignments = await QuranAssignment.find({ studentId: childId });
        
        const totalRevisions = assignments.reduce((sum, a) => sum + (a.revisionCount || 0), 0);
        const practicingAssignments = assignments.filter(a => a.practiceCount > 0);
        const avgPracticeAccuracy = practicingAssignments.length > 0
            ? practicingAssignments.reduce((sum, a) => sum + (a.practiceScore || 0), 0) / practicingAssignments.length
            : 0;

        // Get child progress
        const progress = child.child_progress?.[0] || { xp: 0, level: 1, total_sessions_attended: 0, streak_days: 0 };

        // Calculate total active days (all time)
        const totalActiveDays = await ChildActivity.countDocuments({ child_id: childId });

        res.json({
            stats: {
                timeThisWeek: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
                totalMinutes,
                lessonsDone: progress.total_sessions_attended || 0,
                currentXP: progress.total_xp || 0,
                currentLevel: progress.level || 1,
                averageAccuracy: Math.round(avgPracticeAccuracy),
                totalRevisions: totalRevisions,
                attendanceRate: Math.round((weeklyActivity.length / 7) * 100),
                streak: progress.streak_days || 0,
                activeDays: totalActiveDays
            },
            topicBreakdown: topicStats,
            weeklyActivity: activityLog,
            detailedActivity: weeklyActivity.map(day => ({
                date: day.date,
                minutes: day.minutes_spent,
                sessions: day.sessions_attended,
                topics: Object.fromEntries(day.topics_studied || new Map())
            })),
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
        const child = req.child; // Provided by isParentOfChild middleware

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
        const updates = req.body;
        const child = req.child; // Provided by isParentOfChild middleware

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
        const child = req.child; // Provided by isParentOfChild middleware

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
        const child = req.child; // Provided by isParentOfChild middleware

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
                totalLessons: weeklyActivity.reduce((sum, day) => sum + (day.sessions_attended || 0), 0),
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
        const { minutes_spent, sessions_attended, topics_studied } = req.body;
        const child = req.child; // Provided by isParentOfChild middleware

        // Get today's date (start of day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Update or create today's activity
        const activity = await ChildActivity.findOneAndUpdate(
            { child_id: childId, date: today },
            {
                $inc: {
                    minutes_spent: minutes_spent || 0,
                    sessions_attended: sessions_attended || 0,
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
