import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function forceStart() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    // CORRECTED ID for Tarbiyah Batch 1
    const batchId = new mongoose.Types.ObjectId('69e04a358536a2aab762af1f');
    const mdMasoodId = new mongoose.Types.ObjectId('69988fda4a73c2e56f8603e9');
    
    console.log("Found Batch. Creating forcing session...");
    
    // 1. Create a session record
    const sessResult = await db.collection('sessions').insertOne({
        batchId: batchId,
        scholarId: mdMasoodId,
        status: 'live',
        scheduledAt: new Date(),
        startTime: new Date(),
        attendance: [],
        createdAt: new Date(),
        updatedAt: new Date()
    });
    
    const sessionId = sessResult.insertedId;
    console.log("Session Created:", sessionId);
    
    // 2. Update the batch record
    const updateResult = await db.collection('batches').updateOne(
      { _id: batchId },
      { 
        $set: { 
          status: 'active',
          activeSessionId: sessionId.toString(),
          activeChildId: null,
          promptEvaluated: false,
          currentPromptAnswers: [],
          activeParticipants: [],
          updatedAt: new Date()
        },
        $push: {
          pastSessions: {
            sessionId: sessionId.toString(),
            startedAt: new Date(),
            endedAt: null,
            attendedChildren: []
          }
        }
      }
    );
    
    console.log("Batch Forced Active. Update result:", updateResult);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

forceStart();
