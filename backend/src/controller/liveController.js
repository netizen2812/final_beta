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

        console.log("[SCHOLAR RECEIVE]", { batchId: id, count: liveParticipants.length, participants: liveParticipants.map(p => ({ childId: p.childId, surah: p.currentSurah, ayah: p.currentAyah, lastSeen: p.lastSeen })) });

        res.json({
            activeChildId: batch.activeChildId,
            activeSessionId: batch.activeSessionId,
            status: batch.status,
            activeParticipants: liveParticipants,
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

        res.json({
            activeChildId: batch.activeChildId,
            activeSessionId: batch.activeSessionId,
            status: batch.status,
            activeSurah,
            activeAyah,
            currentPromptAnswers: batch.currentPromptAnswers || [],
            promptEvaluated: batch.promptEvaluated || false,
            activeParticipants: batch.activeParticipants || [],
            pastSessions: batch.pastSessions || []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
        if (!child || !child.attendance) return res.json({ attendedSessionIds: [] });

        const attendedSessionIds = child.attendance
            .filter(a => a.type === 'session_complete' && a.details && a.details.batchId === id)
            .map(a => a.details.sessionId);
            
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

        await LiveScore.findOneAndUpdate(
            { batchId: id, sessionId: batch.activeSessionId, childId },
            { $inc: { recitationScore: score } },
            { upsert: true, new: true }
        );

        // Reset Turn (Return Scholar to Observer Mode)
        batch.activeChildId = null;
        batch.currentPromptAnswers = [];
        batch.promptEvaluated = false;
        await batch.save();

        // Award Gamification XP for Recitation
        const xpResult = await awardXP(childId, "recitation", { score });

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
        const { awardXP } = await import("../services/gamificationService.js");

        const batch = await Batch.findById(id);
        if (!batch) return res.status(404).json({ message: "Batch not found" });

        if (batch.promptEvaluated) {
            return res.status(400).json({ message: "Prompt already evaluated for this turn" });
        }

        // Find all students who answered correctly
        const correctStudents = batch.currentPromptAnswers.filter(a => a.answer === correctAnswer);

        // Award XP asynchronously
        const xpPromises = correctStudents.map(student => 
            awardXP(student.childId, "participation", { points: 5 }) // 5 XP for getting it right
        );
        await Promise.allSettled(xpPromises);

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

        const querySessionId = req.query.sessionId || batch.activeSessionId;
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
            }
        }

        batch.status = 'ended';
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
