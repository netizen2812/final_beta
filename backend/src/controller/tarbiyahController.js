import TarbiyahProgress from "../models/TarbiyahProgress.js";
import TarbiyahUserStats from "../models/TarbiyahUserStats.js";
import Child from "../models/Child.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { calculateRank, getBadgesCount } from "../utils/tarbiyahUtils.js";
import { trackEvent } from "../services/analyticsService.js";

// Helper function to format minutes to "Xh Ym" format
const formatMinutes = (totalMinutes) => {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
};

// Helper function to calculate percent change
const calculatePercentChange = (current, previous) => {
    if (previous === 0) return current > 0 ? "+100%" : "0%";
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? "+" : "";
    return `${sign}${Math.round(change)}%`;
};

// Helper function to get date range
const getDateRange = (daysAgo) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
};

// GET /api/tarbiyah/parent/dashboard/:childId
export const getParentDashboard = async (req, res) => {
    try {
        const { childUserId: childDocId } = req.params; // receiving Child Document ID
        const parentId = req.auth.sub; // Clerk ID of parent

        // 1. Verify Parent
        const parentUser = await User.findOne({ clerkId: parentId });
        if (!parentUser) {
            return res.status(404).json({ message: "Parent not found" });
        }

        // 2. Verify Child belongs to Parent
        const childDoc = await Child.findOne({ _id: childDocId, parent_id: parentUser._id });

        if (!childDoc) {
            return res.status(404).json({ message: "Child not found or not authorized" });
        }

        // 3. Get the actual User ID for the child from the Child document
        if (!childDoc.childUserId) {
            // If legacy data, maybe we can't return full dashboard or need to handle migration
            // For now return error or empty dashboard
            return res.status(400).json({ message: "Child account setup incomplete (no user ID)" });
        }

        const realChildUserId = String(childDoc.childUserId);

        // 4. Fetch Stats using realChildUserId
        const settings = await TarbiyahUserStats.findOne({ childUserId: realChildUserId }) || {
            dailyLimitMinutes: 45,
            contentFilter: "Age: 5-8 Years",
            reportCardEnabled: true,
            badgesEarned: []
        };

        // --- Real Data Aggregation ---

        // A. Completion Stats
        const completedLessonsCount = await TarbiyahProgress.countDocuments({
            childUserId: realChildUserId,
            completedAt: { $ne: null }
        });

        // Calculate Total XP from Progress to match Badge logic
        const allProgress = await TarbiyahProgress.find({ childUserId: realChildUserId });
        const totalXP = allProgress.reduce((sum, p) => {
            // Sanity Check: Cap lesson XP at 150 to fix previous inflation bugs
            // This ensures the dashboard displays the corrected value even if DB has bad data
            const safeXP = Math.min(p.xpEarned || 0, 150);
            return sum + safeXP;
        }, 0);

        // --- SHARED UTILS CALCULATION ---
        const rankData = calculateRank(totalXP);
        const badgesEarnedCount = getBadgesCount(rankData.currentRank.level);

        console.log(`[Dashboard] Child: ${realChildUserId} | XP: ${totalXP} | Rank: ${rankData.currentRank.title} (Lvl ${rankData.currentRank.level}) | Badges: ${badgesEarnedCount}`);

        const totalLessons = 10; // Updated to 10 as requested
        const completionPercentage = Math.min(100, Math.round((completedLessonsCount / totalLessons) * 100));

        // B. Time This Week (Approximation: 15 mins per completed lesson)
        // Find lessons completed in the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentProgress = await TarbiyahProgress.find({
            childUserId: realChildUserId,
            completedAt: { $gte: sevenDaysAgo }
        });

        const lessonsThisWeek = recentProgress.length;
        const timeThisWeekMinutes = lessonsThisWeek * 15; // Approx 15 mins per lesson
        const formattedTime = formatMinutes(timeThisWeekMinutes);

        // C. Activity Log (Last 7 Days)
        const activityMap = {};
        // Initialize last 7 days with 0
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            activityMap[dayName] = 0;
        }

        // Fill with data (XP or Minutes) - Let's use Minutes (15 per lesson)
        recentProgress.forEach(p => {
            if (p.completedAt) {
                const dayName = new Date(p.completedAt).toLocaleDateString('en-US', { weekday: 'short' });
                if (activityMap[dayName] !== undefined) {
                    activityMap[dayName] += 15;
                }
            }
        });



        const activityLog = {
            days: Object.keys(activityMap),
            minutes: Object.values(activityMap)
        };

        // --- SYNC FIX: Update Child Document with aggregated stats ---
        // This ensures the Kids Area (which uses Child doc) matches the Dashboard (which uses Progress logs)
        await Child.findOneAndUpdate(
            { childUserId: realChildUserId },
            {
                $set: {
                    "child_progress.0.xp": totalXP,
                    "child_progress.0.level": rankData.currentRank.level,
                    "child_progress.0.lessons_completed": completedLessonsCount,
                    "child_progress.0.last_activity": new Date()
                }
            }
        );

        const topicData = [
            { name: 'Completed', value: Math.min(completedLessonsCount, 10), fill: '#10b981' },
            { name: 'Remaining', value: Math.max(0, 10 - completedLessonsCount), fill: '#e2e8f0' }
        ];

        res.json({
            dashboard: {
                currentXP: totalXP,
                currentLevel: rankData.currentRank.level,
                timeThisWeek: {
                    total: formattedTime,
                    percentChange: "+100%", // Simplified for now
                    comparisonText: "active"
                },
                lessonsDone: {
                    completed: completedLessonsCount,
                    inProgress: 0,
                    total: totalLessons
                },
                currentFocus: {
                    moduleName: "Journey",
                    progress: `${completionPercentage}%`,
                    lessonTitle: "Keep Going!"
                },
                totalBadges: {
                    count: badgesEarnedCount, // Corrected logic: badges = rank level
                    showcaseUrl: "/badges",
                    currentBadgeName: rankData.currentRank.title,
                    currentBadgeIcon: rankData.currentRank.icon
                },
                topicBreakdown: topicData,
                totalProgress: {
                    completed: completedLessonsCount,
                    total: totalLessons,
                    percentage: completionPercentage
                },
                activityLog,
                settings,
            }
        });

    } catch (error) {
        console.error("Get parent dashboard error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// PATCH /api/tarbiyah/parent/settings/:childUserId
export const updateParentSettings = async (req, res) => {
    try {
        const { childUserId } = req.params;
        const { dailyLimitMinutes } = req.body;

        // Validate input
        if (dailyLimitMinutes === undefined) {
            return res.status(400).json({
                success: false,
                message: "dailyLimitMinutes is required",
            });
        }

        if (typeof dailyLimitMinutes !== "number" || dailyLimitMinutes < 0) {
            return res.status(400).json({
                success: false,
                message: "dailyLimitMinutes must be a positive number",
            });
        }

        const updateData = { dailyLimitMinutes };

        // Update or create user stats
        const userStats = await TarbiyahUserStats.findOneAndUpdate(
            { childUserId },
            { $set: updateData },
            { new: true, upsert: true }
        );

        res.status(200).json({
            success: true,
            message: "Settings updated successfully",
            settings: {
                dailyLimitMinutes: userStats.dailyLimitMinutes,
            },
        });
    } catch (error) {
        console.error("Error updating parent settings:", error);
        res.status(500).json({
            success: false,
            message: "Failed to update settings",
            error: error.message,
        });
    }
};
// POST /api/tarbiyah/progress
export const updateLessonProgress = async (req, res) => {
    try {
        const { childUserId, lessonId, lessonTitle, xpEarned, scores, completed } = req.body;
        const parentId = req.auth.sub;

        // 1. Verify Parent (Optional but good for security if we had parentId in body, but here we trust the childUserId is valid for now or could verify parent relation if needed.
        // For simplicity and since we are using childUserId directly:
        const user = await User.findOne({ clerkId: parentId });
        if (!user) {
            return res.status(404).json({ message: "Parent not found" });
        }

        // 2 Verify child belongs to parent
        const childDoc = await Child.findOne({ childUserId: childUserId, parent_id: user._id });
        if (!childDoc) {
            return res.status(403).json({ message: "Not authorized for this child" });
        }

        // 3. Update or Create TarbiyahProgress
        // valid fields: childUserId, lessonId, lessonTitle, badge, videoWatchedAt, quizAttempts, completedAt, xpEarned

        const updateData = {
            lessonTitle,
            // If completed, set completedAt
            ...(completed ? { completedAt: new Date(), xpEarned } : {}),
            // If we have quiz scores/attempts, push them
        };

        let progressDoc = await TarbiyahProgress.findOne({ childUserId: String(childUserId), lessonId });

        if (!progressDoc) {
            progressDoc = new TarbiyahProgress({
                childUserId: String(childUserId),
                lessonId,
                lessonTitle,
                xpEarned: xpEarned || 0,
                completedAt: completed ? new Date() : null,
                quizAttempts: scores ? [scores] : []
            });
            trackEvent(childUserId, 'LESSON_STARTED', { lessonId, lessonTitle });
        } else {
            // BUG FIX: Prevent XP inflation. Only award XP if the lesson was NOT previously completed.
            // If it's already completed, we might update scores but NOT add to total XP again.
            if (completed && !progressDoc.completedAt) {
                progressDoc.completedAt = new Date();
                progressDoc.xpEarned = (progressDoc.xpEarned || 0) + (xpEarned || 0);

                trackEvent(childUserId, 'LESSON_COMPLETED', {
                    lessonId,
                    lessonTitle,
                    xpEarned: progressDoc.xpEarned
                });

                console.log(`[XP Update] Lesson ${lessonId} completed for first time. Awarding ${xpEarned} XP.`);
            } else {
                console.log(`[XP Update] Lesson ${lessonId} updated. Completed status: ${!!progressDoc.completedAt}. skipping XP addition to prevent duplicate.`);
            }

            if (scores) {
                progressDoc.quizAttempts.push(scores);
                // Cap quiz attempts to last 10 to prevent infinite growth exploit
                if (progressDoc.quizAttempts.length > 10) {
                    progressDoc.quizAttempts = progressDoc.quizAttempts.slice(-10);
                }
            }
        }

        await progressDoc.save();

        // 4. Also update User Stats (TarbiyahUserStats) for granular tracking if needed
        // The childController updateProgress handles total XP/Level.
        // We might want to update lessonsCompleted count here.
        if (completed) {
            await TarbiyahUserStats.findOneAndUpdate(
                { childUserId },
                {
                    $inc: { lessonsCompleted: 1 },
                    $set: { lastActivityAt: new Date() }
                },
                { upsert: true }
            );

            // Sync with Child Document for frontend consistency
            // We fetch the current sum to be accurate, but CAP inflated values from legacy bugs
            const allProgress = await TarbiyahProgress.find({ childUserId });
            const totalXP = allProgress.reduce((sum, p) => {
                // Sanity Check: Cap lesson XP at 150 to fix previous inflation bugs
                // Only lessons with > 150 XP ( impossible in normal flow) will be capped
                const safeXP = Math.min(p.xpEarned || 0, 150);
                return sum + safeXP;
            }, 0);

            const totalLessons = allProgress.filter(p => p.completedAt).length;

            // Use Shared Utility for Rank/Level
            const rankData = calculateRank(totalXP);

            await Child.findOneAndUpdate(
                { childUserId: childUserId },
                {
                    $set: {
                        "child_progress.0.xp": totalXP,
                        "child_progress.0.level": rankData.currentRank.level,
                        "child_progress.0.lessons_completed": totalLessons,
                        "child_progress.0.last_activity": new Date()
                    }
                }
            );
        }

        res.json({ success: true, progress: progressDoc });

    } catch (error) {
        console.error("Update lesson progress error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
