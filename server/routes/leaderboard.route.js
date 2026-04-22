import express from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Progress from '../models/progressModel.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const sumProgressWatchTimeSeconds = (p) => {
  let total = 0;
  for (const l of p.watchTimeLogs || []) total += Number(l.timeSpent) || 0;
  return total;
};

// GET /api/leaderboard
// Returns students sorted by:
// - courses completed (primary)
// - total watch time (secondary)
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const limit = Math.min(100, Math.max(5, Number(req.query.limit) || 20));

    const students = await User.find({ role: 'student' }).select('name');
    const studentIds = students.map((s) => s._id);

    const progresses = await Progress.find({ user: { $in: studentIds } }).select(
      'user isCompleted completionPercentage watchTimeLogs'
    );

    const byUser = new Map();
    for (const s of students) {
      byUser.set(String(s._id), {
        userId: s._id,
        name: s.name,
        coursesCompleted: 0,
        totalStudyTimeSeconds: 0,
      });
    }

    for (const p of progresses) {
      const key = String(p.user);
      const row = byUser.get(key);
      if (!row) continue;
      if (p.isCompleted || Number(p.completionPercentage) === 100) row.coursesCompleted += 1;
      row.totalStudyTimeSeconds += sumProgressWatchTimeSeconds(p);
    }

    const leaderboard = Array.from(byUser.values())
      .sort((a, b) => {
        if (b.coursesCompleted !== a.coursesCompleted) return b.coursesCompleted - a.coursesCompleted;
        return b.totalStudyTimeSeconds - a.totalStudyTimeSeconds;
      })
      .slice(0, limit)
      .map((row, idx) => ({ rank: idx + 1, ...row }));

    res.json({ success: true, leaderboard });
  })
);

export default router;

