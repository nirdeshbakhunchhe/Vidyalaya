import express from 'express';
import asyncHandler from 'express-async-handler';
import Progress from '../models/progressModel.js';
import Assignment from '../models/assignment.model.js';
import Submission from '../models/submission.model.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const toLocalDateKey = (d) => {
  const date = new Date(d);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10); // YYYY-MM-DD
};

const startOfLocalDay = (d) => {
  const dt = new Date(d);
  return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
};

const sumWatchTimeFromProgresses = (progresses) => {
  let total = 0;
  for (const p of progresses) {
    const logs = p.watchTimeLogs || [];
    for (const l of logs) total += Number(l.timeSpent) || 0;
  }
  return total;
};

const safePct = (earned, total) => {
  const a = Number(earned);
  const b = Number(total);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0) return 0;
  return clamp((a / b) * 100, 0, 100);
};

const formatRange10 = (finalScore) => {
  const score = clamp(Number(finalScore) || 0, 0, 100);
  const lower = clamp(score - 5, 0, 100);
  const upper = clamp(score + 5, 0, 100);
  // Always return as "XX% - XX%" (no letter grades).
  return `${Math.round(lower)}% - ${Math.round(upper)}%`;
};

// GET /api/analytics/summary
// Returns total study time, daily (last 7 days), and weekly comparison.
router.get(
  '/summary',
  protect,
  asyncHandler(async (req, res) => {
    const now = new Date();
    const todayStart = startOfLocalDay(now);

    const windowDays = Number(req.query.days) > 0 ? Number(req.query.days) : 30;
    const from = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);

    const progresses = await Progress.find({ user: req.user._id })
      .select('watchTimeLogs isCompleted completionPercentage updatedAt');

    const totalStudyTimeSeconds = sumWatchTimeFromProgresses(progresses);

    // Daily study time: last 7 days (seconds)
    const dailyMap = new Map();
    for (let i = 6; i >= 0; i--) {
      const day = new Date(todayStart.getTime() - i * 86400000);
      dailyMap.set(toLocalDateKey(day), 0);
    }
    for (const p of progresses) {
      for (const l of p.watchTimeLogs || []) {
        if (dailyMap.has(l.date)) {
          dailyMap.set(l.date, (dailyMap.get(l.date) || 0) + (Number(l.timeSpent) || 0));
        }
      }
    }
    const dailyStudySeconds = Array.from(dailyMap.entries()).map(([date, seconds]) => ({
      date,
      seconds,
    }));

    // Weekly comparison (this week vs last week) in seconds
    // Week starts on Monday (local)
    const day = todayStart.getDay(); // 0 Sun ... 6 Sat
    const mondayOffset = (day + 6) % 7;
    const thisWeekStart = new Date(todayStart.getTime() - mondayOffset * 86400000);
    const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 86400000);
    const lastWeekEnd = new Date(thisWeekStart.getTime() - 1); // end of day before this week

    let thisWeekSeconds = 0;
    let lastWeekSeconds = 0;

    for (const p of progresses) {
      for (const l of p.watchTimeLogs || []) {
        const d = startOfLocalDay(new Date(l.date));
        const sec = Number(l.timeSpent) || 0;
        if (d >= thisWeekStart && d <= todayStart) thisWeekSeconds += sec;
        else if (d >= lastWeekStart && d.getTime() <= lastWeekEnd.getTime()) lastWeekSeconds += sec;
      }
    }

    // -------------------------------------------------------------------------
    // Grade prediction (range output)
    // Uses existing auto data sources:
    // - Previous Grade: average of all graded submissions (quiz + project)
    // - Quiz Average: average of graded quiz submissions
    // - Screen Time: this week watch time
    // - Assignment: latest project submission approval (graded) + late submission
    // -------------------------------------------------------------------------
    const submissions = await Submission.find({ student: req.user._id })
      .select('assignment status score submittedAt')
      .sort({ submittedAt: -1 })
      .lean();

    const assignmentIds = Array.from(new Set(submissions.map((s) => String(s.assignment)).filter(Boolean)));
    const assignments = assignmentIds.length
      ? await Assignment.find({ _id: { $in: assignmentIds } })
          .select('_id type points dueAt')
          .lean()
      : [];
    const assignmentById = new Map(assignments.map((a) => [String(a._id), a]));

    const graded = [];
    const gradedQuizzes = [];
    let latestProject = null;

    for (const s of submissions) {
      const a = assignmentById.get(String(s.assignment));
      if (!a) continue;

      const pct = safePct(s.score, a.points);
      if (s.status === 'graded') graded.push(pct);
      if (a.type === 'quiz' && s.status === 'graded') gradedQuizzes.push(pct);
      if (a.type === 'project' && !latestProject) latestProject = { submission: s, assignment: a };
    }

    const previousGrade =
      graded.length > 0 ? graded.reduce((sum, v) => sum + v, 0) / graded.length : 70;
    const quizAverage =
      gradedQuizzes.length > 0 ? gradedQuizzes.reduce((sum, v) => sum + v, 0) / gradedQuizzes.length : previousGrade;

    // Screen time score: optimal range is ~2h to 10h per week.
    const thisWeekHours = thisWeekSeconds / 3600;
    const screenTimeOutsideOptimal = thisWeekHours < 2 || thisWeekHours > 10;

    // Base formula (kept simple; penalties applied below as requested)
    let finalScore = 0.6 * previousGrade + 0.4 * quizAverage;

    // Penalties (applied BEFORE range calculation)
    // - Assignment NOT approved (project not graded): significant penalty
    // - Late submission (submitted after dueAt): moderate penalty
    // - Screen time outside optimal: slight penalty
    const assignmentApproved = latestProject?.submission?.status === 'graded';
    if (!assignmentApproved) finalScore -= 15;

    const dueAt = latestProject?.assignment?.dueAt ? new Date(latestProject.assignment.dueAt).getTime() : null;
    const submittedAt = latestProject?.submission?.submittedAt ? new Date(latestProject.submission.submittedAt).getTime() : null;
    const isLate = dueAt && submittedAt && submittedAt > dueAt;
    if (isLate) finalScore -= 7;

    if (screenTimeOutsideOptimal) finalScore -= 3;

    finalScore = clamp(finalScore, 0, 100);

    res.json({
      success: true,
      summary: {
        windowDays,
        totalStudyTimeSeconds,
        dailyStudySeconds,
        weeklyComparison: {
          thisWeekSeconds,
          lastWeekSeconds,
        },
        gradePrediction: {
          finalScore: Math.round(finalScore),
          range: formatRange10(finalScore),
          inputs: {
            previousGrade: Math.round(previousGrade),
            quizAverage: Math.round(quizAverage),
            thisWeekScreenTimeSeconds: Math.round(thisWeekSeconds),
            assignmentApproved: !!assignmentApproved,
            lateSubmission: !!isLate,
            screenTimeOutsideOptimal: !!screenTimeOutsideOptimal,
          },
        },
      },
    });
  })
);

export default router;

