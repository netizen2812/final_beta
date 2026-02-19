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
      console.error("❌ Clerk Auth Failed:", err);
      // Don't swallow error, let express handle or return 401
    }
    next(err);
  });
};

export const isAdmin = async (req, res, next) => {
  try {
    const userId = req.auth.userId;
    const user = await User.findOne({ clerkId: userId });

    if (!user || !user.email || user.email.toLowerCase() !== "sarthakjuneja1999@gmail.com") {
      return res.status(403).json({ message: "Admin access required" });
    }

    req.user = user; // Attach full user object
    next();
  } catch (error) {
    console.error("Admin auth error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
