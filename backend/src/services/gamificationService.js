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
    // Use UTC boundaries specifically if reporting "inaccuracies" due to local time shifts, 
    // or just local server day boundaries. Here we stick to local server day for simplicity 
    // but ensure streak_days is properly initialized.
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    if (!progress.last_active_date || progress.streak_days === 0) {
        progress.streak_days = 1;
        progress.last_active_date = now;
        return now;
    }

    const lastDate = new Date(progress.last_active_date);
    const lastActiveDay = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate()).getTime();
    
    // Exact day difference
    const diffDays = Math.round((today - lastActiveDay) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
        progress.streak_days += 1;
    } else if (diffDays > 1) {
        progress.streak_days = 1; 
    }
    // If diffDays === 0, streak remains same, but we update last_active_date
    progress.last_active_date = now;
    return now;
};

/**
 * Awards XP to multiple children efficiently using bulkWrite.
 * @param {Array} studentIds Array of child MongoDB IDs.
 * @param {string} action "participation" or "session_complete".
 * @param {Object} commonData Shared context like { batchId, sessionId, points }.
 */
export const awardXPBulk = async (studentIds, action, commonData = {}) => {
    if (!studentIds || studentIds.length === 0) return { success: true };
    
    try {
        const { default: Child } = await import("../models/Child.js");
        const { default: ChildActivity } = await import("../models/ChildActivity.js");
        const { default: XPLog } = await import("../models/XPLog.js");

        let xpGained = 0;
        let activityType = "";
        let activityDuration = 0;
        const now = new Date();
        const todayAtZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        if (action === "participation") {
            xpGained = commonData.points || 2;
            activityType = "Class Participation";
            activityDuration = 5;
        } else if (action === "session_complete") {
            xpGained = 2;
            activityType = "Live Class";
            activityDuration = commonData.duration || 45;
        }

        const childBulkOps = [];
        const activityBulkOps = [];
        const xpLogs = [];

        for (const childId of studentIds) {
            // 1. Child XP Update
            const xpUpdate = {
                $inc: {
                    "child_progress.0.total_xp": xpGained,
                    "child_progress.0.total_sessions_attended": (action === "session_complete") ? 1 : 0
                },
                $set: {
                    "child_progress.0.last_active_date": now
                }
            };

            if (action === "session_complete" && (commonData.batchId || commonData.sessionId)) {
                xpUpdate.$push = {
                    "child_progress.0.attendance": {
                        batchId: commonData.batchId || null,
                        sessionId: commonData.sessionId || null,
                        date: now,
                        status: 'present',
                        type: 'session_complete'
                    }
                };
            }

            childBulkOps.push({
                updateOne: {
                    filter: { _id: childId },
                    update: xpUpdate
                }
            });

            // 2. Activity Logging
            activityBulkOps.push({
                updateOne: {
                    filter: { child_id: childId, date: todayAtZero },
                    update: {
                        $inc: {
                            minutes_spent: activityDuration,
                            sessions_attended: (action === "session_complete") ? 1 : 0,
                            [`topics_studied.${activityType}`]: activityDuration
                        }
                    },
                    upsert: true
                }
            });

            // 3. XP Transaction Logs
            xpLogs.push({
                childId,
                action,
                xpGained,
                batchId: commonData.batchId || null,
                sessionId: commonData.sessionId || null,
                metadata: commonData
            });
        }

        // Execute all batches
        await Promise.all([
            Child.bulkWrite(childBulkOps),
            ChildActivity.bulkWrite(activityBulkOps),
            XPLog.insertMany(xpLogs)
        ]);

        return { success: true, count: studentIds.length };
    } catch (err) {
        console.error("Error in awardXPBulk:", err);
        return { success: false, error: err.message };
    }
};

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
        const now = updateStreak(progress);

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

                // --- NEW: INDIVIDUAL TRANSACTION LOGGING ---
                const { default: XPLog } = await import("../models/XPLog.js");
                await XPLog.create({
                    childId,
                    action,
                    xpGained,
                    batchId: data.batchId || null,
                    sessionId: data.sessionId || null,
                    metadata: data
                });
            } catch(e) {
                console.error("Failed to log Activity/XP event", e);
            }
        }

        // Atomic increment of XP and update other fields
        const xpUpdate = {
            $inc: {
                "child_progress.0.total_xp": xpGained,
                "child_progress.0.total_sessions_attended": (action === "session_complete") ? 1 : 0,
                "child_progress.0.total_correct_recitations": (action === "recitation" && (data.score >= 7)) ? 1 : 0
            },
            $set: {
                "child_progress.0.last_active_date": now,
                "child_progress.0.streak_days": progress.streak_days
            }
        };

        // If it's a session completion, we also push to attendance history atomically
        if (action === "session_complete" && (data.batchId || data.sessionId)) {
            xpUpdate.$push = {
                "child_progress.0.attendance": {
                    batchId: data.batchId || null,
                    sessionId: data.sessionId || null,
                    date: new Date(),
                    status: 'present',
                    type: 'session_complete'
                }
            };
        }

        const updatedChild = await Child.findByIdAndUpdate(
            childId,
            xpUpdate,
            { new: true }
        );

        if (!updatedChild) throw new Error("Child update failed");
        
        const updatedProgress = updatedChild.child_progress[0];
        const newLevel = calculateLevel(updatedProgress.total_xp);
        
        if (newLevel !== updatedProgress.level) {
            await Child.updateOne(
                { _id: childId },
                { $set: { "child_progress.0.level": newLevel } }
            );
        }

        return {
            xpGained,
            newLevel: newLevel > updatedProgress.level ? newLevel : null,
            total_xp: updatedProgress.total_xp,
            level: newLevel,
            streak: updatedProgress.streak_days
        };
    } catch (err) {
        console.error("Error awarding XP:", err);
        return { xpGained: 0, newLevel: null };
    }
};
