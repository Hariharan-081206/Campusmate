require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./db");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_, res) => res.json({ ok: true }));
app.use("/auth", require("./routes/auth"));
app.use("/timetable", require("./routes/timetable"));
app.use("/assignments", require("./routes/assignment"));
app.use("/exams", require("./routes/exam"));
app.use("/notes", require("./routes/note"));
app.use("/streak", require("./routes/streak"));

// Express 5 forwards rejected async handlers here; without this the app would
// reply with an HTML stack trace that the RN client can't parse.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ msg: err.message || "Server error" });
});

// Boolean only — never log the key itself.
console.log("GEMINI_API_KEY loaded:", !!process.env.GEMINI_API_KEY);

const PORT = process.env.PORT || 5000;
connectDB().then(() =>
  // 0.0.0.0 so the emulator (via 10.0.2.2) can reach it
  app.listen(PORT, "0.0.0.0", () => console.log(`API on :${PORT}`))
);
