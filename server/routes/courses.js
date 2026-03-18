import express from 'express';
import { body, query, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import Course from '../models/courseModel.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ─── Helper ──────────────────────────────────────────────────────────────────

const formatCourse = (course, userId) => ({
  id: course._id,
  title: course.title,
  description: course.description,
  category: course.category,
  level: course.level,
  instructor: course.instructor,
  duration: course.duration,
  image: course.image,
  color: course.color,
  rating: course.rating,
  totalRatings: course.totalRatings,
  enrollmentCount: course.enrollmentCount,
  isPublished: course.isPublished,
  isEnrolled: userId
    ? course.students.some((id) => id.toString() === userId.toString())
    : false,
  createdAt: course.createdAt,
});

// ─── GET /api/courses/my/enrolled ─────────────────────────────────────────────
// Protected. Get all courses the current user is enrolled in.
// MUST BE BEFORE /:id route
router.get(
  '/my/enrolled',
  protect,
  asyncHandler(async (req, res) => {
    const courses = await Course.find({
      students: req.user._id,
      isPublished: true,
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: courses.length,
      courses: courses.map((c) => formatCourse(c, req.user._id)),
    });
  })
);

// ─── GET /api/courses/my/created ──────────────────────────────────────────────
// Protected. Teacher sees their own courses (including unpublished).
// MUST BE BEFORE /:id route
router.get(
  '/my/created',
  protect,
  asyncHandler(async (req, res) => {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only teachers and admins can access this' });
    }

    const courses = await Course.find({ createdBy: req.user._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: courses.length,
      courses: courses.map((c) => formatCourse(c, req.user._id)),
    });
  })
);

// ─── GET /api/courses ─────────────────────────────────────────────────────────
// Public. Supports ?search=, ?category=, ?level=, ?sort=rating|newest|popular
router.get(
  '/',
  [
    query('category')
      .optional()
      .isIn(['all', 'programming', 'design', 'science', 'mathematics', 'language', 'business', 'arts'])
      .withMessage('Invalid category'),
    query('level')
      .optional()
      .isIn(['all', 'beginner', 'intermediate', 'advanced'])
      .withMessage('Invalid level'),
    query('sort')
      .optional()
      .isIn(['rating', 'newest', 'popular'])
      .withMessage('Invalid sort option'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { search, category, level, sort = 'newest' } = req.query;

    // Build filter
    const filter = { isPublished: true };

    if (search) {
      filter.$text = { $search: search };
    }
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (level && level !== 'all') {
      filter.level = level;
    }

    // Build sort
    let sortOption = {};
    if (sort === 'rating') sortOption = { rating: -1 };
    else if (sort === 'popular') sortOption = { enrollmentCount: -1 };
    else sortOption = { createdAt: -1 }; // newest

    const courses = await Course.find(filter).sort(sortOption);

    const userId = req.user?._id; // optional auth

    res.json({
      success: true,
      count: courses.length,
      courses: courses.map((c) => formatCourse(c, userId)),
    });
  })
);

// ─── GET /api/courses/:id ─────────────────────────────────────────────────────
// Protected. Return course details with user-aware flags (e.g. isEnrolled).
router.get(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);

    if (!course || !course.isPublished) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({
      success: true,
      course: formatCourse(course, req.user._id),
    });
  })
);

// ─── POST /api/courses ────────────────────────────────────────────────────────
// Protected (teacher/admin only).
router.post(
  '/',
  protect,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category')
      .isIn(['programming', 'design', 'science', 'mathematics', 'language', 'business', 'arts'])
      .withMessage('Invalid category'),
    body('level')
      .isIn(['beginner', 'intermediate', 'advanced'])
      .withMessage('Invalid level'),
    body('instructor').trim().notEmpty().withMessage('Instructor name is required'),
    body('duration').trim().notEmpty().withMessage('Duration is required'),
  ],
  asyncHandler(async (req, res) => {
    // Role check
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only teachers and admins can create courses' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, description, category, level, instructor, duration, image, color } = req.body;

    const course = await Course.create({
      title,
      description,
      category,
      level,
      instructor,
      duration,
      image: image || '',
      color: color || 'from-blue-500 to-cyan-500',
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      course: formatCourse(course, req.user._id),
    });
  })
);

// ─── PUT /api/courses/:id ─────────────────────────────────────────────────────
// Protected (course creator or admin).
router.put(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Authorization check
    const isOwner = course.createdBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this course' });
    }

    const allowedFields = ['title', 'description', 'category', 'level', 'instructor', 'duration', 'image', 'color', 'isPublished'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        course[field] = req.body[field];
      }
    });

    await course.save();

    res.json({
      success: true,
      course: formatCourse(course, req.user._id),
    });
  })
);

// ─── DELETE /api/courses/:id ──────────────────────────────────────────────────
// Protected (course creator or admin).
router.delete(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const isOwner = course.createdBy.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this course' });
    }

    await course.deleteOne();

    res.json({ success: true, message: 'Course deleted successfully' });
  })
);

// ─── POST /api/courses/:id/enroll ─────────────────────────────────────────────
// Protected. Student enrolls in a course.
router.post(
  '/:id/enroll',
  protect,
  asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);

    if (!course || !course.isPublished) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const alreadyEnrolled = course.students.some(
      (id) => id.toString() === req.user._id.toString()
    );

    if (alreadyEnrolled) {
      return res.status(400).json({ success: false, message: 'Already enrolled in this course' });
    }

    course.students.push(req.user._id);
    course.enrollmentCount = course.students.length;
    await course.save();

    res.json({
      success: true,
      message: 'Enrolled successfully',
      course: formatCourse(course, req.user._id),
    });
  })
);

// ─── DELETE /api/courses/:id/enroll ──────────────────────────────────────────
// Protected. Student unenrolls from a course.
router.delete(
  '/:id/enroll',
  protect,
  asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    course.students = course.students.filter(
      (id) => id.toString() !== req.user._id.toString()
    );
    course.enrollmentCount = course.students.length;
    await course.save();

    res.json({
      success: true,
      message: 'Unenrolled successfully',
      course: formatCourse(course, req.user._id),
    });
  })
);

// ─── POST /api/courses/:id/rate ───────────────────────────────────────────────
// Protected. Enrolled student rates a course.
router.post(
  '/:id/rate',
  protect,
  [
    body('rating')
      .isFloat({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const course = await Course.findById(req.params.id);

    if (!course || !course.isPublished) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const isEnrolled = course.students.some(
      (id) => id.toString() === req.user._id.toString()
    );
    if (!isEnrolled) {
      return res.status(403).json({ success: false, message: 'You must be enrolled to rate this course' });
    }

    const { rating } = req.body;

    // Recalculate running average
    const newTotal = course.totalRatings + 1;
    const newRating = ((course.rating * course.totalRatings) + rating) / newTotal;

    course.rating = Math.round(newRating * 10) / 10; // 1 decimal place
    course.totalRatings = newTotal;
    await course.save();

    res.json({
      success: true,
      message: 'Rating submitted',
      rating: course.rating,
      totalRatings: course.totalRatings,
    });
  })
);

export default router;
