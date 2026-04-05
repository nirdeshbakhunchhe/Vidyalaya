import mongoose from 'mongoose';
import multer from 'multer';
import asyncHandler from 'express-async-handler';
import path from 'path';

import { protect, authorize } from '../middleware/auth.js';
import Assignment from '../models/assignment.model.js';
import Submission from '../models/submission.model.js';
import Enrollment from '../models/enrollmentModel.js';
import Course from '../models/courseModel.js';
import Notification from '../models/notification.model.js';
import { uploadToCloudinary } from '../utils/cloudinaryUpload.js';
import { emitNotification } from '../socket.js';

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

const requireCourseOwnerOrAdmin = async (user, courseId) => {
  const course = await Course.findById(courseId).select('_id createdBy');
  if (!course) return { allowed: false, course: null };
  if (user.role === 'admin') return { allowed: true, course };
  return { allowed: course.createdBy.toString() === user._id.toString(), course };
};

const computeAssignmentUiStatus = ({ assignment, submission }) => {
  const now = Date.now();
  const dueAt = assignment.dueAt ? new Date(assignment.dueAt).getTime() : null;

  if (submission?.status === 'graded') return 'graded';
  if (submission?.status === 'submitted') return 'completed';

  if (dueAt && now > dueAt) return 'overdue';
  return 'pending';
};

// POST /api/assignments
// Teacher/admin creates assignments for their own courses.
export const createAssignment = asyncHandler(async (req, res) => {
  const { courseId, type, title, description, dueAt, duration, points, questions, requirements } =
    req.body || {};

  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only teachers/admin can create assignments' });
  }

  if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ success: false, message: 'courseId is required' });
  }

  const { allowed } = await requireCourseOwnerOrAdmin(req.user, courseId);
  if (!allowed) {
    return res.status(403).json({ success: false, message: 'Not authorized for this course' });
  }

  if (!['quiz', 'project'].includes(type)) {
    return res.status(400).json({ success: false, message: 'type must be "quiz" or "project"' });
  }

  if (!title || !String(title).trim()) {
    return res.status(400).json({ success: false, message: 'title is required' });
  }

  const normalizedPoints = points == null ? 0 : Number(points);
  const assignmentPayload = {
    course: courseId,
    type,
    title: String(title).trim(),
    description: description ? String(description).trim() : '',
    dueAt: dueAt ? new Date(dueAt) : null,
    duration: duration ? String(duration).trim() : '',
    points: Number.isFinite(normalizedPoints) ? Math.max(0, normalizedPoints) : 0,
    questions: type === 'quiz' ? questions || [] : [],
    requirements: type === 'project' ? requirements || [] : [],
    createdBy: req.user._id,
    isPublished: true,
  };

  if (type === 'quiz') {
    // Basic validation for questions.
    if (!Array.isArray(assignmentPayload.questions) || assignmentPayload.questions.length === 0) {
      return res.status(400).json({ success: false, message: 'questions must be a non-empty array for quiz' });
    }
  }

  if (type === 'project') {
    if (!Array.isArray(assignmentPayload.requirements)) assignmentPayload.requirements = [];
  }

  const created = await Assignment.create(assignmentPayload);

  // Notify enrolled students
  const courseDoc = await Course.findById(courseId).select('students title');
  if (courseDoc && courseDoc.students && courseDoc.students.length > 0) {
    const notifsToInsert = courseDoc.students.map(studentId => ({
      userId: studentId,
      message: `New assignment "${created.title}" added to ${courseDoc.title}`,
      type: 'assignment',
      courseId: courseId
    }));
    const docs = await Notification.insertMany(notifsToInsert);
    docs.forEach(notif => emitNotification(notif.userId, notif));
  }

  res.status(201).json({ success: true, assignment: created });
});

