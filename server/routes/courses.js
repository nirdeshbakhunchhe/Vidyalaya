import express from 'express';
import { body, query, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import multer from 'multer';
import mongoose from 'mongoose';
import Course from '../models/courseModel.js';
import { protect } from '../middleware/auth.js';
import Enrollment from '../models/enrollmentModel.js';
import { uploadToCloudinary } from '../utils/cloudinaryUpload.js';
import Notification from '../models/notification.model.js';
import { emitNotification } from '../socket.js';

const router = express.Router();

// Validate course id params early to avoid Mongoose CastError.
// This prevents `"1"` (or any non-ObjectId) from crashing the route.
router.param('id', (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid course id',
    });
  }
  return next();
});

// ─── Multer (in-memory) for Cloudinary uploads ───────────────────────────────
const thumbnailUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only video files are allowed'), false);
  },
});

const requireCourseOwnerOrAdmin = async (user, courseId) => {
  const course = await Course.findById(courseId);
  if (!course) return { allowed: false, course: null };
  if (user.role === 'admin') return { allowed: true, course };
  return {
    allowed: course.createdBy.toString() === user._id.toString(),
    course,
  };
};

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
  price: course.price ?? 0,
  color: course.color,
  rating: course.rating,
  totalRatings: course.totalRatings,
  enrollmentCount: course.enrollmentCount,
  isPublished: course.isPublished,
  isEnrolled: userId
    ? course.students.some((id) => id.toString() === userId.toString())
    : false,
  curriculum: course.curriculum || [],
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

// ─── GET /api/courses/:id/learning ─────────────────────────────────────────
// Protected. Returns course videos only if the student is allowed to watch.
// Free courses: must be teacher-approved => enrollment.status === 'enrolled'
// Paid courses: must be teacher-approved + paid => enrollment.status==='enrolled' && paymentStatus==='paid'
router.get(
  '/:id/learning',
  protect,
  asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const isTeacherOrAdmin = req.user.role === 'teacher' || req.user.role === 'admin';
    const isPublishedOk = course.isPublished || isTeacherOrAdmin;
    if (!isPublishedOk) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    let canWatch = false;

    if (isTeacherOrAdmin) {
      canWatch = true;
    } else {
      const enrollment = await Enrollment.findOne({
        student: req.user._id,
        course: course._id,
      });

      if (enrollment) {
        const isPaidCourse = !!(course.price && course.price > 0);
        if (!isPaidCourse) {
          canWatch = enrollment.status === 'enrolled';
        } else {
          canWatch = enrollment.status === 'enrolled' && enrollment.paymentStatus === 'paid';
        }
      }
    }

    return res.json({
      success: true,
      access: { canWatch },
      course: {
        id: course._id,
        title: course.title,
        instructor: course.instructor,
        duration: course.duration,
        thumbnail: course.image,
        price: course.price ?? 0,
        level: course.level,
        category: course.category,
      },
      videos: canWatch ? course.videos || [] : [],
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
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a number >= 0'),
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

    const { title, description, category, level, instructor, duration, image, color, price } = req.body;

    const course = await Course.create({
      title,
      description,
      category,
      level,
      instructor,
      duration,
      image: image || '',
      color: color || 'from-blue-500 to-cyan-500',
      price: price != null ? Number(price) : 0,
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

    const allowedFields = ['title', 'description', 'category', 'level', 'instructor', 'duration', 'image', 'color', 'isPublished', 'price'];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        course[field] = field === 'price' ? Number(req.body[field]) : req.body[field];
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

// ─── POST /api/courses/:id/thumbnail ──────────────────────────────────────────
// Protected. Teacher/Admin uploads course thumbnail to Cloudinary.
router.post(
  '/:id/thumbnail',
  protect,
  thumbnailUpload.single('thumbnail'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No thumbnail file uploaded' });
    }
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only teachers/admins can upload thumbnails' });
    }

    const courseId = req.params.id;
    const { allowed, course } = await requireCourseOwnerOrAdmin(req.user, courseId);

    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Not authorized to upload for this course' });
    }

    const { url, public_id } = await uploadToCloudinary({
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      folder: 'course_thumbnails',
      resourceType: 'image',
      publicId: `course_${course._id}_thumbnail`,
      overwrite: true,
    });

    course.image = url;
    course.imagePublicId = public_id;
    await course.save();

    return res.json({
      success: true,
      course: formatCourse(course, req.user._id),
    });
  })
);

// ─── POST /api/courses/:id/videos ───────────────────────────────────────────────
// Protected. Teacher/Admin uploads one video to Cloudinary at a time.
// The frontend can upload multiple files (1-2 mins each) with separate calls,
// so each request can have its own upload progress bar.
router.post(
  '/:id/videos',
  protect,
  videoUpload.single('video'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file uploaded' });
    }
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only teachers/admins can upload videos' });
    }

    const courseId = req.params.id;
    const { allowed, course } = await requireCourseOwnerOrAdmin(req.user, courseId);

    if (!allowed) {
      return res.status(403).json({ success: false, message: 'Not authorized to upload for this course' });
    }

    const rawTitle = req.body.title;
    const defaultTitle = (req.file.originalname || 'Untitled')
      .replace(/\.[^/.]+$/, '')
      .slice(0, 200);
    const title = (rawTitle && String(rawTitle).trim() ? String(rawTitle).trim() : defaultTitle).slice(0, 200);

    const publicIdSafePart = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40);

    const { url, public_id } = await uploadToCloudinary({
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      folder: 'course_videos',
      resourceType: 'video',
      publicId: `course_${course._id}_video_${Date.now()}_${publicIdSafePart || 'video'}`,
      overwrite: false,
    });

    course.videos = course.videos || [];
    course.videos.push({ title, url, public_id });

    // Keep curriculum roughly aligned with uploaded videos:
    // MVP approach: append each uploaded video as a lesson under the first section.
    // Teachers can later customize `course.curriculum` if we add a UI for it.
    course.curriculum = course.curriculum || [];
    if (!course.curriculum.length) {
      course.curriculum = [
        {
          section: 'Lessons',
          lessons: [{ title, duration: '', free: false }],
        },
      ];
    } else {
      const targetSection = course.curriculum[0];
      targetSection.lessons = targetSection.lessons || [];
      targetSection.lessons.push({ title, duration: '', free: false });
    }

    await course.save();

    // Notify all students
    if (course.students && course.students.length > 0) {
      const notifsToInsert = course.students.map(studentId => ({
        userId: studentId,
        message: `New video "${title}" was added to ${course.title}`,
        type: 'content',
        courseId: course._id
      }));
      const docs = await Notification.insertMany(notifsToInsert);
      docs.forEach(notif => emitNotification(notif.userId, notif));
    }

    return res.json({
      success: true,
      video: { title, url, public_id },
      course: formatCourse(course, req.user._id),
    });
  })
);

export default router;