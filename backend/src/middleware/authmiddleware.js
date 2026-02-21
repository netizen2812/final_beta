import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import User from "../models/User.js";

export const requireAuth = (req, res, next) => {
  // 1. Log the attempt
  console.log(`🔐 Auth Check: ${req.method} ${req.path}`);
  console.log(`   - Auth Header Present: ${!!req.headers.authorization}`);
  if (req.headers.authorization) {
    console.log(`   - Token Start: ${req.headers.authorization.substring(0, 15)}...`);
  }

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
    const user = await User.findOne({ clerkId: userId });

    if (!user || user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.user = user; // Attach full user object
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
