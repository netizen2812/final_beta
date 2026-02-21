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
        // Check all emails for root admin status
        const rootAdmins = ["sarthakjuneja1999@gmail.com", "huzaifbarkati0@gmail.com"];
        const allClerkEmails = (clerkUser.emailAddresses || []).map(e => e.emailAddress.toLowerCase());
        const isRoot = allClerkEmails.some(email => rootAdmins.includes(email));

        const role = isRoot
          ? "admin"
          : email && email.toLowerCase() === "scholar1.imam@gmail.com"
            ? "scholar"
            : "parent";

        console.log(`Creating user with role: ${role} (isRoot: ${isRoot})`);

        user = await User.create({
          clerkId,
          email, // Store primary email
          name,
          role,
        });
      }
    }

    // 🔥 ENSURE ROOT ADMIN ROLE (Check full associated emails)
    const rootAdmins = ["sarthakjuneja1999@gmail.com", "huzaifbarkati0@gmail.com"];

    // We can fetch from Clerk again or just check the stored email. 
    // To be safest, we should try to match the stored email or any of the clerk emails if we just fetched them.
    // Since we want to be robust, let's use the email stored in DB but handle case-insensitivity.
    const dbEmail = user.email?.toLowerCase();

    if (dbEmail && rootAdmins.includes(dbEmail) && user.role !== "admin") {
      user.role = "admin";
      await user.save();
      console.log(`Updated existing user ${user.email} to admin role`);
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
