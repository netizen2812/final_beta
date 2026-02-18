import { verifyToken } from "@clerk/clerk-sdk-node";
import User from "../models/User.js";

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    // Set req.auth with userId property explicitly
    req.auth = {
      userId: payload.sub,
      sub: payload.sub,
      ...payload
    };

    console.log("✅ Auth successful, userId:", req.auth.userId);

    // Ensure scholar role is enforced based on DB email (JWT doesn't contain email)
    try {
      const user = await User.findOne({ clerkId: payload.sub });
      if (user && user.email && user.email.toLowerCase() === "scholar1.imam@gmail.com") {
        if (user.role !== "scholar") {
          user.role = "scholar";
          await user.save();
          console.log("Forced Scholar Role for:", user.email);
        }
      }
    } catch (dbError) {
      console.error("Error in scholar role check:", dbError);
      // Don't block auth if DB check fails
    }

    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};
