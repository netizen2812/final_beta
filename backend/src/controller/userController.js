import User from "../models/User.js";
import { clerkClient } from "@clerk/clerk-sdk-node";
import { trackEvent } from "../services/analyticsService.js";

export const syncUser = async (req, res) => {
  try {
    console.log("Inside syncUser");

    const clerkId = req.auth.userId;

    if (!clerkId) {
      return res.status(400).json({ message: "Invalid token payload" });
    }

    let user = await User.findOne({ clerkId });

    if (!user) {
      // 🔥 Fetch full user data from Clerk
      const clerkUser = await clerkClient.users.getUser(clerkId);

      const email =
        clerkUser.emailAddresses?.[0]?.emailAddress || null;

      const name =
        `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim();

      // Check if user already exists by email (e.g. pre-created scholar)
      user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
      if (user) {
        // Link existing DB user to their real Clerk ID
        user.clerkId = clerkId;
        if (!user.name || user.name === 'Mualim') user.name = name;
        await user.save();
        console.log("Linked existing user by email:", email);
      } else {
        // Determine role
        const role = email && email.toLowerCase() === "scholar1.imam@gmail.com"
          ? "scholar"
          : "parent";

        user = await User.create({
          clerkId,
          email,
          name,
          role,
        });
      }
    }

    // Track Login/Session Start
    trackEvent(user.clerkId, "USER_LOGIN", { role: user.role });

    res.status(200).json({ message: "User synced", user });
  } catch (error) {
    console.error("Error syncing user:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const heartbeat = async (req, res) => {
  try {
    const { userId } = req.auth;
    await User.findOneAndUpdate(
      { clerkId: userId },
      { lastHeartbeat: new Date() } // Update heartbeat
    );
    res.status(200).send("OK");
  } catch (error) {
    console.error("Heartbeat error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
