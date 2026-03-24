import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
   .then(async () => {
       const Batch = mongoose.model("Batch", new mongoose.Schema({}, { strict: false, collection: 'batches' }));
       const b = await Batch.findById("699786283fddf2345971a2aa");
       console.log(JSON.stringify(b, null, 2));
       process.exit(0);
   })
   .catch(console.error);
