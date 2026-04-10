import User from "../models/User.js";
import Batch from "../models/Batch.js";
import Session from "../models/Session.js";
import Child from "../models/Child.js";
import { generateAgoraToken } from "../services/agoraService.js";
import { trackEvent } from "../services/analyticsService.js";
import { isRootAdmin, SCHOLAR_EMAILS } from "../utils/constants.js";

const SCHOLAR_EMAIL = "scholar1.imam@gmail.com";

// Helper: get or upsert scholar record safely
const getOrCreateScholar = async () => {
    const defaultScholarEmail = SCHOLAR_EMAILS[0];
    // Use findOneAndUpdate with upsert to avoid E11000 duplicate key errors
    return await User.findOneAndUpdate(
        { email: { $regex: new RegExp(`^${defaultScholarEmail.replace('.', '\\.')}$`, 'i') } },
        {
            $setOnInsert: {
                clerkId: `scholar_placeholder_${defaultScholarEmail}`,
                email: defaultScholarEmail,
                name: "Scholar",
                role: "scholar"
            }
        },
        { upsert: true, new: true }
    );
};

// Helper: Verify if the authenticated user owns the child profile
// Returns { child, user } if authorized, else null
const verifyChildAccess = async (clerkId, childId) => {
    const { default: User } = await import("../models/User.js");
    const { default: Child } = await import("../models/Child.js");

    const user = await User.findOne({ clerkId });
    if (!user) return null;

    const child = await Child.findById(childId);
    if (!child) return null;

    const isOwner = child.parent_id.toString() === user._id.toString() || 
                    child.childUserId?.toString() === user._id.toString() ||
                    user.role === 'admin';

    return isOwner ? { child, user } : null;
};

