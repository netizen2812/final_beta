import { ClerkExpressRequireAuth, clerkClient } from '@clerk/clerk-sdk-node';
import User from "../models/User.js";
import Child from "../models/Child.js";

export const requireAuth = (req, res, next) => {
  // 1. Log the attempt (Safe metadata only)
  console.log(`🔐 Auth Check: ${req.method} ${req.path}`);

  // 2. Pass to Clerk
  return ClerkExpressRequireAuth({
    // Enable debug if needed, though it can be noisy
    // debug: true 
  })(req, res, (err) => {
    if (err) {
      console.error("❌ Clerk Auth Failed:", err.message);
      // PART 6: CLERK TOKEN FIX
      // If token is invalid/expired (401) or malformed (422), return 401
      if (err.message.includes("401") || err.message.includes("422") || err.message.includes("token")) {
        return res.status(401).json({ message: "Unauthorized: Invalid or missing token" });
      }
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  });
};

export const isAdmin = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    let user = await User.findOne({ clerkId: userId });
    let userEmail = user?.email?.toLowerCase() || "";

    const rootAdmins = ["sarthakjuneja1999@gmail.com", "huzaifbarkati0@gmail.com", "abhi.nebhani@gmail.com"];

    // Fallback: If user not in DB or role not admin, check Clerk directly for root admins
    if (!user || (user.role !== "admin" && !rootAdmins.includes(userEmail))) {
      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        const clerkEmails = (clerkUser.emailAddresses || []).map(e => e.emailAddress.toLowerCase());
        const isRoot = clerkEmails.some(email => {
          // Handle Gmail dot aliasing (optional but robust)
          const normalized = email.replace(/\./g, "").replace("@googlemail.com", "@gmail.com");
          return rootAdmins.some(admin =>
            admin.replace(/\./g, "").replace("@googlemail.com", "@gmail.com") === normalized
          );
        });

        if (isRoot) {
          console.log(`✅ Root Admin verified via Clerk: ${clerkEmails[0]}`);
          // Proceed as admin
          if (user) req.user = user;
          return next();
        }
      } catch (clerkErr) {
        console.error("Clerk fallback check failed:", clerkErr);
      }
    }

    const isRootAdmin = rootAdmins.includes(userEmail);

    if (!user || (user.role !== "admin" && !isRootAdmin)) {
      console.log(`🚫 Admin Access Denied for: ${userEmail} (Role: ${user?.role})`);
      return res.status(403).json({ message: "Admin access required" });
    }

    req.user = user; // Attach full user object
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const isScholar = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    let user = await User.findOne({ clerkId: userId });

    // Scholar access: Must be admin OR scholar role
    const isScholarRole = user?.role === 'scholar' || user?.role === 'admin';

    if (!isScholarRole) {
      console.log(`🚫 Scholar Access Denied for: ${user?.email}`);
      return res.status(403).json({ message: "Scholar access required" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Scholar auth error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const isParentOfChild = async (req, res, next) => {
    try {
        const { childId } = req.params;
        const userId = req.auth.userId; // Standardize on userId

        if (!childId) return next();

        // Find parent user by clerkId to get MongoDB _id for ownership check
        const parentUser = await User.findOne({ clerkId: userId });
        if (!parentUser) return res.status(404).json({ message: "Parent user not found" });

        // Verify child belongs to parent
        const child = await Child.findOne({ _id: childId, parent_id: parentUser._id });
        if (!child) {
            console.log(`🚫 IDOR Attempt: User ${userId} tried to access child ${childId}`);
            return res.status(403).json({ message: "Access denied: You are not authorized to access this child's data." });
        }

        req.child = child; // Attach child object for use in controller
        next();
    } catch (error) {
        console.error("Ownership check error:", error);
        res.status(500).json({ message: "Server error during authorization" });
    }
};

export const isOwnerOfAssignment = async (req, res, next) => {
    try {
        const { assignmentId } = req.params;
        const userId = req.auth.userId;
        const { default: QuranAssignment } = await import("../models/QuranAssignment.js");

        if (!assignmentId) return next();

        const user = await User.findOne({ clerkId: userId });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Admin/Scholar bypass for specific operations (optional, but good for flexibility)
        if (user.role === 'admin') return next();

        const assignment = await QuranAssignment.findById(assignmentId);
        if (!assignment) return res.status(404).json({ message: "Assignment not found" });

        const child = await Child.findById(assignment.studentId);
        if (!child) return res.status(404).json({ message: "Student not found" });

        const isOwner = child.parent_id.toString() === user._id.toString() || 
                        child.childUserId?.toString() === user._id.toString();

        if (!isOwner) {
            console.log(`🚫 IDOR Attempt: User ${userId} tried to access assignment ${assignmentId}`);
            return res.status(403).json({ message: "Access denied" });
        }

        req.assignment = assignment;
        next();
    } catch (error) {
        console.error("Assignment ownership check error:", error);
        res.status(500).json({ message: "Server error during authorization" });
    }
};
