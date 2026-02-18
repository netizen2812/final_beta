import Child from "../models/Child.js";
import User from "../models/User.js";

// GET /api/child - Get all children for logged-in parent
export const getChildren = async (req, res) => {
    try {
        const userId = req.auth.sub;

        // Find user by clerkId to get MongoDB _id
        const user = await User.findOne({ clerkId: userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const children = await Child.find({ parent_id: user._id }).sort({ createdAt: -1 });

        res.json(children);
    } catch (error) {
        console.error("Get children error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/child - Create a new child profile
export const createChild = async (req, res) => {
    try {
        const userId = req.auth.sub;
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

        // Initialize TarbiyahUserStats for the new child
        await import("../models/TarbiyahUserStats.js").then(async ({ default: TarbiyahUserStats }) => {
            await TarbiyahUserStats.create({
                childUserId: newChildUser._id, // Use MongoDB _id
                totalXP: 0,
                level: 1,
                lessonsCompleted: 0,
                badgesEarned: [],
                lastActivityAt: new Date()
            });
        });

        const child = await Child.create({
            parent_id: parentUser._id,
            childUserId: newChildUser._id,
            name,
            age,
            gender,
            learning_level: learning_level || "Beginner",
            child_progress: [{
                xp: 0,
                level: 1,
                lessons_completed: 0,
                last_activity: new Date(),
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
        const userId = req.auth.sub;
        const updates = req.body;

        // Find user by clerkId to get MongoDB _id
        const user = await User.findOne({ clerkId: userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify child belongs to parent and update
        const child = await Child.findOneAndUpdate(
            { _id: childId, parent_id: user._id },
            { $set: updates },
            { new: true }
        );

        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }

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
        const userId = req.auth.sub;

        // Find user by clerkId to get MongoDB _id
        const user = await User.findOne({ clerkId: userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify child belongs to parent and delete
        const child = await Child.findOneAndDelete({
            _id: childId,
            parent_id: user._id,
        });

        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }

        // Delete associated User document if it exists (for the child)
        if (child.childUserId) {
            await User.findByIdAndDelete(child.childUserId);

            // Delete associated TarbiyahUserStats
            await import("../models/TarbiyahUserStats.js").then(async ({ default: TarbiyahUserStats }) => {
                await TarbiyahUserStats.findOneAndDelete({ childUserId: child.childUserId });
            });

            // Delete associated TarbiyahProgress
            await import("../models/TarbiyahProgress.js").then(async ({ default: TarbiyahProgress }) => {
                await TarbiyahProgress.deleteMany({ childUserId: child.childUserId });
            });
        }

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
        const userId = req.auth.sub;
        const { xp, level, lessons_completed } = req.body;

        // Find user by clerkId to get MongoDB _id
        const user = await User.findOne({ clerkId: userId });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify child belongs to parent
        const child = await Child.findOne({ _id: childId, parent_id: user._id });
        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }

        // Update progress
        if (!child.child_progress || child.child_progress.length === 0) {
            child.child_progress = [{
                xp: xp || 0,
                level: level || 1,
                lessons_completed: lessons_completed || 0,
                last_activity: new Date(),
            }];
        } else {
            child.child_progress[0].xp = xp !== undefined ? xp : child.child_progress[0].xp;
            child.child_progress[0].level = level !== undefined ? level : child.child_progress[0].level;
            child.child_progress[0].lessons_completed = lessons_completed !== undefined ? lessons_completed : child.child_progress[0].lessons_completed;
            child.child_progress[0].last_activity = new Date();
        }

        await child.save();

        res.json(child);
    } catch (error) {
        console.error("Update progress error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
