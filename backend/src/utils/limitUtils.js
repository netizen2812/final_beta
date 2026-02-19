import Child from "../models/Child.js";
import ChildActivity from "../models/ChildActivity.js";

/**
 * Checks if a child has reached their daily usage limit.
 * @param {string} childId - The child's ID (Child document _id, NOT childUserId string if possible, but we handle both)
 * @returns {Promise<{ allowed: boolean, limit: number, spent: number, remaining: number }>}
 */
export const checkDailyLimit = async (childId) => {
    try {
        // Handle both ObjectID and String ID
        const child = await Child.findById(childId) || await Child.findOne({ childUserId: childId });

        if (!child) {
            throw new Error("Child not found");
        }

        const limit = child.daily_limit || 45; // Default 45 mins

        // Get today's activity
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activity = await ChildActivity.findOne({
            child_id: child._id,
            date: today
        });

        const spent = activity ? activity.minutes_spent : 0;
        const remaining = Math.max(0, limit - spent);

        return {
            allowed: spent < limit,
            limit,
            spent,
            remaining
        };
    } catch (error) {
        console.error("Error checking daily limit:", error);
        // Fail open or closed? Closed is safer for "parent control" features, but Open is less annoying if bug.
        // Let's fail safe (return allowed=false) to signal error, or handle gracefully.
        return { allowed: false, error: error.message };
    }
};

/**
 * Updates the child's activity minutes for today.
 * @param {string} childId 
 * @param {number} minutesToAdd 
 */
export const addActivityMinutes = async (childId, minutesToAdd) => {
    try {
        const child = await Child.findById(childId) || await Child.findOne({ childUserId: childId });
        if (!child) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await ChildActivity.findOneAndUpdate(
            { child_id: child._id, date: today },
            { $inc: { minutes_spent: minutesToAdd } },
            { upsert: true, new: true }
        );
    } catch (error) {
        console.error("Error adding activity minutes:", error);
    }
};
