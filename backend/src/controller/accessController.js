import User from "../models/User.js";
import AccessRequest from "../models/AccessRequest.js";
import { isRootAdmin } from "../utils/constants.js";
import { clerkClient } from "@clerk/clerk-sdk-node";

// POST /api/live/access/request
export const requestAccess = async (req, res) => {
    try {
        const userId = req.auth.userId;
        let user = await User.findOne({ clerkId: userId });
        
        // Auto-sync if not in DB
        if (!user) {
            try {
                const clerkUser = await clerkClient.users.getUser(userId);
                user = await User.findOneAndUpdate(
                    { clerkId: userId },
                    { 
                        $set: {
                            email: clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase(),
                            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
                            role: 'parent'
                        }
                    },
                    { upsert: true, new: true }
                );
            } catch (clerkErr) {
                console.error("Clerk sync failed during access request:", clerkErr);
                return res.status(404).json({ message: "User not found and sync failed" });
            }
        }

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
        let user = await User.findOne({ clerkId: userId });

        // AUTO-SYNC: If user not in DB, create record from Clerk profile
        if (!user) {
            console.log(`🔄 Auto-syncing missing user in access check: ${userId}`);
            try {
                const clerkUser = await clerkClient.users.getUser(userId);
                user = await User.findOneAndUpdate(
                    { clerkId: userId },
                    {
                        $set: {
                            email: clerkUser.emailAddresses[0]?.emailAddress?.toLowerCase(),
                            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
                            role: 'parent'
                        }
                    },
                    { upsert: true, new: true }
                );
                console.log(`✅ User record created from Clerk: ${user.email}`);
            } catch (clerkErr) {
                console.error("Clerk user fetch failed:", clerkErr.message);
                // Continue with user=null, will result in hasAccess=false
            }
        }

        const userEmail = user?.email?.toLowerCase() || "";
        const isRoot = isRootAdmin(userEmail);

        const hasAccess = user?.features?.liveAccess || isRoot || false;
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
