import QuranAssignment from "../models/QuranAssignment.js";
import JuzSubpart from "../models/JuzSubpart.js";
import QuranQuestion from "../models/QuranQuestion.js";
import User from "../models/User.js";

/**
 * Assign a subpart to a student (child).
 */
export const createAssignment = async (req, res) => {
    try {
        const { childId, juz, subpart, subparts, dueDate } = req.body;
        const scholarId = req.user?._id;

        if (!scholarId) {
            return res.status(401).json({ message: "Scholar ID not found in request" });
        }

        // Determine subparts to assign: accept either a single number or an array
        const subpartList = Array.isArray(subparts) ? subparts : (subpart !== undefined ? [subpart] : []);
        if (subpartList.length === 0) {
            return res.status(400).json({ message: "No subpart(s) provided" });
        }
        
        // Verify all subparts exist for the given Juz
        const juzDoc = await JuzSubpart.findOne({ juz });
        if (!juzDoc) {
            return res.status(404).json({ message: `Juz ${juz} metadata not found` });
        }
        const availableParts = juzDoc.parts.map(p => p.partNum);
        const missing = subpartList.filter(sp => !availableParts.includes(sp));

        if (missing.length) {
            return res.status(404).json({ message: `Subpart(s) not found for Juz ${juz}: ${missing.join(', ')}` });
        }

        // Create assignments for each subpart
        const assignments = await Promise.all(
            subpartList.map(async (sp) => {
                const assignment = new QuranAssignment({
                    studentId: childId,
                    scholarId,
                    juz,
                    subpart: sp,
                    dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                });
                await assignment.save();
                return assignment;
            })
        );
        res.status(201).json({ message: "Assignments created successfully", assignments });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get active assignment for a child.
 */
export const getActiveAssignment = async (req, res) => {
    try {
        const { childId } = req.params;
        const assignment = await QuranAssignment.findOne({ studentId: childId, status: { $ne: 'completed' } })
            .sort({ createdAt: -1 });

        if (!assignment) return res.status(200).json(null);

        // Fetch questions for this assignment
        const questions = await QuranQuestion.find({ juz: assignment.juz, subpart: assignment.subpart });

        res.status(200).json({ assignment, questions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Update assignment progress (e.g. after Q&A).
 */
export const updateProgress = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { score, totalQuestions, userId } = req.body;

        const assignment = await QuranAssignment.findById(assignmentId);
        if (!assignment) return res.status(404).json({ message: "Assignment not found" });

        // Update assignment stats
        assignment.practiceScore = score;
        assignment.practiceCount = (assignment.practiceCount || 0) + 1;
        
        if (score >= 80) {
            assignment.status = 'practicing';
        }

        // Calculate XP: max 5 XP based on accuracy
        const { awardXP } = await import("../services/gamificationService.js");
        const accuracy = score / 100;
        const xpToAward = accuracy >= 0.8 ? 5 : accuracy >= 0.5 ? 3 : accuracy >= 0.3 ? 2 : 1;

        const xpResult = await awardXP(assignment.studentId, "participation", { points: xpToAward });

        await assignment.save();
        res.status(200).json({ assignment, xpResult });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Record revision completion and award XP.
 */
export const completeRevision = async (req, res) => {
    try {
        const { assignmentId } = req.params;

        const assignment = await QuranAssignment.findById(assignmentId);
        if (!assignment) return res.status(404).json({ message: "Assignment not found" });

        // Increment revision count
        assignment.revisionCount = (assignment.revisionCount || 0) + 1;
        
        // Award Gamification XP for Revision (1 XP per completion)
        const { awardXP } = await import("../services/gamificationService.js");
        const xpToAward = 1;
        const xpResult = await awardXP(assignment.studentId, "participation", { points: xpToAward });

        await assignment.save();
        res.status(200).json({ 
            message: `Revision #${assignment.revisionCount} completed`, 
            revisionCount: assignment.revisionCount,
            xpResult 
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Scholar marks assignment as completed (after live recital).
 */
export const markCompleted = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const assignment = await QuranAssignment.findById(assignmentId);
        if (!assignment) return res.status(404).json({ message: "Assignment not found" });

        assignment.status = 'completed';
        assignment.completedAt = new Date();
        await assignment.save();
        res.status(200).json(assignment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Assign a subpart to all students in a batch.
 */
export const batchCreateAssignments = async (req, res) => {
    try {
        const { batchId, juz, subpart, subparts, dueDate } = req.body;
        const scholarId = req.user?._id;

        if (!scholarId) {
            return res.status(401).json({ message: "Scholar ID not found in request" });
        }

        const { default: Batch } = await import("../models/Batch.js");
        const batch = await Batch.findById(batchId);
        if (!batch) return res.status(404).json({ message: "Batch not found" });

        // Determine subparts list
        const subpartList = Array.isArray(subparts) ? subparts : (subpart !== undefined ? [subpart] : []);
        if (subpartList.length === 0) {
            return res.status(400).json({ message: "No subpart(s) provided" });
        }
        
        // Verify all subparts exist for the given Juz
        const juzDoc = await JuzSubpart.findOne({ juz });
        if (!juzDoc) {
            return res.status(404).json({ message: `Juz ${juz} metadata not found` });
        }
        const availableParts = juzDoc.parts.map(p => p.partNum);
        const missing = subpartList.filter(sp => !availableParts.includes(sp));

        if (missing.length) {
            return res.status(404).json({ message: `Subpart(s) not found for Juz ${juz}: ${missing.join(', ')}` });
        }
        
        const calculatedDueDate = dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        // Create assignments for each child and each subpart
        const assignments = [];
        for (const childId of batch.students) {
            for (const sp of subpartList) {
                const assign = await QuranAssignment.findOneAndUpdate(
                    { studentId: childId, scholarId, juz, subpart: sp },
                    {
                        status: 'assigned',
                        dueDate: calculatedDueDate,
                        practiceScore: 0,
                        completedAt: null
                    },
                    { upsert: true, new: true }
                );
                assignments.push(assign);
            }
        }
        res.status(201).json({
            message: `Successfully assigned Juz ${juz} Part(s) ${subpartList.join(', ')} to ${batch.students.length} students`,
            assignments
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * Get Quranic text for revision.
 */
export const getRevisionText = async (req, res) => {
    try {
        const { juz, subpart } = req.params;
        const { getJuzText } = await import("../services/QuranQuestionService.js");
        const data = await getJuzText(parseInt(juz), parseInt(subpart));
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
