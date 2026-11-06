const mongoose = require("mongoose");

const timetableSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: String, required: true, trim: true },
    day: { type: String, required: true }, // "Mon" … "Sun"
    startTime: { type: String, required: true }, // "09:00" — 24h so it sorts as a string
    endTime: { type: String },
    room: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Timetable", timetableSchema);
