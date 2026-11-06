const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    // Shown on the Profile card: "24CS0081 · CSE · CIT"
    roll: { type: String, default: "", trim: true },
    dept: { type: String, default: "", trim: true },
    // Friend rows render this under the name ("Studied together today")
    subtitle: { type: String, default: "", trim: true },
    streakCount: { type: Number, default: 0 },
    // Profile stat tiles. Bumped by the note/streak controllers.
    stats: {
      notesScanned: { type: Number, default: 0 },
      aiSummaries: { type: Number, default: 0 },
      studyDays: { type: Number, default: 0 },
    },
    // "YYYY-MM-DD" — the streak controller compares this as a plain string
    lastActiveDate: { type: String, default: null },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
