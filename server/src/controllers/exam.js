const Exam = require("../models/Exam");

/**
 * The add-exam form has no topic editor, so the syllabus is the checklist:
 * "Units 3-4: normalization, transactions" → ["Normalization", "Transactions"].
 */
const topicsFrom = (syllabus = "") =>
  syllabus
    .slice(syllabus.indexOf(":") + 1)
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((title) => ({ title: title[0].toUpperCase() + title.slice(1), done: false }));

exports.list = async (req, res) => {
  const items = await Exam.find({ user: req.userId }).sort("date");
  res.json(items);
};
exports.create = async (req, res) => {
  // user/_id come from the token and the database, never the body.
  const { user, _id, ...fields } = req.body ?? {};
  if (!fields.topics?.length && fields.syllabus) fields.topics = topicsFrom(fields.syllabus);
  const item = await Exam.create({ ...fields, user: req.userId });
  res.status(201).json(item);
};
exports.update = async (req, res) => {
  const { user, _id, ...fields } = req.body ?? {};
  const item = await Exam.findOneAndUpdate(
    { _id: req.params.id, user: req.userId }, fields, { new: true });
  res.json(item);
};
exports.remove = async (req, res) => {
  await Exam.deleteOne({ _id: req.params.id, user: req.userId });
  res.json({ ok: true });
};
