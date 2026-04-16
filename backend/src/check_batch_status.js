import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const db = mongoose.connection.db;
    
    const batches = await db.collection('batches').find({ name: /Tarbiyah Batch 1/i }).toArray();
    console.log("Batches:", JSON.stringify(batches, null, 2));
    
    if (batches.length > 0) {
      const scholarIds = batches.map(b => b.scholar).filter(id => id);
      const scholars = await db.collection('users').find({ _id: { $in: scholarIds } }).toArray();
      console.log("Scholars:", JSON.stringify(scholars, null, 2));
      
      const scholarByEmail = await db.collection('users').find({ email: /Masood/i }).toArray();
      console.log("Scholars by Name (Masood):", JSON.stringify(scholarByEmail, null, 2));
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
