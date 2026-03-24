import Child from "../models/Child.js";
import ChildActivity from "../models/ChildActivity.js";

export const calculateLevel = (xp) => {
    // Progressive curve designed for a 16-session monthly batch (~600-720 XP/month)
    // Target ~4 levels in month 1: Level = floor(sqrt(max(0, xp) / 50)) + 1
    // L1: 0 XP
    // L2: 50 XP (quick initial dopamine hit, ~2 sessions)
    // L3: 200 XP (~1 week)
    // L4: 450 XP (~2-3 weeks)
    // L5: 800 XP (~1 month worth of Live classes)
    // L6: 1250 XP (~1.5 months)
    // L10: 4050 XP (~6 months)
    return Math.floor(Math.sqrt(Math.max(0, xp) / 50)) + 1;
};

const checkBadges = (progress) => {
    const newBadges = [];
    const current = new Set(progress.badges || []);

    if (progress.total_sessions_attended >= 1 && !current.has("first_recitation")) newBadges.push("first_recitation");
    if (progress.total_correct_recitations >= 1 && !current.has("perfect_score")) newBadges.push("perfect_score");
    if (progress.total_sessions_attended >= 3 && !current.has("consistent_learner")) newBadges.push("consistent_learner");
    if (progress.total_xp >= 100 && !current.has("rising_star")) newBadges.push("rising_star");
    if (progress.streak_days >= 3 && !current.has("on_fire")) newBadges.push("on_fire");

    return newBadges;
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
 * @returns {Object} { xpGained, newLevel, newBadges earned today }
 */
export const awardXP = async (childId, action, data = {}) => {
    try {
        const child = await Child.findById(childId);
        if (!child) throw new Error("Child not found");

        if (!child.child_progress || child.child_progress.length === 0) {
            child.child_progress = [{
                total_xp: 0, level: 1, badges: [], streak_days: 0, 
                last_active_date: null, total_sessions_attended: 0, total_correct_recitations: 0
            }];
        }

        const progress = child.child_progress[0];
        let xpGained = 0;

        // Daily Streak Validation
        updateStreak(progress);

        if (action === "recitation") {
            const { score, rawScore } = data; 
            xpGained = score || 0;

            if (rawScore === 3 || score >= 30) {
                progress.total_correct_recitations += 1;
            }
        } 
        else if (action === "participation") {
            const { points } = data; // +5, +2
            xpGained = points || 2;
        } 
        else if (action === "session_complete") {
            xpGained = 10;
            progress.total_sessions_attended += 1;
            
            const { batchId, sessionId, duration } = data;
            
            // Push structured attendance record
            if (batchId || sessionId) {
                child.attendance = child.attendance || [];
                child.attendance.push({
                    batchId: batchId || null,
                    sessionId: sessionId || null,
                    date: new Date(),
                    status: 'present',
                    type: 'session_complete'
                });
            }

            // Log strictly to ChildActivity for Parent Dashboard analytics
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                await ChildActivity.findOneAndUpdate(
                    { child_id: childId, date: today },
                    {
                        $inc: {
                            minutes_spent: duration || 45,
                            sessions_attended: 1,
                        },
                        $set: {
                            // Optionally tag topics 
                            "topics_studied.Live Class": duration || 45
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

        // Check Badges
        const newBadges = checkBadges(progress);
        if (newBadges.length > 0) {
            progress.badges = [...(progress.badges || []), ...newBadges];
        }

        await child.save();

        return {
            xpGained,
            newLevel: progress.level > oldLevel ? progress.level : null,
            newBadges: newBadges.length > 0 ? newBadges : null,
            total_xp: progress.total_xp,
            level: progress.level,
            streak: progress.streak_days
        };
    } catch (err) {
        console.error("Error awarding XP:", err);
        return { xpGained: 0, newLevel: null, newBadges: null };
    }
};
