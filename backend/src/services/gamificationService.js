import Child from "../models/Child.js";
import ChildActivity from "../models/ChildActivity.js";

export const calculateLevel = (xp) => {
    // 100 XP per level
    // L1: 0-99
    // L2: 100-199
    // L3: 200-299
    return Math.floor(Math.max(0, xp) / 100) + 1;
};

const updateStreak = (progress) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    if (!progress.last_active_date) {
        progress.streak_days = 1;
        progress.last_active_date = now;
        return;
    }

    const lastDate = progress.last_active_date;
    const lastActiveDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
    
    const diffDays = Math.round((today - lastActiveDay) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
        progress.streak_days += 1;
    } else if (diffDays > 1) {
        progress.streak_days = 1; 
    }
    progress.last_active_date = now;
};

/**
 * Awards XP to a child and updates their gamification stats.
 * @param {string} childId The MongoDB ID of the child.
 * @param {string} action "recitation", "participation", or "session_complete".
 * @param {Object} data Context data like { score: 3 } or { points: 5 }.
 * @returns {Object} { xpGained, newLevel }
 */
export const awardXP = async (childId, action, data = {}) => {
    try {
        const { default: Child } = await import("../models/Child.js");
        const child = await Child.findById(childId);
        if (!child) throw new Error("Child not found");

        if (!child.child_progress || child.child_progress.length === 0) {
            child.child_progress = [{
                total_xp: 0, level: 1, streak_days: 0, 
                last_active_date: null, total_sessions_attended: 0, total_correct_recitations: 0
            }];
        }

        const progress = child.child_progress[0];
        let xpGained = 0;
        let activityType = "";
        let activityDuration = 0;

        // Daily Streak Validation
        updateStreak(progress);

        if (action === "recitation") {
            const { score } = data; 
            xpGained = score || 2;
            activityType = "Quran Practice";
            activityDuration = 10; // Default practice time

            if (score >= 10) {
                progress.total_correct_recitations += 1;
            } else if (score >= 7) {
                 progress.total_correct_recitations += 1;
            }
        } 
        else if (action === "participation") {
            const { points } = data; 
            xpGained = points || 2;
            activityType = "Class Participation";
            activityDuration = 5; // Default participation time
        } 
        else if (action === "session_complete") {
            xpGained = 2; // Scaled down from 10
            progress.total_sessions_attended += 1;
            activityType = "Live Class";
            activityDuration = data.duration || 45;
            
            const { batchId, sessionId, duration } = data;
            
            // Push structured attendance record
            if (batchId || sessionId) {
                progress.attendance = progress.attendance || [];
                progress.attendance.push({
                    batchId: batchId || null,
                    sessionId: sessionId || null,
                    date: new Date(),
                    status: 'present',
                    type: 'session_complete'
                });
            }
        }

        // Log to ChildActivity for Parent Dashboard analytics
        if (activityType) {
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const { default: ChildActivity } = await import("../models/ChildActivity.js");
                await ChildActivity.findOneAndUpdate(
                    { child_id: childId, date: today },
                    {
                        $inc: {
                            minutes_spent: activityDuration,
                            sessions_attended: (action === "session_complete") ? 1 : 0,
                            [`topics_studied.${activityType}`]: activityDuration
                        }
                    },
                    { new: true, upsert: true }
                );
            } catch(e) {
                console.error("Failed to log ChildActivity", e);
            }
        }

        progress.total_xp += xpGained;

        // Calculate Level
        const oldLevel = progress.level;
        progress.level = calculateLevel(progress.total_xp);

        child.markModified('child_progress');
        await child.save();

        return {
            xpGained,
            newLevel: progress.level > oldLevel ? progress.level : null,
            total_xp: progress.total_xp,
            level: progress.level,
            streak: progress.streak_days
        };
    } catch (err) {
        console.error("Error awarding XP:", err);
        return { xpGained: 0, newLevel: null };
    }
};
