const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const sign = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  roll: user.roll,
  dept: user.dept,
  streakCount: user.streakCount,
  stats: user.stats,
});

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ msg: "name, email and password required" });
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ msg: "Email already registered" });

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: await bcrypt.hash(password, 10),
  });
  res.status(201).json({ token: sign(user), user: publicUser(user) });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || "").toLowerCase() });
  if (!user) return res.status(401).json({ msg: "Invalid credentials" });

  const ok = await bcrypt.compare(password || "", user.password);
  if (!ok) return res.status(401).json({ msg: "Invalid credentials" });

  res.json({ token: sign(user), user: publicUser(user) });
};
