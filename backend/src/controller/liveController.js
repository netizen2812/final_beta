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

// POST /api/live/start - Parent starts a session (Legacy)
export const startSession = async (req, res) => {
    res.status(501).json({ message: "Legacy session method disabled" });
};

// GET /api/live/scholar/sessions - Scholar fetches active sessions (Legacy)
export const getScholarSessions = async (req, res) => {
    res.json({ sessions: [] });
};

// GET /api/live/:id - Get single session
export const getSession = async (req, res) => {
    res.status(404).json({ message: "Not found" });
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
            status: status || 'upcoming'
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
        const { id } = req.params;
        const { default: Batch } = await import("../models/Batch.js");

        const batch = await Batch.findById(id);
        if (!batch) return res.status(404).json({ message: "Batch not found" });

        const mappedSessions = batch.activeParticipants
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
        const { default: Batch } = await import("../models/Batch.js");

        let batch = await Batch.findById(id);
        if (batch && batch.status === 'active' && batch.activeSessionId) {
            return res.json({ message: "Batch already active", activeSessionId: batch.activeSessionId });
        }

        const activeSessionId = Date.now().toString();

        await Batch.findByIdAndUpdate(id, { 
            status: 'active',
            activeSessionId,
            activeChildId: null,
            $push: { pastSessions: { sessionId: activeSessionId, startedAt: new Date() } }
        });
        res.json({ message: "Batch started", activeSessionId });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// USER: POST /api/live/:id/join - Student joins a batch (Presence Tracking)
export const joinBatch = async (req, res) => {
    console.log("🚀 joinBatch (Presence) called for Batch ID:", req.params.id);
    console.log("Request Body:", req.body);

    try {
        const { id } = req.params; // Batch ID
        const { childId } = req.body;
        const userId = req.auth.userId;

        if (!id || !childId) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const { default: Batch } = await import("../models/Batch.js");
        const { default: Child } = await import("../models/Child.js");

        const batch = await Batch.findById(id);
        if (!batch) return res.status(404).json({ success: false, message: "Batch not found" });

        // Ensure session is actually active (Scholar has joined)
        if (batch.status !== 'active') {
            return res.status(403).json({ 
                success: false, 
                message: "Waiting for scholar to start session. Please stay in the lobby!" 
            });
        }

        // Verify Enrollment
        const isEnrolled = batch.students.map(s => s.toString()).includes(childId);
        if (!isEnrolled) {
            return res.status(403).json({ success: false, message: "Student not enrolled in this batch" });
        }

        // --- PRESENCE TRACKING START ---
        // 1. Get Child Details
        const child = await Child.findById(childId);
        const childName = child ? child.name : "Student";

        // 2. Update Batch Active Participants
        const participantIndex = batch.activeParticipants.findIndex(p => p.childId === childId);
        let firstJoinToday = false;

        if (participantIndex > -1) {
            if (!batch.activeParticipants[participantIndex].isActive) {
                firstJoinToday = true;
            }
            batch.activeParticipants[participantIndex].isActive = true;
            batch.activeParticipants[participantIndex].lastSeen = new Date();
            // Patch older records that might be missing childName from previous versions
            if (!batch.activeParticipants[participantIndex].childName && childName) {
                batch.activeParticipants[participantIndex].childName = childName;
            }
        } else {
            firstJoinToday = true;
            batch.activeParticipants.push({
                childId,
                childName,
                // Do not set Surah/Ayah defaults (allow frontend to determine or stay null)
                lastSeen: new Date(),
                isActive: true
            });
        }
        await batch.save();

        // Award Attendance XP (Observe)
        const { awardXP } = await import("../services/gamificationService.js");
        if (firstJoinToday) {
            await awardXP(childId, "participation", { points: 2 });
        }
        // --- PRESENCE TRACKING END ---

        const mockSession = {
            _id: batch.activeSessionId || batch._id.toString(),
            batchId: batch._id,
            childId,
            status: batch.status,
            title: batch.name
        };

        res.json({ success: true, session: mockSession, message: "Joined successfully" });

    } catch (error) {
        console.error("❌ Join Batch Error:", error);
        res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
};

// USER/SCHOLAR: GET /api/live/my-sessions - List sessions/batches available to user
export const getMySessions = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const user = await User.findOne({ clerkId: userId });

        if (!user) return res.status(404).json({ message: "User not found" });

        const { default: Batch } = await import("../models/Batch.js");
        let batches = [];

        if (user.role === 'scholar') {
            // Scholar: Find batches assigned to them
            batches = await Batch.find({
                scholar: user._id,
                status: { $ne: 'archived' }
            }).sort({ createdAt: -1 });

        } else {
            // Parent: Find batches where their children are enrolled
            const { default: Child } = await import("../models/Child.js");
            const children = await Child.find({ parent_id: user._id });
            const childIds = children.map(c => c._id);

            batches = await Batch.find({
                students: { $in: childIds },
                status: { $ne: 'archived' }
            }).populate('scholar', 'name').sort({ createdAt: -1 });
        }

        // Map to Frontend Expected Format (LiveSession equivalent for list view)
        const mappedSessions = batches.map(b => ({
            _id: b._id,
            title: b.name || `Batch ${b._id.toString().substr(-4)}`, // Fallback for empty name
            description: b.name,
            status: b.status,
            scholarName: b.scholar?.name || 'Assigned Scholar',
            schedule: b.schedule,
            isBatch: true, // Flag to distinguish from individual sessions
            activeSessionId: b.activeSessionId, 
            pastSessions: b.pastSessions || [], // Needed by TarbiyahLobby to unlock Journey nodes
            activeParticipants: b.activeParticipants || []
        }));

        res.json(mappedSessions);

    } catch (error) {
        console.error("Get my sessions error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// PATCH /api/live/:id - Update Ayah (Parent)
export const updateAyah = async (req, res) => {
    // Legacy Ayah saving disabled; Progress relies entirely on websockets and SessionEnd XP.
    res.json({ success: true, message: "Progress logged" });
};

// POST /api/live/:id/end - End Session
export const endSession = async (req, res) => {
    res.status(501).json({ message: "Disabled" });
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
        console.log("[BACKEND STORE] update-progress", { childId, surah, ayah, ts: new Date().toISOString() });

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
        const { userId, batchId, childId, surahNumber, ayahNumber, timestamp } = req.body;
        const id = childId || userId;
        if (!batchId || !id) {
            return res.status(400).json({ success: false, message: "batchId and childId (or userId) required" });
        }
        const surah = surahNumber != null ? Number(surahNumber) : null;
        const ayah = ayahNumber != null ? Number(ayahNumber) : null;
        if (surah == null || ayah == null) {
            return res.status(400).json({ success: false, message: "surahNumber and ayahNumber required" });
        }

        console.log("[BACKEND STORE] update-position", { userId, childId: id, surah, ayah, ts: timestamp || new Date().toISOString() });

        const { default: Batch } = await import("../models/Batch.js");

        const result = await Batch.updateOne(
            { _id: batchId, "activeParticipants.childId": id },
            {
                $set: {
                    "activeParticipants.$.currentSurah": surah,
                    "activeParticipants.$.currentAyah": ayah,
                    "activeParticipants.$.lastSeen": new Date(),
                    "activeParticipants.$.isActive": true
                }
            }
        );

        if (result.matchedCount === 0) {
            console.warn("[BACKEND STORE] No participant matched for batchId/childId — student may not have joined");
            return res.status(404).json({ success: false, message: "Participant not found in batch" });
        }
        console.log("[BACKEND BROADCAST] Position stored; scholar will receive on next poll (≤2s)");
        res.json({ ok: true });
    } catch (error) {
        console.error("[BACKEND STORE] Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// USER: POST /api/live/leave - Leave Batch
export const leaveBatch = async (req, res) => {
    try {
        const { batchId, childId } = req.body;
        const { default: Batch } = await import("../models/Batch.js");

        await Batch.updateOne(
            { _id: batchId, "activeParticipants.childId": childId },
            { $set: { "activeParticipants.$.isActive": false } }
        );
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

        console.log("[SCHOLAR RECEIVE]", { batchId: id, count: liveParticipants.length, participants: liveParticipants.map(p => ({ childId: p.childId, childName: p.childName, surah: p.currentSurah, ayah: p.currentAyah, lastSeen: p.lastSeen })) });

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
        const batch = await Batch.findById(id).select("activeChildId activeSessionId status activeParticipants currentPromptAnswers promptEvaluated pastSessions");
        if (!batch) return res.status(404).json({ message: "Batch not found" });

        let activeSurah = null;
        let activeAyah = null;

        if (batch.activeChildId && batch.activeParticipants) {
            const activeParticipant = batch.activeParticipants.find(p => p.childId === batch.activeChildId);
            if (activeParticipant) {
                activeSurah = activeParticipant.currentSurah;
                activeAyah = activeParticipant.currentAyah;
            }
        }

        // FETCH REQUESTING CHILD'S CURRENT SESSION SCORE (For Real-time UI feedback)
        const { childId } = req.query;
        let currentScore = 0;
        if (childId && batch.activeSessionId) {
            const { default: LiveScore } = await import("../models/LiveScore.js");
            const scoreDoc = await LiveScore.findOne({ 
                batchId: id, 
                sessionId: batch.activeSessionId, 
                childId 
            });
            if (scoreDoc) {
                currentScore = (scoreDoc.recitationScore || 0) + (scoreDoc.participationScore || 0);
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
            activeParticipants: batch.activeParticipants || [],
            pastSessions: batch.pastSessions || []
        });
    } catch (error) {
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

// GET /api/live/batch/:id/attendance?childId=...
export const getBatchAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { childId } = req.query;
        if (!childId) return res.json({ attendedSessionIds: [] });
        
        const { default: Child } = await import("../models/Child.js");
        const child = await Child.findById(childId).lean();
        
        // Correctly navigate to child_progress[0].attendance
        const progress = child?.child_progress?.[0];
        if (!progress || !progress.attendance) return res.json({ attendedSessionIds: [] });

        const attendedSessionIds = progress.attendance
            .filter(a => a.batchId?.toString() === id)
            .map(a => a.sessionId)
            .filter(sid => !!sid); // Emergency Hotfix: filter out nulls
            
        res.json({ attendedSessionIds });
    } catch(err) { res.status(500).json({ error: err.message }); }
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

        // Enforce strict limit maps
        const xpAward = Number(score) === 3 ? 10 : Number(score) === 2 ? 7 : Number(score) === 1 ? 5 : 2;

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
        
        const leaderboard = await Promise.all(scores.map(async (s) => {
            const child = await Child.findById(s.childId);
            return {
                childId: s.childId,
                name: child ? child.name : "Unknown",
                recitationScore: s.recitationScore,
                participationScore: s.participationScore,
                total: (s.recitationScore || 0) + (s.participationScore || 0)
            };
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
        const { default: Batch } = await import("../models/Batch.js");
        // For MVP: Return all batches the scholar has access to.
        const batches = await Batch.find()
            .populate('scholar', 'name')
            .populate('students', 'name');
            
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

        const batch = await Batch.findById(id);
        if (!batch) return res.status(404).json({ message: "Batch not found" });

        // Prevent double-clicking / duplicate Session Complete XP bugs
        if (!batch.activeSessionId) {
            return res.status(400).json({ message: "No active session to end. Already processed." });
        }

        const durationMinutes = 45; 
        
        // Ensure participants who joined get completion XP
        if (batch.activeParticipants) {
            for (const p of batch.activeParticipants) {
                if (p.isActive) {
                    try { 
                        await awardXP(p.childId, "session_complete", { sessionId: batch.activeSessionId, batchId: id });
                    } catch (err) { }
                }
            }
        }

        // Mark the historical session as ended
        if (batch.activeSessionId) {
            batch.pastSessions = batch.pastSessions || [];
            const sessionIndex = batch.pastSessions.findIndex(s => s.sessionId === batch.activeSessionId);
            if (sessionIndex > -1) {
                batch.pastSessions[sessionIndex].endedAt = new Date();
                batch.markModified('pastSessions'); // Crucial fix: notify Mongoose that the mixed sub-array changed
            } else {
                // Failsafe: if startBatch missed it, push the completed session so the Journey advances
                batch.pastSessions.push({
                    sessionId: batch.activeSessionId,
                    startedAt: new Date(Date.now() - 45 * 60000), // Approximate 45 mins ago
                    endedAt: new Date()
                });
            }
        }

        // Return batch to an upcoming state for the next session
        batch.status = 'upcoming';
        // Cleanup active state so it can be restarted later
        batch.activeSessionId = null; 
        batch.activeChildId = null;
        batch.activeParticipants = [];
        await batch.save();

        res.json({ message: "Batch ended and XP awarded" });
    } catch (error) {
        console.error("End batch error:", error);
        res.status(500).json({ message: "Server error", error: error.message, stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined });
    }
};

// GET /api/live/batch/:id/students
export const getBatchStudents = async (req, res) => {
    try {
        const { id } = req.params;
        const { default: Batch } = await import("../models/Batch.js");
        const batch = await Batch.findById(id).populate('students');
        if (!batch) return res.status(404).json({ message: "Batch not found" });
        res.json(batch.students || []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
