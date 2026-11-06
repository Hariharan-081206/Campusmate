const Timetable = require("../models/Timetable");

exports.list = async (req, res) => {
  const items = await Timetable.find({ user: req.userId }).sort("startTime");
  res.json(items);
};
exports.create = async (req, res) => {
  // user/_id come from the token and the database, never the body.
  const { user, _id, ...fields } = req.body ?? {};
  const item = await Timetable.create({ ...fields, user: req.userId });
  res.status(201).json(item);
};
exports.update = async (req, res) => {
  const { user, _id, ...fields } = req.body ?? {};
  const item = await Timetable.findOneAndUpdate(
    { _id: req.params.id, user: req.userId }, fields, { new: true });
  res.json(item);
};
exports.remove = async (req, res) => {
  await Timetable.deleteOne({ _id: req.params.id, user: req.userId });
  res.json({ ok: true });
};
