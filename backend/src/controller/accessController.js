import User from "../models/User.js";
import AccessRequest from "../models/AccessRequest.js";

// POST /api/live/access/request
export const requestAccess = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const user = await User.findOne({ clerkId: userId });
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.features?.liveAccess) {
            return res.status(400).json({ message: "You already have access" });
        }

        const existing = await AccessRequest.findOne({ userId, status: "pending" });
        if (existing) {
            return res.status(400).json({ message: "Access request is already pending" });
        }

        await AccessRequest.create({
            userId,
            userEmail: user.email
        });

        res.json({ message: "Access requested successfully" });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// GET /api/live/access/status
export const getAccessStatus = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const user = await User.findOne({ clerkId: userId });

        const hasAccess = user?.features?.liveAccess || false;
        const pendingReq = await AccessRequest.findOne({ userId, status: "pending" });

        res.json({
            hasAccess,
            pendingRequest: !!pendingReq,
            requestDetails: pendingReq
        });

    } catch (error) {
        console.error("Get access status error:", error);
        res.status(500).json({ message: "Server error" });
    }
}

// ADMIN: GET /api/admin/live/requests
export const listRequests = async (req, res) => {
    try {
        const requests = await AccessRequest.find({ status: "pending" }).sort({ createdAt: -1 });
        res.json(requests);
    } catch(e) {
         res.status(500).json({ message: e.message });
    }
};

// ADMIN: POST /api/admin/live/requests/:id/approve
export const approveRequest = async (req, res) => {
    try {
        const reqObj = await AccessRequest.findById(req.params.id);
        if (!reqObj) return res.status(404).json({ message: "Request not found" });

        reqObj.status = "approved";
        await reqObj.save();

        const user = await User.findOne({ clerkId: reqObj.userId });
        if (user) {
            user.features = user.features || {};
            user.features.liveAccess = true;
            user.markModified('features');
            await user.save();
        }

        res.json({ message: "Request approved and user granted live access" });
    } catch(e) {
         res.status(500).json({ message: e.message });
    }
};

// ADMIN: POST /api/admin/live/requests/:id/reject
export const rejectRequest = async (req, res) => {
    try {
        const reqObj = await AccessRequest.findById(req.params.id);
        if (!reqObj) return res.status(404).json({ message: "Request not found" });

        reqObj.status = "rejected";
        await reqObj.save();

        res.json({ message: "Request rejected" });
    } catch(e) {
         res.status(500).json({ message: e.message });
    }
};
