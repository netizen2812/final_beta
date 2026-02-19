import User from "../models/User.js";
import { trackEvent } from "../services/analyticsService.js";

const SCHOLAR_EMAIL = "scholar1.imam@gmail.com";

// Helper: get or upsert scholar record safely
const getOrCreateScholar = async () => {
    // Use findOneAndUpdate with upsert to avoid E11000 duplicate key errors
    return await User.findOneAndUpdate(
        { email: { $regex: new RegExp(`^${SCHOLAR_EMAIL.replace('.', '\\.')}$`, 'i') } },
        {
            $setOnInsert: {
                clerkId: `scholar_placeholder_${SCHOLAR_EMAIL}`,
                email: SCHOLAR_EMAIL,
                name: "Scholar",
                role: "scholar"
            }
        },
        { upsert: true, new: true }
    );
};

// GET /api/live/scholar/status - Check if scholar is available
export const getScholarStatus = async (req, res) => {
    try {
        // Find the scholar user
        const scholar = await User.findOne({ email: "scholar1.imam@gmail.com" });
        const activeSessions = await LiveSession.countDocuments({ status: "active" });

        let isOnline = false;
        if (scholar && scholar.lastHeartbeat) {
            const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
            isOnline = scholar.lastHeartbeat > twoMinutesAgo;
        }

        res.json({
            online: isOnline,
            scholarName: scholar ? scholar.name : "Scholar",
            activeSessions
        });
    } catch (error) {
        console.error("Scholar status error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/live/start - Parent starts a session
export const startSession = async (req, res) => {
    console.log("🚀 startSession called!", req.body);

    try {
        const { childId } = req.body;
        const parentId = req.auth.userId;

        if (!childId) {
            return res.status(400).json({ message: "childId is required" });
        }

        // 1. Check Daily Limit
        const { checkDailyLimit } = await import("../utils/limitUtils.js");
        const limitCheck = await checkDailyLimit(childId);

        if (!limitCheck.allowed) {
            return res.status(403).json({
                message: "Daily learning limit reached",
                limitValues: limitCheck
            });
        }

        // Get or create scholar safely (no duplicate key errors)
        const scholar = await getOrCreateScholar();
        console.log("Scholar ready:", scholar._id);

        // Reuse existing active session if one exists
        let session = await LiveSession.findOne({
            parentId,
            childId,
            status: { $in: ['active', 'waiting'] }
        });

        if (!session) {
            session = new LiveSession({
                parentId,
                childId,
                scholarId: scholar._id,
                currentSurah: 1,
                currentAyah: 1,
                status: "active",
                startedAt: new Date() // Track start time
            });
            await session.save();
            trackEvent(parentId, "LIVE_STARTED", { sessionId: session._id, childId });
            console.log("New session created:", session._id);
        } else {
            if (session.status === 'waiting') {
                session.status = 'active';
                if (!session.startedAt) session.startedAt = new Date(); // Ensure start time
                await session.save();
            }
            console.log("Reusing existing session:", session._id);
        }

        res.status(200).json({ session });

    } catch (error) {
        console.error("❌ startSession error:", error.message);
        res.status(500).json({ message: "Server error starting session", detail: error.message });
    }
};

// GET /api/live/scholar/sessions - Scholar fetches active sessions
export const getScholarSessions = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const scholar = await User.findOne({ clerkId: userId });

        if (!scholar || scholar.role !== 'scholar') {
            return res.status(403).json({ message: "Access denied" });
        }

        const sessions = await LiveSession.find({
            scholarId: scholar._id,
            status: "active"
        });

        const populatedSessions = await Promise.all(sessions.map(async (s) => {
            const parent = await User.findOne({ clerkId: s.parentId });
            return {
                ...s.toObject(),
                parentName: parent ? parent.name : "Unknown Parent",
            };
        }));

        res.json({ sessions: populatedSessions });

    } catch (error) {
        console.error("getScholarSessions error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/live/:id - Get single session
export const getSession = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || id === 'undefined') {
            return res.status(400).json({ message: "Invalid session ID" });
        }
        const session = await LiveSession.findById(id);
        if (!session) return res.status(404).json({ message: "Session not found" });
        res.json(session);
    } catch (error) {
        console.error("getSession error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

// ADMIN: POST /api/live/admin/batch - Create new batch
export const createBatch = async (req, res) => {
    try {
        const { name, schedule, scholar, level, status } = req.body;

        // Basic validation
        if (!name || !scholar) {
            return res.status(400).json({ message: "Missing required fields (name, scholar)" });
        }

        const { default: Batch } = await import("../models/Batch.js");

        const batch = await Batch.create({
            name,
            scholar,
            schedule: schedule || {},
            level: level || 'Beginner',
            status: status || 'active'
        });

        res.status(201).json(batch);
    } catch (error) {
        console.error("Create batch error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ADMIN: GET /api/live/admin/batches - List all batches
export const getAdminBatches = async (req, res) => {
    try {
        const { default: Batch } = await import("../models/Batch.js");
        const batches = await Batch.find({}).sort({ createdAt: -1 }).populate('scholar', 'name email');
        res.json(batches);
    } catch (error) {
        console.error("Get admin batches error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ADMIN: PATCH /api/live/admin/batch/:id - Update batch
export const updateBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const { default: Batch } = await import("../models/Batch.js");

        const batch = await Batch.findByIdAndUpdate(id, { $set: updates }, { new: true });
        if (!batch) return res.status(404).json({ message: "Batch not found" });

        res.json(batch);
    } catch (error) {
        console.error("Update batch error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ADMIN: DELETE /api/live/admin/batch/:id
export const deleteBatch = async (req, res) => {
    try {
        const { default: Batch } = await import("../models/Batch.js");
        await Batch.findByIdAndDelete(req.params.id);
        res.json({ message: "Batch deleted" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// SCHOLAR: POST /api/live/:id/start - Scholar starts the batch
export const startBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.auth.userId;

        const session = await LiveSession.findById(id);
        if (!session) return res.status(404).json({ message: "Batch not found" });

        // Verify Scholar (or Admin)
        const user = await User.findOne({ clerkId: userId });
        const isAssignedScholar = session.scholarId.toString() === user._id.toString();

        if (user.role !== 'admin' && !isAssignedScholar) {
            return res.status(403).json({ message: "Unauthorized to start this batch" });
        }

        session.status = 'active';
        session.startedAt = new Date();
        await session.save();
        trackEvent(userId, "LIVE_STARTED", { sessionId: session._id, title: session.title });

        res.json(session);
    } catch (error) {
        console.error("Start batch error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// USER: POST /api/live/:id/join - Student joins a batch
export const joinBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { childId } = req.body;
        const userId = req.auth.userId;

        const session = await LiveSession.findById(id);
        if (!session) return res.status(404).json({ message: "Batch not found" });

        if (session.status === 'ended') return res.status(400).json({ message: "Session ended" });

        // Access Check
        if (session.accessMode === 'restricted') {
            const isAllowed = session.allowedParents.includes(userId);
            if (!isAllowed) return res.status(403).json({ message: "You are not enrolled in this batch" });
        }

        // Log Attendance
        const { default: LiveAttendance } = await import("../models/LiveAttendance.js");
        await LiveAttendance.create({
            sessionId: session._id,
            userId,
            childId,
            role: 'student', // or parent
            joinTime: new Date()
        });

        trackEvent(userId, "LIVE_JOINED", { sessionId: session._id, childId });

        res.json({ session, message: "Joined successfully" });
    } catch (error) {
        console.error("Join batch error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// USER: GET /api/live/my-sessions - List sessions available to user
export const getMySessions = async (req, res) => {
    try {
        const userId = req.auth.userId;

        // Find sessions where:
        // 1. Access is Open OR
        // 2. Access is Restricted AND User is in allowedParents
        const sessions = await LiveSession.find({
            $or: [
                { accessMode: 'open' },
                { allowedParents: userId }
            ],
            status: { $ne: 'ended' } // Hide ended sessions? Or show history?
        }).sort({ scheduledStartTime: 1 });

        res.json(sessions);
    } catch (error) {
        console.error("Get my sessions error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ... keep updateAyah and endSession (refactored for generic use)
// PATCH /api/live/:id - Update Ayah (Parent)
export const updateAyah = async (req, res) => {
    try {
        const { id } = req.params;
        const { surah, ayah } = req.body;
        // ... (Logic to allow any participant or just scholar?)
        // For classroom: Scholar likely controls, or student controls their own view?
        // Let's assume Scholar controls the "Master" view, but for now allow anyone to update (sync)

        const session = await LiveSession.findByIdAndUpdate(id, { currentSurah: surah, currentAyah: ayah }, { new: true });
        res.json({ session });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/live/:id/end - End Session
export const endSession = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.auth.userId; // Clerk ID

        const session = await LiveSession.findById(id);
        if (!session) return res.status(404).json({ message: "Session not found" });

        // Only Scholar or Admin can end
        const user = await User.findOne({ clerkId: userId });
        const isScholar = session.scholarId.toString() === user._id.toString();

        if (user.role !== 'admin' && !isScholar) {
            return res.status(403).json({ message: "Unauthorized action" });
        }

        session.status = 'ended';
        session.endedAt = new Date();
        await session.save();

        res.json({ message: "Session ended" });
    } catch (error) {
        console.error("End session error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
