const Assignment = require("../models/Assignment");

exports.list = async (req, res) => {
  const items = await Assignment.find({ user: req.userId }).sort("dueDate");
  res.json(items);
};
exports.create = async (req, res) => {
  // user/_id come from the token and the database, never the body.
  const { user, _id, ...fields } = req.body ?? {};
  const item = await Assignment.create({ ...fields, user: req.userId });
  res.status(201).json(item);
};
exports.update = async (req, res) => {
  const { user, _id, ...fields } = req.body ?? {};
  const item = await Assignment.findOneAndUpdate(
    { _id: req.params.id, user: req.userId }, fields, { new: true });
  res.json(item);
};
exports.remove = async (req, res) => {
  await Assignment.deleteOne({ _id: req.params.id, user: req.userId });
  res.json({ ok: true });
};