// GET /api/assignments (student)
export const getMyAssignments = asyncHandler(async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ success: false, message: 'Students only' });
  }

  const enrollments = await Enrollment.find({
    student: req.user._id,
    status: 'enrolled',
  }).select('course');

  const courseIds = enrollments.map((e) => e.course);

  const assignments = await Assignment.find({
    course: { $in: courseIds },
    isPublished: true,
  })
    .sort({ dueAt: 1 })
    .populate('course', 'title');

  const submissionDocs = await Submission.find(
    { student: req.user._id, assignment: { $in: assignments.map((a) => a._id) } },
    { assignment: 1, status: 1, score: 1, correctCount: 1, totalQuestions: 1, feedback: 1, quizAnswers: 1 }
  );

  const byAssignmentId = new Map();
  submissionDocs.forEach((s) => byAssignmentId.set(String(s.assignment), s));

  const nowIso = new Date().toISOString();
  void nowIso; // keep lint calm in some configs

  const shaped = assignments.map((a) => {
    const submission = byAssignmentId.get(String(a._id));
    const status = computeAssignmentUiStatus({ assignment: a, submission });

    const base = {
      id: a._id,
      title: a.title,
      course: a.course?.title || '',
      courseId: a.course?._id || a.course,
      type: a.type,
      dueDate: a.dueAt,
      duration: a.duration,
      points: a.points,
      description: a.description,
      status,
    };

    if (a.type === 'quiz') {
      base.questions = a.questions || [];
      base.totalQuestions = a.questions?.length || 0;
      base.grade = submission?.status === 'graded' ? submission.score : null;
      base.feedback = submission?.status === 'graded' ? submission.feedback : null;
    } else {
      base.requirements = a.requirements || [];
      base.grade = submission?.status === 'graded' ? submission.score : null;
      base.feedback = submission?.status === 'graded' ? submission.feedback : null;
    }

    return base;
  });

  res.json({ success: true, assignments: shaped });
});

// GET /api/assignments/teacher (teacher)
export const getTeacherAssignments = asyncHandler(async (req, res) => {
  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only teachers/admin can view' });
  }

  const courses = req.user.role === 'teacher' ? await Course.find({ createdBy: req.user._id }).select('_id') : null;
  const courseIds = courses ? courses.map((c) => c._id) : undefined;

  const query = { isPublished: true };
  if (courseIds) query.course = { $in: courseIds };

  const assignments = await Assignment.find(query)
    .sort({ dueAt: 1 })
    .populate('course', 'title');

  res.json({
    success: true,
    assignments: assignments.map((a) => ({
      id: a._id,
      title: a.title,
      course: a.course?.title || '',
      courseId: a.course?._id || a.course,
      type: a.type,
      dueDate: a.dueAt,
      duration: a.duration,
      points: a.points,
      description: a.description,
      questions: a.type === 'quiz' ? a.questions || [] : undefined,
      requirements: a.type === 'project' ? a.requirements || [] : undefined,
    })),
  });
});

