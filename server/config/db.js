const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/codebase-chat";
    console.log(uri)
    await mongoose.connect(uri);

    console.log("✅ MongoDB Connected Successfully!");
  } catch (err) {
    console.error("❌ Connection Failed:", err.message);
    process.exit(1); // exit if DB fails
  }
};

module.exports = connectDB;