const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "Untitled note", trim: true },
    // One of SUBJECTS in the app (src/constants.ts) — drives the Notes filter chips
    subject: { type: String, default: "", trim: true },
    rawText: { type: String, required: true }, // OCR output from the phone
    summary: { type: String, default: "" }, // Gemini revision points
  },
  { timestamps: true } // createdAt drives the "-createdAt" sort
);

module.exports = mongoose.model("Note", noteSchema);
