import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
       serverSelectionTimeoutMS: 5000,
       socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    mongoose.connection.on('disconnected', () => {
      console.warn("⚠️ MongoDB Disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on('reconnected', () => {
      console.log("✅ MongoDB Reconnected");
    });

    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB Error: ${err.message}`);
    });

  } catch (error) {
    console.error(`❌ Initial MongoDB Connection Failed: ${error.message}`);
    // Only exit on initial failure if it's not a transient error
    // Render will restart the service anyway
    process.exit(1);
  }
};

export default connectDB;