// POST /api/assignments/:assignmentId/submissions/quiz
export const submitQuiz = [
  protect,
  asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid assignment id' });
    }

    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Students only' });
    }

    const { answers } = req.body || {};
    if (!Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'answers must be an array' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment || !assignment.isPublished) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    if (assignment.type !== 'quiz') {
      return res.status(400).json({ success: false, message: 'Assignment is not a quiz' });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: assignment.course,
      status: 'enrolled',
    });
    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'You cannot access this assignment' });
    }

    const existing = await Submission.findOne({ assignment: assignmentId, student: req.user._id });
    if (existing?.status === 'graded') {
      return res.json({ success: true, submission: existing, gradeLocked: true });
    }

    const answerByQuestionIndex = new Map();
    answers.forEach((a) => {
      // allow { questionId, selectedIndex } OR { questionIndex, selectedIndex }
      if (!a) return;
      const questionId = a.questionId != null ? String(a.questionId) : null;
      const questionIndex =
        a.questionIndex != null ? Number(a.questionIndex) : null;
      const selectedIndex = Number(a.selectedIndex);

      if (questionId && Number.isFinite(selectedIndex)) answerByQuestionIndex.set(questionId, selectedIndex);
      if (questionIndex != null && Number.isFinite(selectedIndex)) answerByQuestionIndex.set(String(questionIndex), selectedIndex);
    });

    let correctCount = 0;
    const totalQuestions = assignment.questions.length;

    assignment.questions.forEach((q, idx) => {
      const keyById = String(q._id || idx);
      const selected =
        answerByQuestionIndex.get(keyById) ?? answerByQuestionIndex.get(String(idx));
      if (selected === q.correctAnswer) correctCount++;
    });

    const earnedPoints = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * assignment.points) : 0;

    const next = {
      assignment: assignmentId,
      student: req.user._id,
      status: 'graded',
      quizAnswers: answers,
      score: earnedPoints,
      correctCount,
      totalQuestions,
      feedback: earnedPoints >= assignment.points * 0.6 ? 'Great work! Keep practicing.' : 'Good effort. Review the concepts and try again.',
      submittedAt: existing?.submittedAt || new Date(),
      gradedAt: new Date(),
    };

    const submission = existing ? await Submission.findByIdAndUpdate(existing._id, next, { new: true }) : await Submission.create(next);

    // Notify teacher
    if (assignment.createdBy) {
      const notif = await Notification.create({
        userId: assignment.createdBy,
        message: `${req.user.name} submitted quiz "${assignment.title}"`,
        type: 'submission',
        courseId: assignment.course
      });
      emitNotification(assignment.createdBy, notif);
    }

    return res.json({
      success: true,
      submission,
      grade: earnedPoints,
      correctCount,
      totalQuestions,
    });
  }),
];

// POST /api/assignments/:assignmentId/submissions/project (file upload)
export const submitProject = [
  protect,
  memoryUpload.single('file'),
  asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
      return res.status(400).json({ success: false, message: 'Invalid assignment id' });
    }
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Students only' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File is required' });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment || !assignment.isPublished) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    if (assignment.type !== 'project') {
      return res.status(400).json({ success: false, message: 'Assignment is not a project' });
    }

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: assignment.course,
      status: 'enrolled',
    });
    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'You cannot access this assignment' });
    }

    const existing = await Submission.findOne({ assignment: assignmentId, student: req.user._id });
    if (existing?.status === 'graded') {
      return res.json({ success: true, submission: existing, gradeLocked: true });
    }

    const { url, public_id } = await uploadToCloudinary({
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      folder: 'assignment_submissions',
      resourceType: 'raw',
      publicId: `assignment_${assignmentId}_student_${req.user._id}_${Date.now()}`,
      overwrite: false,
    });

    const payload = {
      assignment: assignmentId,
      student: req.user._id,
      status: 'submitted',
      file: {
        url,
        publicId: public_id,
        originalName: req.file.originalname || '',
        mimetype: req.file.mimetype || '',
      },
      submittedAt: existing?.submittedAt || new Date(),
    };

    const submission = existing ? await Submission.findByIdAndUpdate(existing._id, payload, { new: true }) : await Submission.create(payload);
    
    // Notify teacher
    if (assignment.createdBy) {
      const notif = await Notification.create({
        userId: assignment.createdBy,
        message: `${req.user.name} submitted project "${assignment.title}"`,
        type: 'submission',
        courseId: assignment.course
      });
      emitNotification(assignment.createdBy, notif);
    }
    
    return res.json({ success: true, submission });
  }),
];

