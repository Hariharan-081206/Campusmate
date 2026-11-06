const mongoose = require("mongoose");

module.exports = async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI missing — check server/.env");
  await mongoose.connect(uri);
  console.log("MongoDB connected");
};
