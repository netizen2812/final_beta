require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
    await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    
    const db = mongoose.connection.db;
    const batch = await db.collection('batches').findOne({ "pastSessions.attendedChildren": { $exists: true, $not: {$size: 0} } });
    
    if (batch) {
        console.log("SUCCESS! Found a batch with populated attendedChildren:", batch.name);
        console.log(JSON.stringify(batch.pastSessions, null, 2));
    } else {
        console.log("No batches found with populated attendedChildren.");
        
        // Let's just look at any batch that has pastSessions
        const anyBatch = await db.collection('batches').findOne({ "pastSessions": { $exists: true } });
        if (anyBatch) {
             console.log("Found a batch with past sessions but no attendedChildren:");
             console.log(JSON.stringify(anyBatch.pastSessions, null, 2));
        } else {
             console.log("No batches found with pastSessions at all.");
        }
    }
    process.exit(0);
}
run();