// GET /api/live/scholar/status - Check if ANY scholar is available (or specific for lobby)
export const getScholarStatus = async (req, res) => {
    try {
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
        const onlineScholar = await User.findOne({
            role: { $in: ['scholar', 'admin'] },
            lastHeartbeat: { $gt: twoMinutesAgo }
        });

        res.json({
            online: !!onlineScholar,
            scholarName: onlineScholar ? onlineScholar.name : "Scholar",
            activeSessions: 0
        });
    } catch (error) {
        console.error("Scholar status error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// SCHOLAR DASHBOARD: GET /api/live/scholar/sessions - (Legacy placeholder, returning empty for list)
export const getScholarSessions = async (req, res) => {
    res.json({ sessions: [] });
};

// ADMIN: POST /api/live/admin/batch - Create new batch
export const createBatch = async (req, res) => {
    try {
        let { name, schedule, scholar, level, status } = req.body;

        // Basic validation
        if (!name || !scholar) {
            return res.status(400).json({ message: "Missing required fields (name, scholar)" });
        }

        const { default: Batch } = await import("../models/Batch.js");

        // --- RESOLVE SCHOLAR EMAIL TO ID ---
        if (typeof scholar === 'string' && scholar.includes('@')) {
            const resolvedScholar = await User.findOne({ email: scholar.toLowerCase() });
            if (resolvedScholar) {
                scholar = resolvedScholar._id;
            } else {
                return res.status(404).json({ message: `Scholar with email ${scholar} not found` });
            }
        }

        const batch = await Batch.create({
            name,
            scholar,
            schedule: schedule || {},
            level: level || 'Beginner',
            status: status || 'upcoming'
        });

        // Auto-provision Daily.co room for video calls
        try {
            const { createDailyRoom } = await import("../services/dailyService.js");
            const roomName = await createDailyRoom(batch._id.toString(), name);
            if (roomName) {
                batch.dailyRoomName = roomName;
                await batch.save();
            }
        } catch (dailyErr) {
            console.warn("Daily.co room auto-creation skipped:", dailyErr.message);
        }

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
            .populate('students', 'name email'); // Populate students with name and email for Admin UI
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

        // --- RESOLVE SCHOLAR EMAIL TO ID IN UPDATES ---
        if (updates.scholar && typeof updates.scholar === 'string' && updates.scholar.includes('@')) {
            const resolvedScholar = await User.findOne({ email: updates.scholar.toLowerCase() });
            if (resolvedScholar) {
                updates.scholar = resolvedScholar._id;
            }
        }

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
        const { default: Child } = await import("../models/Child.js");
        const { default: User } = await import("../models/User.js");

        const batch = await Batch.findById(id);
        if (!batch) return res.status(404).json({ message: "Batch not found" });

        // 1. Update Batch model (using string comparison for safety)
        const studentExists = (batch.students || []).map(s => s.toString()).includes(childId.toString());
        if (!studentExists) {
            batch.students.push(childId);
            await batch.save();
        }

        // 2. Update Child model (Link to Batch)
        const child = await Child.findById(childId);
        if (child) {
            child.batch = id;
            await child.save();

            // 3. Grant Parent User Live Access
            const parent = await User.findById(child.parent_id);
            if (parent) {
                if (!parent.features) parent.features = {};
                parent.features.liveAccess = true;
                parent.markModified('features');
                await parent.save();
            }
        }

        res.json(batch);
    } catch (error) {
        console.error("Add student error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const handleEndClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { default: Batch } = await import("../models/Batch.js");
        const { default: Session } = await import("../models/Session.js");

        const batch = await Batch.findById(id);
        if (!batch) return res.status(404).json({ message: "Batch not found" });

        if (batch.activeSessionId) {
             await Session.findByIdAndUpdate(batch.activeSessionId, { 
                status: 'completed',
                endedAt: new Date()
             });
        }

        await Batch.findByIdAndUpdate(id, { 
            status: 'ended',
            activeSessionId: null,
            activeChildId: null,
            promptEvaluated: false,
            currentPromptAnswers: []
        });

        res.json({ success: true, message: "Class ended successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
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

// ADMIN/SCHOLAR: GET /api/live/batch/:id/students - List students in a batch
export const getBatchStudents = async (req, res) => {
    try {
        const { id } = req.params;
        const { default: Batch } = await import("../models/Batch.js");
        const batch = await Batch.findById(id).populate('students', 'name parent_id');
        if (!batch) return res.status(404).json({ message: "Batch not found" });
        res.json(batch.students || []);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// SCHOLAR: GET /api/live/batch/:id/sessions - Get active student sessions for a batch
export const getBatchSessions = async (req, res) => {
    try {
        const { id } = req.params;
        const { default: Batch } = await import("../models/Batch.js");
        const { default: Session } = await import("../models/Session.js");

        const batch = await Batch.findById(id);
        if (!batch || !batch.activeSessionId) return res.json([]);

        const session = await Session.findById(batch.activeSessionId);
        if (!session) return res.json([]);

        const mappedSessions = session.attendance
           .filter(p => p.isActive)
           .map(p => ({
               _id: p._id || p.childId.toString(),
               childId: p.childId,
               batchId: id,
               studentName: p.childName,
               status: 'active'
           }));

        res.json(mappedSessions);
    } catch (e) {
        res.status(500).json({ message: "Server error" });
    }
};

export const startBatch = async (req, res) => {
    try {
        const { id } = req.params;

        let batch = await Batch.findById(id);
        const AGORA_APP_ID = process.env.AGORA_APP_ID;
        if (batch && batch.status === 'active' && batch.activeSessionId) {
             const existingSession = await Session.findById(batch.activeSessionId);
             if (existingSession && existingSession.status === 'live') {
                const { getNumericUid } = await import("../utils/tarbiyahUtils.js");
                const agoraToken = generateAgoraToken(id, getNumericUid(req.auth.userId), 'publisher');
                return res.json({ 
                    success: true,
                    session: {
                        _id: batch.activeSessionId,
                        batchId: id,
                        status: 'active',
                        title: batch.name,
                        dailyRoomName: batch.dailyRoomName,
                        agoraToken: agoraToken || null,
                        agoraAppId: AGORA_APP_ID || null
                    }
                });
             }
        }

        // Ensure Daily.co room exists (auto-create if missing)
        if (!batch.dailyRoomName) {
            try {
                const { createDailyRoom } = await import("../services/dailyService.js");
                const roomName = await createDailyRoom(id, batch.name);
                if (roomName) {
                    await Batch.updateOne({ _id: id }, { $set: { dailyRoomName: roomName } });
                    batch.dailyRoomName = roomName;
                }
            } catch (dailyErr) {
                console.warn("Daily.co room auto-creation on start skipped:", dailyErr.message);
            }
        }

        // Create new session model record
        const session = await Session.create({
            batchId: id,
            scholarId: null, // Optional: Populate from request context if available
            status: 'live',
            scheduledAt: new Date(),
            attendance: []
        });

        batch = await Batch.findByIdAndUpdate(id, { 
            $set: {
                status: 'active',
                activeSessionId: session._id.toString(),
                activeChildId: null,
                promptEvaluated: false,
                currentPromptAnswers: [],
                activeParticipants: []
            },
            $push: {
                pastSessions: {
                    sessionId: session._id.toString(),
                    startedAt: new Date(),
                    endedAt: null,
                    attendedChildren: []
                }
            }
        }, { new: true });

        const { getNumericUid } = await import("../utils/tarbiyahUtils.js");
        const agoraToken = generateAgoraToken(id, getNumericUid(req.auth.userId), 'publisher');

        res.json({ 
            success: true,
            session: {
                _id: session._id,
                batchId: id,
                status: 'active',
                title: batch.name,
                dailyRoomName: batch.dailyRoomName,
                agoraToken: agoraToken || null,
                agoraAppId: AGORA_APP_ID || null
            }
        });
    } catch (error) {
        console.error("Start batch error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// USER: POST /api/live/:id/join - Student joins a batch (Presence Tracking)
export const joinBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { childId } = req.body;
        const clerkId = req.auth.userId;

        const user = await User.findOne({ clerkId });
        const child = await Child.findById(childId);
        if (!user || !child) return res.status(404).json({ success: false, message: "User/Student not found" });

        const batch = await Batch.findById(id);
        if (!batch) return res.status(404).json({ success: false, message: "Batch not found" });

        if (batch.status !== 'active' || !batch.activeSessionId) {
            return res.status(403).json({ success: false, message: "Waiting for scholar to start session." });
        }

        const session = await Session.findById(batch.activeSessionId);
        if (!session) return res.status(404).json({ success: false, message: "Active session metadata not found" });

        const childName = child.name || "Student";
        const participantIdx = session.attendance.findIndex(p => p.childId.toString() === childId);
        let isFirstJoin = false;

        if (participantIdx > -1) {
            if (!session.attendance[participantIdx].isActive) isFirstJoin = true;
            session.attendance[participantIdx].isActive = true;
            session.attendance[participantIdx].lastSeen = new Date();
        } else {
            isFirstJoin = true;
            session.attendance.push({
                childId,
                childName,
                isActive: true,
                lastSeen: new Date(),
                joinedAt: new Date(),
                status: 'present'
            });
        }

        await session.save();

        // 🔥 SYNC: Add to Batch.activeParticipants for real-time scholar view
        const pIdxBatch = batch.activeParticipants.findIndex(p => p.childId === childId);
        if (pIdxBatch > -1) {
            batch.activeParticipants[pIdxBatch].isActive = true;
            batch.activeParticipants[pIdxBatch].lastSeen = new Date();
        } else {
            batch.activeParticipants.push({
                childId,
                childName,
                isActive: true,
                lastSeen: new Date()
            });
        }
        await batch.save();

        if (isFirstJoin) {
            const { awardXP } = await import("../services/gamificationService.js");
            await awardXP(childId, "participation", { points: 2, batchId: id, sessionId: session._id });
            
            // Also track in batch's pastSessions for attendance history
            await Batch.updateOne(
                { _id: id, "pastSessions.sessionId": batch.activeSessionId },
                { $addToSet: { "pastSessions.$.attendedChildren": childId } }
            );
        }

        // Generate Agora Token for student (subscriber)
        const AGORA_APP_ID = process.env.AGORA_APP_ID;
        const { getNumericUid } = await import("../utils/tarbiyahUtils.js");
        const agoraToken = generateAgoraToken(id, getNumericUid(req.auth.userId), 'subscriber');

        res.json({ 
            success: true, 
            session: {
                _id: session._id,
                batchId: batch._id,
                childId,
                status: batch.status,
                title: batch.name,
                dailyRoomName: batch.dailyRoomName,
                agoraToken: agoraToken || null,
                agoraAppId: AGORA_APP_ID || null
            } 
        });
    } catch (error) {
        console.error("Join batch error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// USER/SCHOLAR: GET /api/live/my-sessions - List sessions/batches available to user
export const getMySessions = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const user = await User.findOne({ clerkId: userId });

        if (!user) return res.status(404).json({ message: "User not found" });

        let batches = [];

        if (user.role === 'scholar' || user.role === 'admin') {
            // Get batches where they are the assigned scholar
            const taughtBatches = await Batch.find({
                $or: [
                    { scholar: user._id },
                    { scholarEmail: user.email }
                ],
                status: { $ne: 'archived' }
            }).populate('scholar', 'name').sort({ createdAt: -1 });

            // Also get batches where THEIR own children are enrolled (for admins who are parents)
            const children = await Child.find({ parent_id: user._id });
            const childIds = children.map(c => c._id);
            const enrolledBatches = await Batch.find({
                students: { $in: childIds },
                status: { $ne: 'archived' }
            }).populate('scholar', 'name').sort({ createdAt: -1 });

            // Merge and deduplicate
            const batchIds = new Set(taughtBatches.map(b => b._id.toString()));
            batches = [...taughtBatches];
            for (const b of enrolledBatches) {
                if (!batchIds.has(b._id.toString())) {
                    batches.push(b);
                }
            }
        } else {
            // Parent: Find batches where their children are enrolled
            const children = await Child.find({ parent_id: user._id });
            const childIds = children.map(c => c._id);

            batches = await Batch.find({
                students: { $in: childIds },
                status: { $ne: 'archived' }
            }).populate('scholar', 'name').sort({ createdAt: -1 });
        }

        const AGORA_APP_ID = process.env.AGORA_APP_ID;

        // Map to Frontend Expected Format (LiveSession equivalent for list view)
        const mappedSessions = await Promise.all(batches.map(async b => {
            let activeParticipants = [];
            let agoraToken = null;
            if (b.activeSessionId) {
                 const session = await Session.findById(b.activeSessionId);
                 if (session && session.status === 'live') {
                     const { getNumericUid } = await import("../utils/tarbiyahUtils.js");
                     // Generate token for student (subscriber)
                     agoraToken = generateAgoraToken(b._id.toString(), getNumericUid(req.auth.userId), 'subscriber');

                     activeParticipants = (session.attendance || [])
                        .filter(p => p && p.isActive)
                        .map(p => ({
                            childId: p.childId,
                            childName: p.childName,
                            isActive: true
                        }));
                 }
            }

            return {
                _id: b._id,
                title: b.name || `Batch ${b._id.toString().substr(-4)}`,
                name: b.name,
                description: b.name,
                status: b.status,
                scholarName: b.scholar?.name || 'Assigned Scholar',
                schedule: b.schedule,
                isBatch: true,
                activeSessionId: b.activeSessionId, 
                activeParticipants: activeParticipants,
                dailyRoomName: b.dailyRoomName,
                agoraToken: agoraToken || null,
                agoraAppId: AGORA_APP_ID || null,
                pastSessions: b.pastSessions || [],
                students: (b.students || []).map(s => s._id || s)
            };
        }));

        res.json(mappedSessions);

    } catch (error) {
        console.error("Get my sessions error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/live/:id/end - End Session
// Disabled in favor of Batch-based End
// ... (Removing stub completely)

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

// ADMIN DEBUG: GET /api/live/debug/batches
export const debugAllBatches = async (req, res) => {
    try {
        const { default: Batch } = await import("../models/Batch.js");
        const batches = await Batch.find({}).populate('scholar', 'name email clerkId');

        const report = batches.map(b => ({
            id: b._id,
            name: b.name,
            scholarId: b.scholar?._id,
            scholarName: b.scholar?.name,
            scholarClerkId: b.scholar?.clerkId,
            studentsCount: b.students.length,
            status: b.status,
            schedule: b.schedule
        }));

        res.json(report);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// USER: POST /api/live/ping - Heartbeat
export const batchPing = async (req, res) => {
    try {
        const { batchId, childId } = req.body;
        const { default: Batch } = await import("../models/Batch.js");
        const { default: Session } = await import("../models/Session.js");

        const batch = await Batch.findById(batchId);
        if (!batch || !batch.activeSessionId) return res.json({ ok: false });

        await Session.updateOne(
            { _id: batch.activeSessionId, "attendance.childId": childId },
            { $set: { "attendance.$.lastSeen": new Date(), "attendance.$.isActive": true } }
        );

        // 🔥 SYNC: Also update Batch.activeParticipants for Scholar Live View
        await Batch.updateOne(
            { _id: batchId, "activeParticipants.childId": childId },
            { $set: { "activeParticipants.$.lastSeen": new Date(), "activeParticipants.$.isActive": true } }
        );

        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// USER: POST /api/live/update-progress - Sync Surah/Ayah (STAGE: BACKEND STORE)
export const updateBatchProgress = async (req, res) => {
    try {
        const { batchId, childId, surah, ayah } = req.body;
        const clerkId = req.auth.userId;

        // 0. OWNERSHIP CHECK
        const access = await verifyChildAccess(clerkId, childId);
        if (!access) return res.status(403).json({ success: false, message: "Forbidden: Not your student" });

        const { default: Batch } = await import("../models/Batch.js");

        const result = await Batch.updateOne(
            { _id: batchId, "activeParticipants.childId": childId },
            {
                $set: {
                    "activeParticipants.$.currentSurah": Number(surah),
                    "activeParticipants.$.currentAyah": Number(ayah),
                    "activeParticipants.$.lastSeen": new Date(),
                    "activeParticipants.$.isActive": true
                }
            }
        );
        if (result.modifiedCount === 0) {
            console.warn("[BACKEND STORE] No participant matched — check batchId/childId");
        }
        console.log("[BACKEND BROADCAST] Position stored; scholar will receive on next poll (≤2s)");
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// USER: POST /api/live/update-position - Student position (surah/ayah) — same store as update-progress, with userId + timestamp
export const updatePosition = async (req, res) => {
    try {
        const { batchId, childId, surahNumber, ayahNumber } = req.body;
        const { default: Batch } = await import("../models/Batch.js");
        const { default: Session } = await import("../models/Session.js");

        const batch = await Batch.findById(batchId);
        if (!batch || !batch.activeSessionId) return res.status(404).json({ success: false });

        await Session.updateOne(
            { _id: batch.activeSessionId, "attendance.childId": childId },
            {
                $set: {
                    "attendance.$.currentSurah": Number(surahNumber),
                    "attendance.$.currentAyah": Number(ayahNumber),
                    "attendance.$.lastSeen": new Date(),
                    "attendance.$.isActive": true
                }
            }
        );

        // 🔥 SYNC: Also update Batch.activeParticipants for Scholar Live View
        await Batch.updateOne(
            { _id: batchId, "activeParticipants.childId": childId },
            {
                $set: {
                    "activeParticipants.$.currentSurah": Number(surahNumber),
                    "activeParticipants.$.currentAyah": Number(ayahNumber),
                    "activeParticipants.$.lastSeen": new Date(),
                    "activeParticipants.$.isActive": true
                }
            }
        );

        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// USER: POST /api/live/leave - Leave Batch
export const leaveBatch = async (req, res) => {
    try {
        const { batchId, childId } = req.body;
        const { default: Batch } = await import("../models/Batch.js");
        const { default: Session } = await import("../models/Session.js");

        const batch = await Batch.findById(batchId);
        if (batch && batch.activeSessionId) {
            await Session.updateOne(
                { _id: batch.activeSessionId, "attendance.childId": childId },
                { $set: { "attendance.$.isActive": false } }
            );

            // 🔥 SYNC: Also update Batch.activeParticipants for Scholar Live View
            await Batch.updateOne(
                { _id: batchId, "activeParticipants.childId": childId },
                { $set: { "activeParticipants.$.isActive": false } }
            );
        }
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// SCHOLAR: GET /api/live/batch/:id/participants - Get live students (STAGE: SCHOLAR RECEIVE)
const PARTICIPANT_ACTIVE_MS = 60 * 1000; // 60 seconds — no timezone, use UTC millis

export const getBatchActiveParticipants = async (req, res) => {
    try {
        const { id } = req.params;
        const { default: Batch } = await import("../models/Batch.js");
        const batch = await Batch.findById(id);

        if (!batch) return res.status(404).json({ message: "Batch not found" });

        const nowMs = Date.now();

        let dirty = false;
        batch.activeParticipants.forEach(p => {
            const lastSeenMs = p.lastSeen ? new Date(p.lastSeen).getTime() : 0;
            if (p.isActive && (nowMs - lastSeenMs > PARTICIPANT_ACTIVE_MS)) {
                p.isActive = false;
                dirty = true;
            }
        });

        if (dirty) await batch.save();

        const liveParticipants = batch.activeParticipants.filter(p => p.isActive);

        console.log("[SCHOLAR RECEIVE]", { batchId: id, count: liveParticipants.length });

        res.json({
            activeChildId: batch.activeChildId,
            activeSessionId: batch.activeSessionId,
            status: batch.status,
            // Explicitly map liveParticipants to ensure childName makes it to JSON (sometimes Mongoose strict schema strips undocumented fields if not careful, though we added it to schema)
            activeParticipants: liveParticipants.map(p => ({
                _id: p._id,
                childId: p.childId,
                childName: p.childName || 'Student',
                currentSurah: p.currentSurah,
                currentAyah: p.currentAyah,
                lastSeen: p.lastSeen,
                isActive: p.isActive
            })),
            currentPromptAnswers: batch.currentPromptAnswers || [],
            promptEvaluated: batch.promptEvaluated || false
        });

    } catch (error) {
        console.error("[SCHOLAR RECEIVE] Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// GET /api/live/batch/:id/state
export const getBatchState = async (req, res) => {
    try {
        const { id } = req.params;
        const { default: Batch } = await import("../models/Batch.js");
        const { default: Session } = await import("../models/Session.js");
        const { default: LiveScore } = await import("../models/LiveScore.js");

        const batch = await Batch.findById(id).select("activeChildId activeSessionId status dailyRoomName promptEvaluated currentPromptAnswers pastSessions activeParticipants");
        if (!batch) return res.status(404).json({ message: "Batch not found" });

        let session = null;
        if (batch.activeSessionId) {
            session = await Session.findById(batch.activeSessionId);
        }

        const activeParticipants = batch.activeParticipants || [];
        
        let activeSurah = null;
        let activeAyah = null;
        if (batch.activeChildId) {
            const activeParticipant = activeParticipants.find(p => p.childId === batch.activeChildId);
            if (activeParticipant) {
                activeSurah = activeParticipant.currentSurah;
                activeAyah = activeParticipant.currentAyah;
            }
        }

        const { childId } = req.query;
        let currentScore = 0;
        if (childId && batch.activeSessionId) {
            const scoreDoc = await LiveScore.findOne({ batchId: id, sessionId: batch.activeSessionId, childId });
            if (scoreDoc) currentScore = (scoreDoc.recitationScore || 0) + (scoreDoc.participationScore || 0);
        }

        // GENERATE AGORA TOKEN ON-DEMAND (Channel = Batch ID)
        let agoraToken = null;
        let agoraAppId = process.env.AGORA_APP_ID;
        if (batch.status === 'active' || (req.query?.forceToken === 'true')) {
            try {
                const { generateAgoraToken } = await import("../services/agoraService.js");
                const { SCHOLAR_EMAILS, isRootAdmin } = await import("../utils/constants.js");
                const { getNumericUid } = await import("../utils/tarbiyahUtils.js");
                
                const userEmail = req.auth?.emailAddresses?.[0]?.emailAddress;
                const isScholar = SCHOLAR_EMAILS.includes(userEmail?.toLowerCase());
                const isAdmin = isRootAdmin(userEmail);
                
                // Admins/Scholars are publishers, students are subscribers
                const role = (isScholar || isAdmin) ? 'publisher' : 'subscriber';
                
                // Pass real numeric UID to token generation (Critical fix)
                const numericUid = getNumericUid(req.auth.userId);
                agoraToken = generateAgoraToken(id, numericUid, role);
            } catch (err) {
                console.warn("[Agora] Token generation failed during state poll:", err.message);
            }
        }

        res.json({
            activeChildId: batch.activeChildId,
            activeSessionId: batch.activeSessionId,
            status: batch.status,
            activeSurah,
            activeAyah,
            currentScore,
            currentPromptAnswers: batch.currentPromptAnswers || [],
            promptEvaluated: batch.promptEvaluated || false,
            activeParticipants: activeParticipants,
            pastSessions: batch.pastSessions || [],
            agoraToken,
            agoraAppId,
            channel: id
        });
    } catch (error) {
        console.error("Get batch state error:", error);
        res.status(500).json({ error: error.message, activeParticipants: [], pastSessions: [] });
    }
};

// ADMIN: EMERGENCY LINK RECOVERY
export const emergencyLinkRestore = async (req, res) => {
    try {
        const { default: Child } = await import("../models/Child.js");
        const { default: User } = await import("../models/User.js");

        const orphans = await Child.find({ $or: [{ parent_id: { $exists: false } }, { childUserId: { $exists: false } }] });
        const studentUsers = await User.find({ role: "student" });
        // Use a wide window for parents
        const recentlyActiveParents = await User.find({ role: "parent", lastHeartbeat: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } });

        const results = [];
        for (const o of orphans) {
            const studentMatch = studentUsers.find(s => s.name === o.name);
            if (studentMatch && !o.childUserId) {
                o.childUserId = studentMatch._id;
                
                // If only one parent is active, it's virtually certain they are the owner
                if (recentlyActiveParents.length === 1) {
                    o.parent_id = recentlyActiveParents[0]._id;
                }
                
                // Backup plan: if parents > 1 but we find ONLY ONE student with this name,
                // we can't be 100% sure of parent, but we can fix childUserId.
                
                o.markModified('childUserId');
                o.markModified('parent_id');
                await o.save();
                results.push({ name: o.name, restored: !!o.childUserId, parentLinked: !!o.parent_id });
            }
        }
        res.json({ success: true, count: results.length, details: results, parentCount: recentlyActiveParents.length });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// POST /api/live/batch/:id/select-turn
export const selectTurn = async (req, res) => {
    try {
        const { id } = req.params;
        const { childId } = req.body;
        const { default: Batch } = await import("../models/Batch.js");

        const batch = await Batch.findByIdAndUpdate(id, { 
            activeChildId: childId,
            currentPromptAnswers: [],
            promptEvaluated: false
        }, { new: true });

        // Reset the student's position so they start fresh on the Quran landing page
        await Batch.updateOne(
            { _id: id, "activeParticipants.childId": childId },
            { $set: { "activeParticipants.$.currentSurah": null, "activeParticipants.$.currentAyah": null } }
        );

        res.json({ message: "Turn updated", activeChildId: batch.activeChildId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/live/batch/:id/score-recitation
export const scoreRecitation = async (req, res) => {
    try {
        const { id } = req.params;
        const { childId, score } = req.body;
        const { default: Batch } = await import("../models/Batch.js");
        const { default: LiveScore } = await import("../models/LiveScore.js");
        const { awardXP } = await import("../services/gamificationService.js");

        const batch = await Batch.findById(id);
        if (!batch || !batch.activeSessionId) return res.status(400).json({ message: "Batch not active or found" });

        // Enforce strict limit maps (4=Excellent, 3=Good, 2=Average, 1=Needs Improvement)
        if (![1, 2, 3, 4].includes(Number(score))) {
            return res.status(400).json({ message: "Score must be 1, 2, 3, or 4" });
        }
        const xpAward = Number(score) === 4 ? 10 : Number(score) === 3 ? 7 : Number(score) === 2 ? 5 : 2;

        await LiveScore.findOneAndUpdate(
            { batchId: id, sessionId: batch.activeSessionId, childId },
            { $inc: { recitationScore: xpAward } },
            { upsert: true, new: true }
        );

        // Reset Turn (Return Scholar to Observer Mode)
        batch.activeChildId = null;
        batch.currentPromptAnswers = [];
        batch.promptEvaluated = false;
        await batch.save();

        // Award Gamification XP for Recitation
        const xpResult = await awardXP(childId, "recitation", { score: xpAward, rawScore: score });

        res.json({ message: "Score saved", nextChildId: null, xpResult });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/live/batch/:id/score-participation
export const scoreParticipation = async (req, res) => {
    try {
        const { id } = req.params;
        const { childId, points } = req.body; // usually 1
        const { default: Batch } = await import("../models/Batch.js");
        const { default: LiveScore } = await import("../models/LiveScore.js");
        const { awardXP } = await import("../services/gamificationService.js");

        const batch = await Batch.findById(id);
        if (!batch || !batch.activeSessionId) return res.status(400).json({ message: "Batch not active" });

        // Auth already handled by isScholar middleware on route level
        // req.user is attached by middleware
        
        await LiveScore.findOneAndUpdate(
            { batchId: id, sessionId: batch.activeSessionId, childId },
            { $inc: { participationScore: points || 1 } },
            { upsert: true, new: true }
        );

        // Award Gamification XP for Participation
        const xpResult = await awardXP(childId, "participation", { points: points || 1 });

        res.json({ message: "Participation logged", xpResult });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/live/batch/:id/submit-prompt
export const submitPrompt = async (req, res) => {
    try {
        const { id } = req.params;
        const { childId, answer } = req.body;
        const { default: Batch } = await import("../models/Batch.js");

        const batch = await Batch.findById(id);
        if (!batch || !batch.activeSessionId) return res.status(400).json({ message: "Batch not active" });

        // 0. OWNERSHIP CHECK (or isScholar bypass)
        const clerkId = req.auth.userId;
        const access = await verifyChildAccess(clerkId, childId);
        const user = access?.user || await User.findOne({ clerkId });
        const isScholar = user && (user.role === 'scholar' || user.role === 'admin' || isRootAdmin(user.email));
        
        if (!access && !isScholar) {
            return res.status(403).json({ message: "Access denied: Not your child profile" });
        }

        // Update or add the answer
        const existingIdx = batch.currentPromptAnswers.findIndex(a => a.childId === childId);
        if (existingIdx > -1) {
            batch.currentPromptAnswers[existingIdx].answer = answer;
        } else {
            batch.currentPromptAnswers.push({ childId, answer });
        }
        await batch.save();

        res.json({ message: "Prompt submitted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/live/batch/:id/evaluate-prompt
export const evaluatePrompt = async (req, res) => {
    try {
        const { id } = req.params;
        const { correctAnswer } = req.body; // 'yes' or 'no'
        const { default: Batch } = await import("../models/Batch.js");
        const { default: LiveScore } = await import("../models/LiveScore.js");
        const { awardXP } = await import("../services/gamificationService.js");

        const batch = await Batch.findById(id);
        if (!batch || !batch.activeSessionId) return res.status(404).json({ message: "Batch not found or not active" });

        if (batch.promptEvaluated) {
            return res.status(400).json({ message: "Prompt already evaluated for this turn" });
        }

        // Find all students who answered correctly and incorrectly
        const correctStudents = batch.currentPromptAnswers.filter(a => a.answer === correctAnswer);
        const incorrectStudents = batch.currentPromptAnswers.filter(a => a.answer !== correctAnswer);

        // Award XP asynchronously and update LiveScores
        const correctPromises = correctStudents.map(async (student) => {
            await LiveScore.findOneAndUpdate(
                { batchId: id, sessionId: batch.activeSessionId, childId: student.childId },
                { $inc: { participationScore: 1 } }, // Correct answer = 1 point
                { upsert: true }
            );
            return awardXP(student.childId, "participation", { points: 1 });
        });

        const incorrectPromises = incorrectStudents.map(async (student) => {
            // Incorrect = 0 XP
            return Promise.resolve();
        });

        await Promise.allSettled([...correctPromises, ...incorrectPromises]);

        batch.promptEvaluated = true;
        await batch.save();

        res.json({ message: "Observers evaluated and XP awarded", correctCount: correctStudents.length });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/live/batch/:id/leaderboard
export const getLeaderboard = async (req, res) => {
    try {
        const { id } = req.params;
        const { default: Batch } = await import("../models/Batch.js");
        const { default: LiveScore } = await import("../models/LiveScore.js");
        const { default: Child } = await import("../models/Child.js");

        const batch = await Batch.findById(id);
        if (!batch) return res.json({ leaderboard: [] });

        let querySessionId = req.query.sessionId || batch.activeSessionId;
        
        // If no active session, grab the most recently ended session to populate Class Results
        if (!querySessionId && batch.pastSessions && batch.pastSessions.length > 0) {
            querySessionId = batch.pastSessions[batch.pastSessions.length - 1].sessionId;
        }

        if (!querySessionId) return res.json({ leaderboard: [] });

        const scores = await LiveScore.find({ batchId: id, sessionId: querySessionId });
        const childIds = scores.map(s => s.childId);
        const children = await Child.find({ _id: { $in: childIds } }).select('name');
        const childMap = Object.fromEntries(children.map(c => [c._id.toString(), c.name]));

        const leaderboard = scores.map(s => ({
            childId: s.childId,
            name: childMap[s.childId.toString()] || "Unknown",
            recitationScore: s.recitationScore,
            participationScore: s.participationScore,
            total: (s.recitationScore || 0) + (s.participationScore || 0)
        }));

        leaderboard.sort((a, b) => b.total - a.total);

        res.json({ leaderboard });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/live/global-leaderboard
export const getGlobalLeaderboard = async (req, res) => {
    try {
        const { default: Child } = await import("../models/Child.js");
        const children = await Child.find({"child_progress.0": { $exists: true }})
            .select("name child_progress")
            .sort({ "child_progress.0.total_xp": -1 })
            .limit(10);
            
        const leaderboard = children.map(c => ({
            id: c._id,
            name: c.name,
            totalXp: c.child_progress[0]?.total_xp || 0,
            level: c.child_progress[0]?.level || 1,
            streak: c.child_progress[0]?.streak_days || 0
        }));
        
        res.json({ leaderboard });
    } catch (e) {
        console.error("Global leaderboard error:", e);
        res.status(500).json({ error: e.message });
    }
};

// GET /api/live/scholar/batches
export const getScholarBatches = async (req, res) => {
    try {
        const clerkId = req.auth.userId;
        const user = await User.findOne({ clerkId });

        // Resolve email from Clerk if user not in DB yet
        let userEmail = user?.email?.toLowerCase() || null;
        if (!userEmail) {
            try {
                const { clerkClient } = await import('@clerk/clerk-sdk-node');
                const clerkUser = await clerkClient.users.getUser(clerkId);
                userEmail = clerkUser.emailAddresses?.[0]?.emailAddress?.toLowerCase() || null;
            } catch (e) {
                console.warn('[getScholarBatches] Clerk email lookup failed:', e.message);
            }
        }

        // 🔥 REVISE: Only root admins see everything. Regular admins only see batches assigned to them.
        const isRoot = isRootAdmin(userEmail);
        const isAdminProfile = user?.role === 'admin';

        let query = {};
        if (!isRoot) {
            // Build OR query: match by MongoDB user._id OR by email stored in batch
            const orClauses = [];
            if (user?._id) orClauses.push({ scholar: user._id });
            if (userEmail) orClauses.push({ scholarEmail: userEmail });
            
            if (orClauses.length > 0) {
                query = { $or: orClauses };
            } else {
                // No scholar ID or email? Return nothing (safe)
                return res.json({ batches: [] });
            }
        }
        // root admins: query = {} → all batches

        console.log(`[getScholarBatches] user=${userEmail} isRoot=${isRoot} query=${JSON.stringify(query)}`);

        const rawBatches = await Batch.find(query)
            .populate('scholar', 'name email')
            .sort({ createdAt: -1 });

        const AGORA_APP_ID = process.env.AGORA_APP_ID;

        // Map to the same frontend-expected shape as getMySessions
        const batches = await Promise.all(rawBatches.map(async (b) => {
            let activeParticipants = [];
            let agoraToken = null;
            if (b.activeSessionId) {
                const session = await Session.findById(b.activeSessionId);
                if (session && session.status === 'live') {
                    // Generate token for scholar (publisher role)
                    agoraToken = generateAgoraToken(b._id.toString(), 0, 'publisher');

                    activeParticipants = (session.attendance || [])
                        .filter(p => p && p.isActive)
                        .map(p => ({
                            childId: p.childId,
                            childName: p.childName,
                            isActive: true,
                            currentSurah: p.currentSurah,
                            currentAyah: p.currentAyah
                        }));
                }
            }
            return {
                _id: b._id,
                title: b.name || `Batch ${b._id.toString().substr(-4)}`,
                name: b.name,
                description: b.name,
                status: b.status,
                scholarName: b.scholar?.name || 'Assigned Scholar',
                schedule: b.schedule,
                isBatch: true,
                activeSessionId: b.activeSessionId || null,
                activeChildId: b.activeChildId || null,
                activeParticipants,
                dailyRoomName: b.dailyRoomName,
                agoraToken: agoraToken || null,
                agoraAppId: AGORA_APP_ID || null,
                pastSessions: b.pastSessions || [],
                students: (b.students || []).map(s => s._id || s)
            };
        }));

        res.json({ batches });
    } catch (error) {
        console.error("Scholar batches error:", error);
        res.status(500).json({ error: error.message });
    }
};

// POST /api/live/batch/:id/end
export const endBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { default: Batch } = await import("../models/Batch.js");
        const { awardXP } = await import("../services/gamificationService.js");

        // ATOMIC FIX: Clear activeSessionId and status in one operation
        // This prevents race conditions where double clicks could award double XP
        const batch = await Batch.findOneAndUpdate(
            { _id: id, activeSessionId: { $ne: null } },
            { 
                $set: { 
                    status: 'upcoming',
                    activeSessionId: null,
                    activeChildId: null,
                    activeParticipants: [] 
                } 
            },
            { new: false } // We need the PRE-UPDATE state to get pastSessions/participants
        );

        if (!batch) {
            return res.status(400).json({ message: "No active session to end. Already processed or not found." });
        }

        const activeSessionId = batch.activeSessionId;
        
        // 1. Mark the historical session as ended in the DB
        // Since we have the batch object before the update, we can find the session index
        let sessionToReward = null;
        if (activeSessionId) {
            const sessions = batch.pastSessions || [];
            const sessionIndex = sessions.findIndex(s => s.sessionId === activeSessionId);
            if (sessionIndex > -1) {
                // We update the specific pastSession entry directly in DB
                await Batch.updateOne(
                    { _id: id, "pastSessions.sessionId": activeSessionId },
                    { $set: { "pastSessions.$.endedAt": new Date() } }
                );
                sessionToReward = sessions[sessionIndex];
            }
        }

        // 2. Ensure ALL participants who attended at any point get completion XP
        const childrenToAward = new Set();
        
        if (sessionToReward && sessionToReward.attendedChildren) {
            sessionToReward.attendedChildren.forEach(id => childrenToAward.add(id.toString()));
        }
        
        if (batch.activeParticipants) {
            batch.activeParticipants.forEach(p => childrenToAward.add(p.childId.toString()));
        }

        for (const childId of childrenToAward) {
            try { 
                await awardXP(childId, "session_complete", { sessionId: activeSessionId, batchId: id });
            } catch (err) { 
                console.error(`Failed to award end-session XP to ${childId}:`, err);
            }
        }

        res.json({ message: "Batch ended and XP awarded" });
    } catch (error) {
        console.error("End batch error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// GET /api/live/batch/:id/attendance/:childId - Get attendance history for a child
export const getBatchAttendance = async (req, res) => {
    try {
        const { id, childId } = req.params;
        const { default: Batch } = await import("../models/Batch.js");
        const batch = await Batch.findById(id);
        if (!batch) return res.status(404).json({ message: "Batch not found" });

        // Map past sessions to their attendance status for this child
        const history = (batch.pastSessions || []).map(session => ({
            sessionId: session.sessionId,
            startedAt: session.startedAt,
            endedAt: session.endedAt,
            attended: session.attendedChildren?.map(s => s.toString()).includes(childId) || false
        })).sort((a,b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ADMIN: POST /api/live/admin/batch/:id/force-end - Emergency reset
export const forceEndBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const { default: Batch } = await import("../models/Batch.js");
        const batch = await Batch.findById(id);
        if (!batch) return res.status(404).json({ message: "Batch not found" });

        batch.status = 'upcoming';
        
        // Fix endedAt for orphaned session
        if (batch.activeSessionId) {
            batch.pastSessions = batch.pastSessions || [];
            const sessionIndex = batch.pastSessions.findIndex(s => s.sessionId === batch.activeSessionId);
            if (sessionIndex > -1) {
                batch.pastSessions[sessionIndex].endedAt = new Date();
                batch.markModified('pastSessions');
            }
        }
        
        batch.activeSessionId = null;
        batch.activeChildId = null;
        batch.activeParticipants = [];
        await batch.save();

        res.json({ message: "Batch force-reset to upcoming status (Session ended history recorded)" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DAILY.CO WEBHOOK HANDLER
export const handleDailyWebhook = async (req, res) => {
    try {
        // --- 🔴 CRITICAL: Signature Verification ---
        const signature = req.headers['x-daily-signature'];
        const sharedSecret = process.env.DAILY_WEBHOOK_SECRET;
        
        if (sharedSecret && signature) {
            const crypto = await import('node:crypto');
            const hmac = crypto.createHmac('sha256', sharedSecret);
            const body = JSON.stringify(req.body);
            hmac.update(body);
            const expected = hmac.digest('hex');
            
            if (signature !== expected) {
                console.warn("[Daily Webhook] Signature mismatch. Possible spoofing attempt.");
                return res.status(401).json({ error: "Invalid signature" });
            }
        }
        
        const { event, payload } = req.body;
        if (!payload || !payload.room) return res.status(200).json({ status: "skipped" });

        const { default: Batch } = await import("../models/Batch.js");

        const roomQuery = [{ dailyRoomName: payload.room }];
        if (payload.room.match(/^[0-9a-fA-F]{24}$/)) {
            roomQuery.push({ _id: payload.room });
        }
        const batch = await Batch.findOne({ $or: roomQuery });

        if (!batch) return res.status(200).json({ status: "not_found" });

        if (event === "participant.joined") {
            const childId = payload.participant?.user_id;
            const childName = payload.participant?.user_name || "Student";

            const pIdx = batch.activeParticipants.findIndex(p => p.childId === childId);
            if (pIdx > -1) {
                batch.activeParticipants[pIdx].isActive = true;
                batch.activeParticipants[pIdx].lastSeen = new Date();
            } else if (childId) {
                batch.activeParticipants.push({ childId, childName, isActive: true, lastSeen: new Date() });
            }

            if (batch.activeSessionId && childId) {
                const session = batch.pastSessions.find(s => s.sessionId === batch.activeSessionId);
                if (session && !session.attendedChildren.map(id => id.toString()).includes(childId.toString())) {
                    session.attendedChildren.push(childId);
                    batch.markModified('pastSessions'); // FIXED: Force Mongoose to see the mutation
                }
            }
            await batch.save();
        }

        if (event === "participant.joined" || event === "participant.left") {
             const { default: Session } = await import("../models/Session.js");
             const childId = payload.participant?.user_id;

             if (batch.activeSessionId) {
                 await Session.updateOne(
                    { _id: batch.activeSessionId, "attendance.childId": childId },
                    { $set: { "attendance.$.isActive": (event === "participant.joined") } }
                 );
             }
        }

        res.status(200).json({ status: "success", event });
    } catch (err) {
        console.error("Daily Webhook Error:", err);
        res.status(200).json({ status: "error" });
    }
};

