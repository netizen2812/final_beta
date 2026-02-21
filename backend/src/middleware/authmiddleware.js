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
    let user = await User.findOne({ clerkId: userId });
    let userEmail = user?.email?.toLowerCase() || "";

    const rootAdmins = ["sarthakjuneja1999@gmail.com", "huzaifbarkati0@gmail.com"];

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
