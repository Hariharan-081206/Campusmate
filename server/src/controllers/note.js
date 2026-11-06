const Note = require("../models/Note");
const User = require("../models/User");

/**
 * Tried in order. gemini-2.5-flash was retired for new API keys (404 "no longer
 * available to new users") — that was the original "AI summary doesn't work"
 * bug. The current models answer 503 "experiencing high demand" in bursts, so a
 * single model is not enough for a live demo: an overloaded or missing model
 * moves on to the next one. Override with GEMINI_MODELS=a,b,c in server/.env.
 */
const MODELS = (process.env.GEMINI_MODELS || "gemini-3.6-flash,gemini-3.5-flash,gemini-3.1-flash-lite")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

/** All attempts together stay inside the client's 60s AI_TIMEOUT (src/api.ts). */
const BUDGET_MS = 50000;
const PER_CALL_MS = 25000;

/** Overload, rate-limit, gateway and unknown-model errors are worth another try; a bad key or request is not. */
const RETRYABLE = new Set([404, 429, 500, 502, 503, 504]);

/**
 * Failures normally propagate so the client can show the real reason. Set
 * GEMINI_FALLBACK=1 in server/.env before a live demo to degrade to the raw
 * text instead of erroring.
 */
const FALLBACK = process.env.GEMINI_FALLBACK === "1";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * The app renders the summary as plain text, so Markdown from the model would
 * show up as literal asterisks. The prompt asks for "• " bullets; this catches
 * whatever slips through.
 */
function toPlainBullets(text) {
  return text
    .split("\n")
    .map((line) =>
      line
        .replace(/^\s*#{1,6}\s*/, "")
        .replace(/^(\s*)[*-]\s+/, "$1• ")
        .replace(/\*\*(.+?)\*\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function callGemini(model, prompt, timeoutMs) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const err = new Error(data.error?.message || `Gemini HTTP ${resp.status}`);
    err.retryable = RETRYABLE.has(resp.status);
    throw err;
  }

  const summary = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!summary) throw new Error("Gemini returned no summary text");
  return summary;
}

async function summarizeWithGemini(text) {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY missing — check server/.env");

  const prompt =
    "You are a study assistant. Summarise the following handwritten class " +
    "notes into concise revision points. Reply in plain text, not Markdown: " +
    'one short point per line, each starting with "• ". Keep key definitions ' +
    "and formulas. Notes:\n\n" + text;

  const deadline = Date.now() + BUDGET_MS;
  let lastError = new Error("Gemini did not answer in time");
  // Two passes over the list: a burst of 503s usually clears within seconds.
  for (let pass = 0; pass < 2; pass++) {
    for (const model of MODELS) {
      const remaining = deadline - Date.now();
      if (remaining < 3000) throw lastError;
      try {
        const summary = await callGemini(model, prompt, Math.min(PER_CALL_MS, remaining));
        if (pass > 0 || model !== MODELS[0]) console.log(`[gemini] answered by ${model}`);
        return toPlainBullets(summary);
      } catch (e) {
        console.warn(`[gemini] ${model}: ${e.message}`);
        // Timeouts and network drops carry no flag and are retried; a 400/401/403 would fail on every model.
        if (e.retryable === false) throw e;
        lastError = e.name === "TimeoutError" ? new Error(`Gemini (${model}) timed out`) : e;
      }
    }
    await sleep(1500);
  }
  throw lastError;
}

/** Shared by create and regenerate so both report failures the same way. */
async function summarizeOrFallback(rawText) {
  try {
    return await summarizeWithGemini(rawText);
  } catch (e) {
    console.error("[gemini]", e.message);
    if (FALLBACK) return "AI summary unavailable — showing raw text.\n\n" + rawText;
    throw e; // the JSON error handler turns this into { msg } for the client
  }
}

exports.list = async (req, res) => {
  const notes = await Note.find({ user: req.userId }).sort("-createdAt");
  res.json(notes);
};

exports.get = async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.userId });
  if (!note) return res.status(404).json({ msg: "Note not found" });
  res.json(note);
};

exports.createAndSummarize = async (req, res) => {
  const { title, subject, rawText } = req.body;
  if (!rawText) return res.status(400).json({ msg: "rawText required" });

  const summary = await summarizeOrFallback(rawText);
  const note = await Note.create({
    user: req.userId,
    title: title || "Untitled note",
    subject: subject || "",
    rawText,
    summary,
  });
  await User.updateOne(
    { _id: req.userId },
    { $inc: { "stats.notesScanned": 1, "stats.aiSummaries": 1 } }
  );
  res.status(201).json(note);
};

/** Generate / Regenerate from the note detail screen. */
exports.summarize = async (req, res) => {
  const note = await Note.findOne({ _id: req.params.id, user: req.userId });
  if (!note) return res.status(404).json({ msg: "Note not found" });

  note.summary = await summarizeOrFallback(note.rawText);
  await note.save();
  await User.updateOne({ _id: req.userId }, { $inc: { "stats.aiSummaries": 1 } });
  res.json(note);
};

exports.remove = async (req, res) => {
  await Note.deleteOne({ _id: req.params.id, user: req.userId });
  res.json({ ok: true });
};
