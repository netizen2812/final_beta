import LiveAccessRequest from "../models/LiveAccessRequest.js";
import User from "../models/User.js";

// POST /api/live/access/request
export const requestAccess = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { childId, email, name } = req.body;

        // Check if pending request exists
        const existing = await LiveAccessRequest.findOne({ userId, status: "pending" });
        if (existing) {
            return res.status(400).json({ message: "Request already pending" });
        }

        const request = await LiveAccessRequest.create({
            userId,
            childId,
            email,
            name
        });

        res.status(201).json(request);
    } catch (error) {
        console.error("Request access error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/live/access/status
export const getAccessStatus = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const user = await User.findOne({ clerkId: userId });

        const hasAccess = user?.features?.liveAccess || false;
        const pendingRequest = await LiveAccessRequest.findOne({ userId, status: "pending" });

        res.json({
            hasAccess,
            pendingRequest: !!pendingRequest,
            requestDetails: pendingRequest
        });

    } catch (error) {
        console.error("Get access status error:", error);
        res.status(500).json({ message: "Server error" });
    }
}

// ADMIN: GET /api/admin/live/requests
export const listRequests = async (req, res) => {
    try {
        const requests = await LiveAccessRequest.find({ status: "pending" }).sort({ createdAt: -1 });
        res.json(requests);
    } catch (error) {
        console.error("List requests error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ADMIN: POST /api/admin/live/requests/:id/approve
export const approveRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.auth.userId;

        const request = await LiveAccessRequest.findById(id);
        if (!request) return res.status(404).json({ message: "Request not found" });

        // Update Request
        request.status = "approved";
        request.reviewedAt = new Date();
        request.reviewedBy = adminId;
        await request.save();

        // Grant Access to User
        await User.findOneAndUpdate(
            { clerkId: request.userId },
            { $set: { "features.liveAccess": true } }
        );

        res.json({ message: "Access granted", request });

    } catch (error) {
        console.error("Approve request error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ADMIN: POST /api/admin/live/requests/:id/reject
export const rejectRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;
        const adminId = req.auth.userId;

        const request = await LiveAccessRequest.findById(id);
        if (!request) return res.status(404).json({ message: "Request not found" });

        request.status = "rejected";
        request.adminNote = note;
        request.reviewedAt = new Date();
        request.reviewedBy = adminId;
        await request.save();

        res.json({ message: "Request rejected", request });

    } catch (error) {
        console.error("Reject request error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