// GET /api/assignments/:assignmentId/submissions (teacher)
export const getAssignmentSubmissions = asyncHandler(async (req, res) => {
  const { assignmentId } = req.params;

  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only teachers/admin can view' });
  }
  if (!mongoose.Types.ObjectId.isValid(assignmentId)) {
    return res.status(400).json({ success: false, message: 'Invalid assignment id' });
  }

  const assignment = await Assignment.findById(assignmentId).select('course type');
  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

  const { allowed } = await requireCourseOwnerOrAdmin(req.user, assignment.course);
  if (!allowed) return res.status(403).json({ success: false, message: 'Not authorized for this course' });

  const submissions = await Submission.find({ assignment: assignmentId })
    .sort({ submittedAt: -1 })
    .populate('student', 'name email');

  // Instead of Cloudinary URL directly, we serve the proxy endpoint.
  // We use a relative or absolute URL. The frontend calls API_BASE + /assignments/submissions/:id/download.
  const API_BASE = process.env.API_URL || 'http://localhost:5000/api';

  res.json({
    success: true,
    submissions: submissions.map((s) => ({
      id: s._id,
      student: s.student?.name || 'Student',
      studentId: s.student?._id,
      status: s.status,
      score: s.score,
      correctCount: s.correctCount,
      totalQuestions: s.totalQuestions,
      feedback: s.feedback,
      // Provide proxy URL
      file: s.file?.url ? `${API_BASE}/assignments/submissions/${s._id}/download` : null,
      submittedAt: s.submittedAt,
      gradedAt: s.gradedAt,
    })),
  });
});

import https from 'https';

// GET /api/assignments/submissions/:submissionId/download (teacher/student proxy download)
export const downloadSubmissionFile = asyncHandler(async (req, res) => {
  const { submissionId } = req.params;
  const submission = await Submission.findById(submissionId);

  if (!submission || !submission.file || !submission.file.url) {
    return res.status(404).json({ success: false, message: 'File not found' });
  }

  const fileUrl = submission.file.url;
  const originalName = submission.file.originalName || 'submission_file';
  const mimetype = submission.file.mimetype || 'application/octet-stream';

  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);
  res.setHeader('Content-Type', mimetype);

  https.get(fileUrl, (proxyRes) => {
    if (proxyRes.statusCode >= 400) {
      res.status(proxyRes.statusCode || 500).json({ success: false, message: 'Failed to download from upstream' });
      return;
    }
    proxyRes.pipe(res);
  }).on('error', (err) => {
    res.status(500).json({ success: false, message: err.message });
  });
});

// POST /api/assignments/:assignmentId/submissions/:submissionId/grade (teacher)
export const gradeSubmission = asyncHandler(async (req, res) => {
  const { assignmentId, submissionId } = req.params;

  if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Only teachers/admin can grade' });
  }

  if (!mongoose.Types.ObjectId.isValid(assignmentId) || !mongoose.Types.ObjectId.isValid(submissionId)) {
    return res.status(400).json({ success: false, message: 'Invalid ids' });
  }

  const { grade, feedback } = req.body || {};
  const normalizedFeedback = feedback ? String(feedback).trim() : '';
  const normalizedGrade = grade == null ? null : Number(grade);

  const assignment = await Assignment.findById(assignmentId).select('course type points questions');
  if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });

  const { allowed } = await requireCourseOwnerOrAdmin(req.user, assignment.course);
  if (!allowed) return res.status(403).json({ success: false, message: 'Not authorized for this course' });

  const submission = await Submission.findById(submissionId);
  if (!submission || String(submission.assignment) !== String(assignmentId)) {
    return res.status(404).json({ success: false, message: 'Submission not found' });
  }

  // For quiz, allow overriding computed points.
  const scoreToSet =
    normalizedGrade != null && Number.isFinite(normalizedGrade)
      ? Math.max(0, normalizedGrade)
      : assignment.type === 'quiz'
        ? submission.score
        : normalizedGrade;

  submission.status = 'graded';
  submission.feedback = normalizedFeedback || submission.feedback || '';
  if (scoreToSet != null && Number.isFinite(scoreToSet)) submission.score = scoreToSet;
  submission.gradedAt = new Date();
  await submission.save();

  res.json({ success: true, submission });
});
