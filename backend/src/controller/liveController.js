import LiveSession from "../models/LiveSession.js";
import User from "../models/User.js";

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
        const scholar = await User.findOne({
            email: { $regex: new RegExp(`^${SCHOLAR_EMAIL.replace('.', '\\.')}$`, 'i') },
            role: 'scholar'
        });

        if (!scholar) {
            return res.json({ online: false, scholarName: "Scholar" });
        }

        // Scholar is "online" if they've synced in the last 10 minutes
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const isRecentlyActive = scholar.updatedAt && new Date(scholar.updatedAt) > tenMinutesAgo;

        // Also check if they have active sessions they're monitoring
        const activeSessions = await LiveSession.countDocuments({
            scholarId: scholar._id,
            status: 'active'
        });

        res.json({
            online: isRecentlyActive || activeSessions > 0,
            activeSessions,
            scholarName: scholar.name || "Scholar"
        });
    } catch (error) {
        console.error("Scholar status error:", error);
        res.json({ online: false, scholarName: "Scholar" });
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
                status: "active"
            });
            await session.save();
            console.log("New session created:", session._id);
        } else {
            if (session.status === 'waiting') {
                session.status = 'active';
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

// PATCH /api/live/:id - Update Ayah (Parent)
export const updateAyah = async (req, res) => {
    try {
        const { id } = req.params;
        const { surah, ayah } = req.body;
        const userId = req.auth.userId;

        const session = await LiveSession.findById(id);
        if (!session) return res.status(404).json({ message: "Session not found" });

        // BOLA FIX: Only Parent (Owner) can update position
        if (session.parentId !== userId) {
            return res.status(403).json({ message: "Unauthorized: Only session owner allowed" });
        }

        session.currentSurah = surah;
        session.currentAyah = ayah;
        await session.save();

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

        // BOLA FIX: Verify ownership
        const isParent = session.parentId === userId;
        let isScholar = false;

        if (!isParent) {
            // Check if user is the assigned scholar
            const user = await User.findOne({ clerkId: userId });
            if (user && session.scholarId && user._id.equals(session.scholarId)) {
                isScholar = true;
            }
        }

        if (!isParent && !isScholar) {
            return res.status(403).json({ message: "Unauthorized action" });
        }

        session.status = 'ended';
        await session.save();
        res.json({ message: "Session ended" });
    } catch (error) {
        console.error("End session error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
