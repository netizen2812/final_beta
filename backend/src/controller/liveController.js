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

        const { default: Child } = await import("../models/Child.js");
        const populatedSessions = await Promise.all(sessions.map(async (s) => {
            const parent = await User.findOne({ clerkId: s.parentId });
            // Attempt to resolve child name
            let childName = s.childId;
            // If childId looks like an ObjectId, try to find it
            if (s.childId && s.childId.length > 10) {
                const child = await Child.findById(s.childId);
                if (child) childName = child.name;
            }

            return {
                ...s.toObject(),
                parentName: parent ? parent.name : "Unknown Parent",
                studentName: childName
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
        const batches = await Batch.find({}).sort({ createdAt: -1 })
            .populate('scholar', 'name email')
            .populate('students', 'name email'); // Populate students for Admin UI
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

// ADMIN: POST /api/live/admin/batch/:id/add-student
export const addStudentToBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { childId } = req.body;
        const { default: Batch } = await import("../models/Batch.js");

        const batch = await Batch.findById(id);
        if (!batch) return res.status(404).json({ message: "Batch not found" });

        if (!batch.students.includes(childId)) {
            batch.students.push(childId);
            await batch.save();
        }

        res.json(batch);
    } catch (error) {
        console.error("Add student error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// ADMIN: POST /api/live/admin/batch/:id/remove-student
export const removeStudentFromBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { childId } = req.body;
        const { default: Batch } = await import("../models/Batch.js");

        await Batch.findByIdAndUpdate(id, { $pull: { students: childId } });
        res.json({ message: "Student removed" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// SCHOLAR: GET /api/live/batch/:id/sessions - Get active student sessions for a batch
export const getBatchSessions = async (req, res) => {
    try {
        const { id } = req.params; // Batch ID

        // Find all active sessions where the child is in this batch
        // OR: simpler, find active sessions where `batchId` matches (if we add batchId to LiveSession)
        // For now, let's look for active sessions of students in this batch.

        const { default: Batch } = await import("../models/Batch.js");
        const batch = await Batch.findById(id);
        if (!batch) return res.status(404).json({ message: "Batch not found" });

        // Find sessions for these students
        const sessions = await LiveSession.find({
            childId: { $in: batch.students },
            status: 'active'
        }).populate('childId', 'name');
        // Note: childId in LiveSession is currently a String (ID or Name?) 
        // In startSession we use `childId` from body.
        // We need to ensure we are consistent. `LiveSession.childId` should probably be an ObjectId ref to Child?
        // Checking LiveSession model... it might not be defined in this file.
        // Assuming LiveSession.childId is the Child ID string.

        // Let's populate manually or just return what we have
        // If LiveSession.childId is just a string, we can't populate.
        // But we can fetch Child details.

        const { default: Child } = await import("../models/Child.js");
        const populated = await Promise.all(sessions.map(async s => {
            const child = await Child.findById(s.childId);
            return {
                ...s.toObject(),
                studentName: child ? child.name : "Unknown"
            };
        }));

        res.json(populated);

    } catch (error) {
        console.error("Get batch sessions error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// SCHOLAR: POST /api/live/:id/start - This was for Batch Session generic start
// We might keep this if the Scholar *also* has a session?
export const startBatch = async (req, res) => {
    // For Observation Mode, maybe this just marks the batch as "Class in Session"?
    // For now, let's keep it simple: It activates the batch status.
    try {
        const { id } = req.params;
        const { default: Batch } = await import("../models/Batch.js");

        await Batch.findByIdAndUpdate(id, { status: 'active' });
        res.json({ message: "Batch started" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// USER: POST /api/live/:id/join - Student joins a batch
export const joinBatch = async (req, res) => {
    console.log("🚀 joinBatch called for Batch ID:", req.params.id);
    console.log("Request Body:", req.body);
    console.log("Auth User:", req.auth.userId);

    try {
        const { id } = req.params; // Batch ID
        const { childId } = req.body;
        const userId = req.auth.userId;

        // 1. Input Validation
        if (!id || !childId) {
            console.error("❌ Join batch error: Missing batchId or childId");
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const { default: Batch } = await import("../models/Batch.js");
        const { default: LiveSession } = await import("../models/LiveSession.js");
        const { default: LiveAttendance } = await import("../models/LiveAttendance.js");

        // 2. Find Batch
        const batch = await Batch.findById(id);
        if (!batch) {
            console.error(`❌ Join batch error: Batch ${id} not found`);
            console.error(`❌ Join batch error: Batch ${id} not found`);
            return res.status(404).json({ success: false, message: "Batch not found" });
        }

        console.log("Found Batch:", batch.name);

        // 3. Verify Enrollment (Handle ObjectId vs String)
        const isEnrolled = batch.students.some(s => s.toString() === childId.toString());
        if (!isEnrolled) {
            console.error(`❌ Join batch error: Student ${childId} not enrolled in batch ${id}`);
            return res.status(403).json({ success: false, message: "Student not enrolled in this batch" });
        }

        // 4. Get Scholar
        if (!batch.scholar) {
            console.error(`❌ Join batch error: Batch ${id} has no assigned scholar`);
            return res.status(400).json({ success: false, message: "Batch has no assigned scholar" });
        }

        // 5. Create/Activate Session
        let session = await LiveSession.findOne({
            childId,
            status: 'active'
        });

        if (!session) {
            console.log("Creating new session for child:", childId);
            try {
                session = await LiveSession.create({
                    title: batch.name,
                    parentId: userId,
                    childId,
                    scholarId: batch.scholar,
                    currentSurah: 1,
                    currentAyah: 1,
                    status: 'active',
                    startedAt: new Date(),
                    scheduledStartTime: new Date(),
                    scheduledEndTime: new Date(Date.now() + 60 * 60 * 1000),
                    batchId: batch._id
                });
            } catch (dbError) {
                console.error("❌ DB Error creating session:", dbError);
                throw dbError;
            }
        } else {
            console.log("Resuming existing session:", session._id);
        }

        // 6. Log Attendance
        await LiveAttendance.create({
            sessionId: session._id,
            userId,
            childId,
            role: 'student',
            joinTime: new Date()
        });

        console.log("✅ Join successful. Session:", session._id);
        res.json({ success: true, session, message: "Joined successfully" });

    } catch (error) {
        console.error("❌ CRITICAL JOIN BATCH ERROR:", error);
        res.status(500).json({
            success: false,
            message: "Server error joining batch",
            error: "JOIN_BATCH_FAILED",
            reason: error.message
        });
    }
};

// USER: GET /api/live/my-sessions - List sessions available to user
export const getMySessions = async (req, res) => {
    try {
        const userId = req.auth.userId;

        // Find sessions where:
        // 1. Access is Open OR
        // 2. Access is Restricted AND User is in allowedParents
        const { default: Batch } = await import("../models/Batch.js");
        // Find Batches where user's children are enrolled?
        // Complex query: Find batches where `students` contains any of User's children IDs.

        const { default: Child } = await import("../models/Child.js");
        const children = await Child.find({ parent_id: await User.findOne({ clerkId: userId }).select('_id') });
        const childIds = children.map(c => c._id);

        const sessions = await Batch.find({
            students: { $in: childIds },
            status: { $ne: 'archived' }
        }).populate('scholar', 'name').sort({ createdAt: -1 });

        // Map to expected format if needed, or update frontend to read Batch object
        res.json(sessions);

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

// DEBUG: GET /api/live/:id/debug
export const debugBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { default: Batch } = await import("../models/Batch.js");

        // Validate ID format
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.json({ error: "Invalid ID format" });
        }

        const batch = await Batch.findById(id).populate('scholar').populate('students');
        if (!batch) return res.status(404).json({ exists: false });

        res.json({
            exists: true,
            id: batch._id,
            name: batch.name,
            scholar: batch.scholar ? { id: batch.scholar._id, name: batch.scholar.name } : null,
            studentsCount: batch.students.length,
            students: batch.students.map(s => ({ id: s._id, name: s.name })),
            status: batch.status
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
