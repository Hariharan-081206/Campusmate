const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    subject: { type: String, trim: true },
    dueDate: { type: Date, required: true },
    completed: { type: Boolean, default: false },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
