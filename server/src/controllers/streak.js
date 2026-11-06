const User = require("../models/User");
const today = () => new Date().toISOString().slice(0, 10);
const yesterday = () => new Date(Date.now() - 864e5).toISOString().slice(0, 10);

/**
 * A valid token can outlive its user — `npm run seed` recreates the demo
 * account under a new _id. 401 sends the app back to login (see src/api.ts).
 */
const gone = (res) => res.status(401).json({ msg: "Account not found — please log in again" });

exports.ping = async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return gone(res);
  const t = today();
  if (user.lastActiveDate === t) {
    // already counted today, no change
  } else if (user.lastActiveDate === yesterday()) {
    user.streakCount += 1;
  } else {
    user.streakCount = 1;
  }
  // studyDays counts distinct days studied, so only bump on a new day.
  if (user.lastActiveDate !== t) user.stats.studyDays += 1;
  user.lastActiveDate = t;
  await user.save();
  res.json({ streakCount: user.streakCount, lastActiveDate: user.lastActiveDate });
};

exports.status = async (req, res) => {
  const user = await User.findById(req.userId)
    .populate("friends", "name streakCount subtitle");
  if (!user) return gone(res);
  // streakCount is only rewritten by a ping, so a streak that lapsed days ago
  // is still stored at its old value. Anything older than yesterday is broken.
  const alive = [today(), yesterday()].includes(user.lastActiveDate);
  res.json({
    streakCount: alive ? user.streakCount : 0,
    lastActiveDate: user.lastActiveDate,
    stats: user.stats, // the three Profile stat tiles
    friends: user.friends, // friend streaks for the leaderboard
  });
};
