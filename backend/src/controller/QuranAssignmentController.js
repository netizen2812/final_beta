import QuranAssignment from "../models/QuranAssignment.js";
import JuzSubpart from "../models/JuzSubpart.js";
import QuranQuestion from "../models/QuranQuestion.js";

/**
 * Assign a subpart to a student (child).
 */
export const createAssignment = async (req, res) => {
    try {
        const { childId, juz, subpart, dueDate } = req.body;

        // Verify subpart exists
        const subpartMeta = await JuzSubpart.findOne({ juz, subpart });
        if (!subpartMeta) return res.status(404).json({ message: "Juz Subpart metadata not found" });

        const assignment = new QuranAssignment({
            childId,
            juz,
            subpart,
            dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 1 week
        });

        await assignment.save();
        res.status(201).json({ message: "Assignment created successfully", assignment });
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
        const assignment = await QuranAssignment.findOne({ childId, status: { $ne: 'Completed' } })
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
        const { score, questionsAnswered } = req.body;

        const assignment = await QuranAssignment.findById(assignmentId);
        if (!assignment) return res.status(404).json({ message: "Assignment not found" });

        assignment.practiceScore = score;
        assignment.questionsAnswered = (assignment.questionsAnswered || 0) + (questionsAnswered || 0);
        
        // Simple heuristic: if score is high and they answered enough, mark as 'Practiced'
        if (score >= 80) {
            assignment.status = 'Practiced';
        }

        await assignment.save();
        res.status(200).json(assignment);
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

        assignment.status = 'Completed';
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
        const { batchId, juz, subpart, dueDate } = req.body;
        const { default: Batch } = await import("../models/Batch.js");

        const batch = await Batch.findById(batchId);
        if (!batch) return res.status(404).json({ message: "Batch not found" });

        const calculatedDueDate = dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const assignments = await Promise.all(batch.students.map(async (childId) => {
            return await QuranAssignment.findOneAndUpdate(
                { childId, juz, subpart },
                { 
                    status: 'assigned', 
                    dueDate: calculatedDueDate,
                    practiceScore: 0,
                    completedAt: null 
                },
                { upsert: true, new: true }
            );
        }));

        res.status(201).json({ 
            message: `Successfully assigned Juz ${juz} Part ${subpart} to ${assignments.length} students`, 
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
