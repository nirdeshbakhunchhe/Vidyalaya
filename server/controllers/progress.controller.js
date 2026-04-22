import asyncHandler from 'express-async-handler';
import Progress from '../models/progressModel.js';
import Course from '../models/courseModel.js';
import User from '../models/User.js';

/** Prefer video count (actual playable lessons); otherwise curriculum lesson rows. */
const totalPlayableLessons = (course) => {
  const vLen = course?.videos?.length ?? 0;
  if (vLen > 0) return vLen;
  if (!Array.isArray(course?.curriculum)) return 0;
  return course.curriculum.reduce((acc, sec) => acc + (sec.lessons?.length ?? 0), 0);
};

// @desc    Get progress for all enrolled courses
// @route   GET /api/progress
// @access  Private (Student)
export const getAllProgress = asyncHandler(async (req, res) => {
  const progresses = await Progress.find({ user: req.user._id }).populate('course', 'title image category color instructor videos curriculum');
  
  const updatedProgresses = progresses.map(p => {
    const pObj = p.toObject();
    const course = pObj.course;
    if (course) {
      const totalLessons = totalPlayableLessons(course);
      let percentage =
        totalLessons > 0
          ? Math.round(((pObj.completedLessons?.length || 0) / totalLessons) * 100)
          : 0;
      if (percentage > 100) percentage = 100;
      
      pObj.completionPercentage = percentage;
      if (percentage < 100) pObj.isCompleted = false;
      else if (percentage === 100) pObj.isCompleted = true;

      // Strip to keep payload small
      delete pObj.course.videos;
      delete pObj.course.curriculum;
    }
    return pObj;
  });

  res.json({ success: true, progresses: updatedProgresses });
});

// @desc    Get progress for a specific course
// @route   GET /api/progress/:courseId
// @access  Private
export const getCourseProgress = asyncHandler(async (req, res) => {
  let progress = await Progress.findOne({
    user: req.user._id,
    course: req.params.courseId
  }).populate('course', 'videos curriculum');

  if (!progress) {
    // Return empty progress if none exists yet
    return res.json({ success: true, progress: { completionPercentage: 0, completedLessons: [] } });
  }

  const pObj = progress.toObject();
  const course = pObj.course;
  if (course) {
    const totalLessons = totalPlayableLessons(course);
    let percentage =
      totalLessons > 0
        ? Math.round(((pObj.completedLessons?.length || 0) / totalLessons) * 100)
        : 0;
    if (percentage > 100) percentage = 100;
    
    pObj.completionPercentage = percentage;
    if (percentage < 100) pObj.isCompleted = false;
    else if (percentage === 100) pObj.isCompleted = true;
    
    delete pObj.course;
  }

  res.json({ success: true, progress: pObj });
});

// @desc    Mark lesson as complete
// @route   POST /api/progress/:courseId/mark-complete
// @access  Private
export const markLessonComplete = asyncHandler(async (req, res) => {
  const { lessonTitle } = req.body;
  if (!lessonTitle) {
    return res.status(400).json({ success: false, message: 'lessonTitle is required' });
  }

  const course = await Course.findById(req.params.courseId);
  if (!course) {
    return res.status(404).json({ success: false, message: 'Course not found' });
  }

  const totalLessons = totalPlayableLessons(course);

  let progress = await Progress.findOne({
    user: req.user._id,
    course: req.params.courseId
  });

  if (!progress) {
    progress = new Progress({
      user: req.user._id,
      course: req.params.courseId,
      completedLessons: [],
      completionPercentage: 0,
      isCompleted: false
    });
  }

  // Check if lesson is already marked complete
  const alreadyCompleted = progress.completedLessons.find(l => l.lessonTitle === lessonTitle);
  if (!alreadyCompleted) {
    progress.completedLessons.push({ lessonTitle });
    progress.lastAccessed = new Date();
    
    // Calculate new percentage
    let percentage =
      totalLessons > 0 ? Math.round((progress.completedLessons.length / totalLessons) * 100) : 0;
    if (percentage > 100) percentage = 100;
    
    progress.completionPercentage = percentage;
    if (percentage === 100) {
      progress.isCompleted = true;
    }
    
    await progress.save();

    // If completed 100%, award badge
    if (percentage === 100) {
      const user = await User.findById(req.user._id);
      if (!user.badges.find(b => b.name === 'Course Completer')) {
        user.badges.push({ badgeType: 'achievement', name: 'Course Completer', icon: '🏆' });
        await user.save();
      }
    }
  }

  res.json({ success: true, progress });
});

// @desc    Add watch time to a course
// @route   POST /api/progress/:courseId/time
// @access  Private
export const addWatchTime = asyncHandler(async (req, res) => {
  const rawTimeSpent = req.body?.timeSpent;
  const timeSpent = Number(rawTimeSpent);

  if (!Number.isFinite(timeSpent) || timeSpent <= 0) {
    return res.status(400).json({
      success: false,
      message: 'timeSpent (number in seconds) must be a positive number',
    });
  }

  const courseId = req.params.courseId;
  const userId = req.user._id;
  const debug = process.env.WATCHTIME_DEBUG === 'true';
  if (debug) {
    console.log('[watchtime] incoming', {
      userId: String(userId),
      courseId: String(courseId),
      timeSpent,
    });
  }

  let progress = await Progress.findOne({ user: userId, course: courseId });
  if (!progress) {
    progress = new Progress({
      user: userId,
      course: courseId,
      completedLessons: [],
      completionPercentage: 0,
      isCompleted: false,
    });
  }

  if (!Array.isArray(progress.watchTimeLogs)) {
    progress.watchTimeLogs = [];
  }

  // Get current date string (YYYY-MM-DD) based on local time
  const todayDate = new Date();
  const todayObject = new Date(todayDate.getTime() - todayDate.getTimezoneOffset() * 60000);
  const today = todayObject.toISOString().split('T')[0];

  const logIndex = progress.watchTimeLogs.findIndex((log) => log.date === today);
  if (logIndex > -1) {
    progress.watchTimeLogs[logIndex].timeSpent += timeSpent;
  } else {
    progress.watchTimeLogs.push({ date: today, timeSpent: timeSpent });
  }

  progress.lastAccessed = new Date();
  await progress.save();

  if (debug) {
    const todayLog = (progress.watchTimeLogs || []).find((l) => l.date === today);
    console.log('[watchtime] saved', {
      userId: String(userId),
      courseId: String(courseId),
      today,
      todaySeconds: Number(todayLog?.timeSpent) || 0,
      totalDays: Array.isArray(progress.watchTimeLogs) ? progress.watchTimeLogs.length : 0,
    });
  }

  res.json({ success: true, progress });
});
