import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function fix() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    // Correct scholar for Tarbiyah Batch 1
    const mdMasoodId = new mongoose.Types.ObjectId('69988fda4a73c2e56f8603e9');
    
    const result = await db.collection('batches').updateOne(
      { name: /Tarbiyah Batch 1/i },
      { 
        $set: { 
          scholar: mdMasoodId,
          status: 'upcoming', 
          activeSessionId: null 
        } 
      }
    );
    
    console.log("Update Result:", result);
    
    // Check if any orphans exist in sessions that need cleaning
    const orphans = await db.collection('sessions').deleteMany({
      batchId: new mongoose.Types.ObjectId('69ed4a3628ef45277838634c'),
      status: 'live' 
    });
    console.log("Deleted orphan sessions:", orphans.deletedCount);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fix();
