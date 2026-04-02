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
            child_id: child._id,
            date: { $gte: sevenDaysAgo },
        }).sort({ date: 1 });

        // Calculate weekly stats
        const totalMinutes = weeklyActivity.reduce((sum, day) => sum + day.minutes_spent, 0);
        const totalLessons = weeklyActivity.reduce((sum, day) => sum + day.sessions_attended, 0);

        // --- NEW: REAL ATTENDANCE CALCULATION ---
        const { default: Batch } = await import("../models/Batch.js");
        const studentBatches = await Batch.find({ students: child._id });
        
        let totalSessionsHeld = 0;
        let sessionsAttended = 0;

        studentBatches.forEach(batch => {
            (batch.pastSessions || []).forEach(session => {
                const sessionDate = new Date(session.startedAt);
                if (sessionDate >= sevenDaysAgo) {
                    totalSessionsHeld++;
                    const isAttended = session.attendedChildren && 
                        session.attendedChildren.some(id => id.toString() === child._id.toString());
                    if (isAttended) {
                        sessionsAttended++;
                    }
                }
            });
        });

        const attendanceRate = totalSessionsHeld > 0 
            ? Math.round((sessionsAttended / totalSessionsHeld) * 100) 
            : 0;
        // ----------------------------------------

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
        const assignments = await QuranAssignment.find({ studentId: child._id });
        
        const totalRevisions = assignments.reduce((sum, a) => sum + (a.revisionCount || 0), 0);
        const practicingAssignments = assignments.filter(a => a.practiceCount > 0);
        const avgPracticeAccuracy = practicingAssignments.length > 0
            ? practicingAssignments.reduce((sum, a) => sum + (a.practiceScore || 0), 0) / practicingAssignments.length
            : 0;

        // Get child progress and completion
        const progress = child.child_progress?.[0] || { 
            xp: 0, 
            level: 1, 
            total_sessions_attended: 0, 
            streak_days: 0,
            completed_quran_parts: [] 
        };

        const manualParts = new Set(progress.completed_quran_parts || []);
        
        // Find completed assignments to include in progress
        const completedAssignments = await QuranAssignment.find({ 
            studentId: child._id, 
            status: 'completed' 
        });
        
        completedAssignments.forEach(a => {
           manualParts.add(`J${a.juz}P${a.subpart}`);
        });

        const totalCompletedParts = manualParts.size;
        const completionRate = Math.round((totalCompletedParts / 450) * 100);

        // Calculate total active days (all time)
        const totalActiveDays = await ChildActivity.countDocuments({ child_id: child._id });

        res.json({
            stats: {
                currentXP: progress.total_xp || 0,
                currentLevel: progress.level || 1,
                averageAccuracy: Math.round(avgPracticeAccuracy),
                totalRevisions: totalRevisions,
                attendanceRate: attendanceRate, // Adjusted to real class %
                streak: progress.streak_days || 0,
                activeDays: totalActiveDays,
                completionRate: completionRate,
                completed_quran_parts: Array.from(manualParts)
            },
            timeThisWeek: {
                total: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
                percentChange: "+0%", // Default if no previous week
                comparisonText: "vs last week"
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

// GET /api/parent/quran-meta/:juz
export const getQuranMeta = async (req, res) => {
    try {
        const { juz } = req.params;
        const { default: JuzSubpart } = await import("../models/JuzSubpart.js");
        const metadata = await JuzSubpart.findOne({ juz: parseInt(juz) });
        
        if (!metadata) {
            return res.status(404).json({ message: "Juz metadata not found" });
        }
        
        res.json(metadata);
    } catch (error) {
        console.error("Get Quran meta error:", error);
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

/**
 * Bulk update Quran subpart completions for a child.
 * POST /api/parent/completion/:childId
 */
export const bulkUpdateCompletion = async (req, res) => {
    try {
        const { childId } = req.params;
        const { parts } = req.body; // Array of strings like ["J1P1", "J1P2"]
        const child = req.child;

        if (!Array.isArray(parts)) {
            return res.status(400).json({ message: "Invalid parts data" });
        }

        // Update the child's progress (index 0)
        await Child.updateOne(
            { _id: child._id, "child_progress.0": { $exists: true } },
            { $set: { "child_progress.0.completed_quran_parts": parts } }
        );

        res.json({ message: "Progress updated successfully", count: parts.length });
    } catch (error) {
        console.error("Bulk update error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
