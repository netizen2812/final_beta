import User from "../models/User.js";
import Child from "../models/Child.js";
import { calculateLevel } from "../services/gamificationService.js";

// GET /api/child - Get all children for logged-in parent
export const getChildren = async (req, res) => {
    try {
        const userId = req.auth.userId;

        // Find user by clerkId to get MongoDB _id
        const user = await User.findOne({ clerkId: userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        let children = await Child.find({ parent_id: user._id }).sort({ createdAt: -1 });

        // --- ZERO FRICTION AUTO-CREATION ---
        // If a user has Tarbiyah access (or is admin/scholar) but NO profiles, 
        // create a default "My Journey" profile for them.
        if (children.length === 0 && (user.features?.liveAccess || user.role === 'admin' || user.role === 'scholar')) {
            console.log(`[Auto-Profile] Initializing "My Journey" for user: ${user.email}`);
            
            // Create a child User record (for XP/Gamification stability)
            const childClerkId = `child_${Date.now()}_auto`;
            const newChildUser = await User.create({
                clerkId: childClerkId,
                email: `${childClerkId}@placeholder.com`,
                name: "My Journey",
                role: 'student',
                xp: 0
            });

            const newChild = await Child.create({
                parent_id: user._id,
                childUserId: newChildUser._id,
                name: "My Journey",
                age: 0,
                gender: "Boy",
                learning_level: "Beginner",
                child_progress: [{
                    total_xp: 0,
                    level: 1,
                    streak_days: 0,
                    last_active_date: new Date(),
                    total_sessions_attended: 0
                }],
            });

            children = [newChild];
        }

        res.json(children);
    } catch (error) {
        console.error("Get children error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/child - Create a new child profile
export const createChild = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { name, age, gender, learning_level } = req.body;

        // Find parent user by clerkId to get MongoDB _id
        const parentUser = await User.findOne({ clerkId: userId });
        if (!parentUser) {
            return res.status(404).json({ message: "Parent user not found" });
        }

        // Validate required fields
        if (!name || !age || !gender) {
            return res.status(400).json({ message: "Name, age, and gender are required" });
        }

        // Create a new User document for the child
        // We'll generate a placeholder clerkId since they might not have a real Clerk account yet
        // or we could use a UUID. For now, let's use a UUID-like string.
        const childClerkId = `child_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const newChildUser = await User.create({
            clerkId: childClerkId,
            email: `${childClerkId}@placeholder.com`, // Placeholder email
            name: name,
            role: 'student',
            xp: 0
        });

        // Gamification stats will be initialized directly on the Child document

        const child = await Child.create({
            parent_id: parentUser._id,
            childUserId: newChildUser._id,
            name,
            age,
            gender,
            learning_level: learning_level || "Beginner",
            child_progress: [{
                total_xp: 0,
                level: 1,
                streak_days: 0,
                last_active_date: new Date(),
                total_sessions_attended: 0
            }],
        });

        res.status(201).json(child);
    } catch (error) {
        console.error("Create child error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/child/:childId - Update child profile
export const updateChild = async (req, res) => {
    try {
        const { childId } = req.params;
        const updates = req.body;
        const child = req.child; // Provided by isParentOfChild middleware

        // Update child
        Object.assign(child, updates);
        await child.save();

        res.json(child);
    } catch (error) {
        console.error("Update child error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// DELETE /api/child/:childId - Delete child profile
export const deleteChild = async (req, res) => {
    try {
        const { childId } = req.params;
        const child = req.child; // Provided by isParentOfChild middleware

        // Delete associated User document if it exists (for the child)
        if (child.childUserId) {
            await User.findByIdAndDelete(child.childUserId);
        }

        // Delete the child document
        await Child.findByIdAndDelete(childId);

        res.json({ message: "Child deleted successfully" });
    } catch (error) {
        console.error("Delete child error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/child/:childId/progress - Update child progress (XP, level, lessons)
export const updateProgress = async (req, res) => {
    try {
        const { childId } = req.params;
        const { xp, lessons_completed, total_sessions_attended } = req.body;
        const child = req.child; // Provided by isParentOfChild middleware

        // Initialize progress if it doesn't exist
        if (!child.child_progress || child.child_progress.length === 0) {
            child.child_progress = [{
                total_xp: 0,
                level: 1,
                streak_days: 0,
                last_active_date: null,
                total_sessions_attended: 0
            }];
        }

        const progress = child.child_progress[0];
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // Update XP and Level (Using centralized service logic)
        if (xp !== undefined) {
            progress.total_xp += xp;
            progress.level = calculateLevel(progress.total_xp);
        }

        // Update Sessions
        if (total_sessions_attended !== undefined) {
            progress.total_sessions_attended = total_sessions_attended;
        } else if (lessons_completed !== undefined) {
            progress.total_sessions_attended += lessons_completed;
        }

        // Streak Tracking
        if (!progress.last_active_date) {
            progress.streak_days = 1;
        } else {
            const lastActive = new Date(progress.last_active_date);
            const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
            const diffTime = today.getTime() - lastActiveDay.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                // Consecutive day
                progress.streak_days += 1;
            } else if (diffDays > 1) {
                // Streak broken
                progress.streak_days = 1;
            }
            // else diffDays === 0 (already active today), keep current streak
        }

        progress.last_active_date = now;

        await child.save();

        res.json(child);
    } catch (error) {
        console.error("Update progress error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
