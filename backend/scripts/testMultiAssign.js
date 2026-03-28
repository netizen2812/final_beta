import mongoose from "mongoose";
import dotenv from "dotenv";
import { createAssignment } from "../src/controller/QuranAssignmentController.js";
import JuzSubpart from "../src/models/JuzSubpart.js";
import QuranAssignment from "../src/models/QuranAssignment.js";

dotenv.config({ path: "./.env" });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/imam";

const testMultiAssign = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB for verification...");

        // Ensure we have a Juz 1 with some parts
        let juz1 = await JuzSubpart.findOne({ juz: 1 });
        if (!juz1) {
            console.log("Creating mock Juz 1 metadata...");
            juz1 = new JuzSubpart({
                juz: 1,
                parts: [
                    { partNum: 1, description: "Part 1" },
                    { partNum: 2, description: "Part 2" },
                    { partNum: 3, description: "Part 3" }
                ]
            });
            await juz1.save();
        }

        const mockRes = {
            status: function(code) {
                this.statusCode = code;
                return this;
            },
            json: function(data) {
                this.data = data;
                return this;
            }
        };

        const mockScholarId = new mongoose.Types.ObjectId();
        const mockStudentId = new mongoose.Types.ObjectId();

        const mockReq = {
            user: { _id: mockScholarId },
            body: {
                childId: mockStudentId,
                juz: 1,
                subparts: [1, 2],
                dueDate: new Date()
            }
        };

        console.log("Testing multi-assignment [1, 2] for Juz 1...");
        await createAssignment(mockReq, mockRes);

        if (mockRes.statusCode === 201) {
            console.log("SUCCESS: Response code 201");
            console.log("Message:", mockRes.data.message);
            console.log("Assignments created:", mockRes.data.assignments.length);
            
            const count = await QuranAssignment.countDocuments({ 
                studentId: mockStudentId, 
                scholarId: mockScholarId,
                juz: 1, 
                subpart: { $in: [1, 2] } 
            });
            console.log(`Database check: Found ${count} assignments in DB.`);
            
            if (count === 2) {
                console.log("VERIFICATION PASSED!");
            } else {
                console.log("VERIFICATION FAILED: DB count mismatch.");
            }
        } else {
            console.log("FAILED: Response code", mockRes.statusCode);
            console.log("Error:", mockRes.data.message);
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
};

testMultiAssign();
