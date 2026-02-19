import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import User from "../models/User.js";

export const requireAuth = ClerkExpressRequireAuth({
  // Add options if needed
});

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
