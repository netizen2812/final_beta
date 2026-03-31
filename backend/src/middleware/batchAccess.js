import User from "../models/User.js";
import Child from "../models/Child.js";
import Batch from "../models/Batch.js";

/**
 * Middleware to verify if the authenticated user has access to a specific batch.
 * logic:
 * - Admins: Full access.
 * - Scholars: Access only to batches they are assigned to.
 * - Parents: Access only if one of their children is enrolled in the batch.
 * - Students: Access only if they are enrolled in the batch.
 */
export async function canAccessBatch(req, res, next) {
    try {
        const userId = req.auth?.userId;
        const { id: batchId } = req.params;

        if (!userId) return res.status(401).json({ message: "Unauthorized: Missing identity" });
        if (!batchId) return res.status(400).json({ message: "Bad Request: Missing Batch ID" });

        const user = await User.findOne({ clerkId: userId });
        if (!user) return res.status(401).json({ message: "Unauthorized: User record not found" });

        // 1. Admin Bypass
        if (user.role === "admin") return next();

        // 2. Scholar Check
        if (user.role === "scholar") {
            const batch = await Batch.findById(batchId);
            if (!batch) return res.status(404).json({ message: "Batch not found" });

            const isAssigned = batch.scholar.toString() === user._id.toString() || 
                               (batch.scholarEmail && batch.scholarEmail.toLowerCase() === user.email.toLowerCase());
            
            if (isAssigned) return next();
            return res.status(403).json({ message: "Forbidden: You are not assigned to this batch" });
        }

        // 3. Parent Check
        if (user.role === "parent") {
            const batch = await Batch.findById(batchId);
            if (!batch) return res.status(404).json({ message: "Batch not found" });

            const parentChildren = await Child.find({ parent_id: user._id }).select("_id");
            const childIds = parentChildren.map(c => c._id.toString());
            const enrolledChildIds = (batch.students || []).map(s => s.toString());

            const hasEnrolledChild = childIds.some(id => enrolledChildIds.includes(id));
            if (hasEnrolledChild) return next();
            
            return res.status(403).json({ message: "Forbidden: No enrolled children in this batch" });
        }

        // 4. Student Check
        if (user.role === "student") {
            const batch = await Batch.findById(batchId);
            if (!batch) return res.status(404).json({ message: "Batch not found" });

            const studentChild = await Child.findOne({ childUserId: user._id });
            if (!studentChild) return res.status(403).json({ message: "Forbidden: Child profile not found" });

            const isEnrolled = (batch.students || []).map(s => s.toString()).includes(studentChild._id.toString());
            if (isEnrolled) return next();

            return res.status(403).json({ message: "Forbidden: You are not enrolled in this batch" });
        }

        return res.status(403).json({ message: "Forbidden: Role not authorized for batch access" });

    } catch (error) {
        console.error("Batch access middleware error:", error);
        res.status(500).json({ message: "Server error during batch authorization" });
    }
}
