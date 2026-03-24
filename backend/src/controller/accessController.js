import User from "../models/User.js";

// POST /api/live/access/request
export const requestAccess = async (req, res) => {
    res.status(501).json({ message: "Legacy access request disabled" });
};

// GET /api/live/access/status
export const getAccessStatus = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const user = await User.findOne({ clerkId: userId });

        const hasAccess = user?.features?.liveAccess || false;

        res.json({
            hasAccess,
            pendingRequest: false,
            requestDetails: null
        });

    } catch (error) {
        console.error("Get access status error:", error);
        res.status(500).json({ message: "Server error" });
    }
}

// ADMIN: GET /api/admin/live/requests
export const listRequests = async (req, res) => {
    res.json([]);
};

// ADMIN: POST /api/admin/live/requests/:id/approve
export const approveRequest = async (req, res) => {
    res.status(501).json({ message: "Legacy access request disabled" });
};

// ADMIN: POST /api/admin/live/requests/:id/reject
export const rejectRequest = async (req, res) => {
    res.status(501).json({ message: "Legacy access request disabled" });
};
