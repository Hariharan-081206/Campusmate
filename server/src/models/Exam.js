const mongoose = require("mongoose");

const examSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: String, required: true, trim: true },
    // "Internal 2" — rendered above the subject on the exam hero card
    examName: { type: String, default: "Internal 2", trim: true },
    date: { type: Date, required: true },
    startTime: { type: String }, // "09:00"
    room: { type: String },
    syllabus: { type: String },
    // The "REVISE THESE" checklist on the exam screen
    topics: [
      {
        title: { type: String, required: true, trim: true },
        done: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Exam", examSchema);
