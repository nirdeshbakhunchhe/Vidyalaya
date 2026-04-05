import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect } from '../middleware/auth.js';
import Enrollment from '../models/enrollmentModel.js';
import Course from '../models/courseModel.js';
import Notification from '../models/notification.model.js';
import { emitNotification } from '../socket.js';

const router = express.Router();

// ─── Helper to shape response ───────────────────────────────────────────────────
const formatEnrollment = (enrollment) => ({
  // Provide BOTH `_id` and `id` so old/new frontend code can consume it safely
  _id: enrollment._id,
  id: enrollment._id,
  studentId: enrollment.student?._id || enrollment.student,
  studentName: enrollment.student?.name,
  courseId: enrollment.course?._id || enrollment.course,
  courseTitle: enrollment.course?.title,
  status: enrollment.status,
  paymentStatus: enrollment.paymentStatus,
  paidAt: enrollment.paidAt || null,
  transactionId: enrollment.transactionId || null,
  createdAt: enrollment.createdAt,
});

// ─── POST /api/enrollments ─────────────────────────────────────────────────────
// Student creates an enrollment request for a course.
router.post(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const { courseId } = req.body;

    if (!courseId) {
      return res
        .status(400)
        .json({ success: false, message: 'courseId is required' });
    }

    if (req.user.role !== 'student') {
      return res
        .status(403)
        .json({ success: false, message: 'Only students can request enrollment' });
    }

    const course = await Course.findById(courseId);
    if (!course || !course.isPublished) {
      return res
        .status(404)
        .json({ success: false, message: 'Course not found' });
    }

    // If already a student, no need for request
    const alreadyStudent = course.students.some(
      (id) => id.toString() === req.user._id.toString()
    );
    if (alreadyStudent) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this course',
      });
    }

    // Check existing enrollment records
    const existing = await Enrollment.findOne({
      student: req.user._id,
      course: course._id,
    }).sort({ createdAt: -1 });

    if (existing && (existing.status === 'pending' || existing.status === 'approved')) {
      return res.status(400).json({
        success: false,
        message:
          existing.status === 'pending'
            ? 'You already have a pending request for this course'
            : 'You are already approved for this course',
      });
    }

    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: course._id,
      status: 'pending',
      paymentStatus: course.price && course.price > 0 ? 'pending' : 'not_required',
    });

    const populated = await enrollment.populate([
      { path: 'student', select: 'name' },
      { path: 'course', select: 'title' },
    ]);

    // Notify teacher
    if (course.createdBy) {
      const notif = await Notification.create({
        userId: course.createdBy,
        message: `${req.user.name} requested enrollment in ${course.title}`,
        type: 'enrollment_request',
        courseId: course._id
      });
      emitNotification(course.createdBy, notif);
    }

    res.status(201).json({
      success: true,
      enrollment: formatEnrollment(populated),
    });
  })
);

// ─── GET /api/enrollments/status/:courseId ─────────────────────────────────────
// Student can check their enrollment status for a specific course.
router.get(
  '/status/:courseId',
  protect,
  asyncHandler(async (req, res) => {
    const { courseId } = req.params;

    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    })
      .sort({ createdAt: -1 })
      .populate('student', 'name')
      .populate('course', 'title');

    if (!enrollment) return res.status(404).json({ success: false, message: 'No enrollment request found' });

    res.json({
      success: true,
      enrollment: formatEnrollment(enrollment),
    });
  })
);

// ─── GET /api/enrollments/teaching ─────────────────────────────────────────────
// Teacher: requests for their own courses
// Admin: all enrollment requests
router.get(
  '/teaching',
  protect,
  asyncHandler(async (req, res) => {
    let filter = {};

    if (req.user.role === 'teacher') {
      // First find courses created by this teacher
      const myCourses = await Course.find({ createdBy: req.user._id }).select('_id');
      const courseIds = myCourses.map((c) => c._id);
      filter.course = { $in: courseIds };
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers and admins can view enrollment requests',
      });
    }

    const enrollments = await Enrollment.find(filter)
      .sort({ createdAt: -1 })
      .populate('student', 'name email')
      .populate('course', 'title');

    res.json({
      success: true,
      count: enrollments.length,
      enrollments: enrollments.map(formatEnrollment),
    });
  })
);

// ─── Helper to require teacher/admin ownership ─────────────────────────────────
const requireCourseOwnerOrAdmin = async (user, courseId) => {
  const course = await Course.findById(courseId);
  if (!course) return { allowed: false, course: null };

  if (user.role === 'admin') return { allowed: true, course };

  const isOwner = course.createdBy.toString() === user._id.toString();
  return { allowed: isOwner, course };
};

// ─── POST /api/enrollments/:id/approve ─────────────────────────────────────────
router.post(
  '/:id/approve',
  protect,
  asyncHandler(async (req, res) => {
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res
        .status(404)
        .json({ success: false, message: 'Enrollment request not found' });
    }

    const { allowed, course } = await requireCourseOwnerOrAdmin(
      req.user,
      enrollment.course
    );
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage this enrollment request',
      });
    }

    const isPaidCourse = !!(course.price && course.price > 0);

    // Free course: teacher approval immediately enrolls the student.
    // Paid course: teacher approval only marks "approved" so the student can pay next.
    if (isPaidCourse) {
      enrollment.status = 'approved';
      // paymentStatus stays 'pending' until Khalti verification marks it 'paid'
      if (enrollment.paymentStatus !== 'pending') enrollment.paymentStatus = 'pending';
      await enrollment.save();
    } else {
      enrollment.status = 'enrolled';
      enrollment.paymentStatus = 'not_required';
      await enrollment.save();

      // Add student to course if not already present
      const alreadyStudent = course.students.some(
        (id) => id.toString() === enrollment.student.toString()
      );
      if (!alreadyStudent) {
        course.students.push(enrollment.student);
        course.enrollmentCount = course.students.length;
        await course.save();
      }
    }

    const populated = await enrollment.populate([
      { path: 'student', select: 'name email' },
      { path: 'course', select: 'title' },
    ]);

    // Notify student
    if (isPaidCourse) {
      const notif = await Notification.create({
        userId: enrollment.student._id,
        message: `Your enrollment request for ${course.title} has been approved. Please complete payment.`,
        type: 'enrollment_approved',
        courseId: course._id
      });
      emitNotification(enrollment.student._id, notif);
    } else {
      const notif = await Notification.create({
        userId: enrollment.student._id,
        message: `Your enrollment request for ${course.title} has been approved. You are now enrolled!`,
        type: 'enrolled',
        courseId: course._id
      });
      emitNotification(enrollment.student._id, notif);
    }

    res.json({
      success: true,
      enrollment: formatEnrollment(populated),
    });
  })
);

// ─── POST /api/enrollments/:id/reject ──────────────────────────────────────────
router.post(
  '/:id/reject',
  protect,
  asyncHandler(async (req, res) => {
    const enrollment = await Enrollment.findById(req.params.id);

    if (!enrollment) {
      return res
        .status(404)
        .json({ success: false, message: 'Enrollment request not found' });
    }

    const { allowed } = await requireCourseOwnerOrAdmin(
      req.user,
      enrollment.course
    );
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to manage this enrollment request',
      });
    }

    enrollment.status = 'rejected';
    await enrollment.save();

    const populated = await enrollment.populate([
      { path: 'student', select: 'name email' },
      { path: 'course', select: 'title' },
    ]);

    res.json({
      success: true,
      enrollment: formatEnrollment(populated),
    });
  })
);

export default router;
