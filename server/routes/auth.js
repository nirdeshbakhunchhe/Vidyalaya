import express from 'express';
import { body, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import nodemailer from 'nodemailer';
import { sendApprovalEmail } from '../utils/sendEmail.js';
import rateLimit from 'express-rate-limit';
import User from '../models/User.js';
import Course from '../models/courseModel.js';
import Enrollment from '../models/enrollmentModel.js';
import Progress from '../models/progressModel.js';
import Notification from '../models/notification.model.js';
import ActivityLog from '../models/ActivityLog.js';
import Submission from '../models/submission.model.js';
import ChatHistory from '../models/chatHistory.model.js';
import Payment from '../models/payment.model.js';
import Assignment from '../models/assignment.model.js';
import { protect, authorize } from '../middleware/auth.js';
import { uploadToCloudinary } from '../utils/cloudinaryUpload.js';

const router = express.Router();

// ── Rate Limiters ────────────────────────────────────────────────────────────
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 OTP requests per `window` (here, per 15 minutes)
  message: { success: false, message: 'Too many reset attempts from this IP, please try again after 15 minutes' },
});

// ── Multer setup for avatar uploads ─────────────────────────────────────────
// Using memoryStorage so files go straight to Cloudinary (no local disk).
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

const docUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only image and PDF files are allowed'), false);
  },
});

// ── Token helper ─────────────────────────────────────────────────────────────
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });

// ── OTP helpers ──────────────────────────────────────────────────────────────
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString(); // 6‑digit numeric

const getOtpExpiryDate = () => new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

/** Courses this user created (teacher) — removes dependent rows then the courses. */
const deleteCoursesCreatedByUser = async (userId) => {
  const owned = await Course.find({ createdBy: userId }).select('_id').lean();
  const courseIds = owned.map((c) => c._id);
  if (!courseIds.length) return;

  const assignments = await Assignment.find({ course: { $in: courseIds } }).select('_id').lean();
  const assignmentIds = assignments.map((a) => a._id);
  if (assignmentIds.length) {
    await Submission.deleteMany({ assignment: { $in: assignmentIds } });
  }
  await Assignment.deleteMany({ course: { $in: courseIds } });
  await Enrollment.deleteMany({ course: { $in: courseIds } });
  await Progress.deleteMany({ course: { $in: courseIds } });
  await Payment.deleteMany({ course: { $in: courseIds } });
  await Notification.deleteMany({ courseId: { $in: courseIds } });
  await Course.deleteMany({ _id: { $in: courseIds } });
};

/** Per-user rows (enrollments, progress, etc.) and pull from course.students. */
const deleteUserScopedData = async (userId) => {
  await Enrollment.deleteMany({ student: userId });
  await Progress.deleteMany({ user: userId });
  await Notification.deleteMany({ userId });
  await ActivityLog.deleteMany({ userId });
  await Submission.deleteMany({ student: userId });
  await ChatHistory.deleteMany({ user: userId });
  await Payment.deleteMany({ student: userId });
  await Course.updateMany({ students: userId }, { $pull: { students: userId } });
};

const sendOtpEmail = async ({ to, otp, subject, purpose }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const from = process.env.EMAIL_FROM || 'no-reply@example.com';
  const html = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6;">
      <h2 style="color:#1e3a8a;">${subject}</h2>
      <p>Your one-time password (OTP) for ${purpose} is:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color:#1d4ed8;">${otp}</p>
      <p>This OTP will expire in <strong>5 minutes</strong>.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });
};

// ── Shared user serializer ───────────────────────────────────────────────────
const serializeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  isEmailVerified: user.isEmailVerified,
  createdAt: user.createdAt,
  // Teacher fields (null/'' for students)
  degree: user.degree || '',
  yearsOfTeaching: user.yearsOfTeaching ?? null,
  experienceDescription: user.experienceDescription || '',
  isApproved: user.isApproved ?? true,
  qualificationDoc: user.qualificationDoc || '',
  // Engagement features
  themePreference: user.themePreference || 'light',
  loginStreak: user.loginStreak || 0,
  badges: user.badges || [],
});

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post(
  '/register',
  docUpload.single('qualificationDoc'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn(['student', 'teacher'])
      .withMessage('Role must be student or teacher'),
    body('yearsOfTeaching')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Years of teaching must be a non-negative integer'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      name,
      email,
      password,
      role,
      degree,
      yearsOfTeaching,
      experienceDescription,
    } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    const userData = {
      name,
      email,
      password,
      role: role || 'student',
    };

    // Only persist teacher fields when role is teacher
    if (role === 'teacher') {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Qualification document is required for teachers' });
      }

      const { url } = await uploadToCloudinary({
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        folder: 'qualifications',
        resourceType: 'auto',
        overwrite: true,
      });

      if (degree) userData.degree = degree;
      if (yearsOfTeaching !== undefined) userData.yearsOfTeaching = Number(yearsOfTeaching);
      if (experienceDescription) userData.experienceDescription = experienceDescription;
      userData.qualificationDoc = url;
      userData.isApproved = false;
    }

    const user = await User.create(userData);

    // Generate OTP for email verification
    const otp = generateOtp();
    user.otpCode = otp;
    user.otpExpiresAt = getOtpExpiryDate();
    user.otpPurpose = 'signup';
    await user.save();

    // Send OTP email (best-effort; log but don't leak internal errors)
    try {
      await sendOtpEmail({
        to: user.email,
        otp,
        subject: 'Verify your Vidyalaya account',
        purpose: 'signing up to Vidyalaya',
      });
    } catch (emailErr) {
      console.error('Failed to send signup OTP email:', emailErr);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. An OTP has been sent to your email to verify your account.',
      email: user.email,
    });
  })
);

// ── POST /api/auth/verify-otp ────────────────────────────────────────────────
// Verifies OTP for signup and returns JWT + user on success.
router.post(
  '/verify-otp',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .matches(/^\d{6}$/)
      .withMessage('OTP must be a 6‑digit code'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select('+otpCode +otpExpiresAt +otpPurpose');
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or OTP' });
    }

    if (
      !user.otpCode ||
      !user.otpExpiresAt ||
      user.otpPurpose !== 'signup' ||
      user.otpCode !== otp ||
      user.otpExpiresAt < new Date()
    ) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.isEmailVerified = true;
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    user.otpPurpose = undefined;
    await user.save();

    // If teacher and not approved, do not issue a token
    if (user.role === 'teacher' && !user.isApproved) {
      return res.json({
        success: true,
        pendingApproval: true,
        message: 'Email verified. Your account is pending admin approval.',
      });
    }

    const token = generateToken(user._id);
    res.json({ success: true, token, user: serializeUser(user) });
  })
);

// ── POST /api/auth/resend-signup-otp ─────────────────────────────────────────
router.post(
  '/resend-signup-otp',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: 'No account found with this email' });
    }

    const otp = generateOtp();
    user.otpCode = otp;
    user.otpExpiresAt = getOtpExpiryDate();
    user.otpPurpose = 'signup';
    await user.save();

    try {
      await sendOtpEmail({
        to: user.email,
        otp,
        subject: 'Your new Vidyalaya verification code',
        purpose: 'verifying your Vidyalaya account',
      });
    } catch (emailErr) {
      console.error('Failed to resend signup OTP email:', emailErr);
    }

    res.json({
      success: true,
      message: 'A new OTP has been sent to your email address.',
      email: user.email,
    });
  })
);

// ── POST /api/auth/forgot-password ────────────────────────────────────────────
router.post(
  '/forgot-password',
  otpLimiter,
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Prevent email enumeration
      return res.json({
        success: true,
        message: 'If an account with that email exists, an OTP has been sent.',
      });
    }

    const otp = generateOtp();
    user.otpCode = otp;
    user.otpExpiresAt = getOtpExpiryDate();
    user.otpPurpose = 'resetPassword';
    await user.save();

    try {
      await sendOtpEmail({
        to: user.email,
        otp,
        subject: 'Vidyalaya password reset OTP',
        purpose: 'resetting your Vidyalaya password',
      });
    } catch (emailErr) {
      console.error('Failed to send reset password OTP email:', emailErr);
    }

    res.json({
      success: true,
      message: 'If an account with that email exists, an OTP has been sent.',
      email: user.email,
    });
  })
);

// ── POST /api/auth/verify-reset-otp ───────────────────────────────────────────
router.post(
  '/verify-reset-otp',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .matches(/^\d{6}$/)
      .withMessage('OTP must be a 6‑digit code'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, otp } = req.body;
    const user = await User.findOne({ email }).select('+otpCode +otpExpiresAt +otpPurpose');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or OTP' });
    }

    if (
      !user.otpCode ||
      !user.otpExpiresAt ||
      user.otpPurpose !== 'resetPassword' ||
      user.otpCode !== otp ||
      user.otpExpiresAt < new Date()
    ) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    // OTP is valid. We don't reset it here, we just return success so the frontend can move to the next step.
    res.json({ success: true, message: 'OTP verified successfully.' });
  })
);

// ── POST /api/auth/reset-password ─────────────────────────────────────────────
router.post(
  '/reset-password',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .matches(/^\d{6}$/)
      .withMessage('OTP must be a 6‑digit code'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email }).select('+otpCode +otpExpiresAt +otpPurpose +password');

    if (
      !user ||
      !user.otpCode ||
      !user.otpExpiresAt ||
      user.otpPurpose !== 'resetPassword' ||
      user.otpCode !== otp ||
      user.otpExpiresAt < new Date()
    ) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    user.password = newPassword;
    user.isEmailVerified = true;
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    user.otpPurpose = undefined;
    await user.save();

    res.json({ success: true, message: 'Password has been reset successfully.' });
  })
);

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    // ── Normal login flow ────────────────────────────────────────────────────
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.role === 'teacher' && !user.isApproved) {
      return res.status(403).json({ success: false, message: 'Your account is pending admin approval' });
    }

    // --- Streak Logic ---
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (user.lastLoginDate) {
      const lastLogin = new Date(user.lastLoginDate);
      const lastLoginDay = new Date(lastLogin.getFullYear(), lastLogin.getMonth(), lastLogin.getDate());

      const diffTime = Math.abs(today.getTime() - lastLoginDay.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        user.loginStreak += 1;
        if (user.loginStreak === 7 && !user.badges.find(b => b.name === '7-Day Streak')) {
          user.badges.push({ badgeType: 'streak', name: '7-Day Streak', icon: '🔥' });
        }
      } else if (diffDays > 1) {
        user.loginStreak = 1;
      }
    } else {
      user.loginStreak = 1;
      // Assign First Login Badge
      if (!user.badges.find(b => b.name === 'First Login')) {
        user.badges.push({ badgeType: 'achievement', name: 'First Login', icon: '🎯' });
      }
    }

    user.lastLoginDate = now;
    await user.save();
    // --------------------

    const token = generateToken(user._id);
    res.json({ success: true, token, user: serializeUser(user) });
  })
);

// ── PUT /api/auth/theme ──────────────────────────────────────────────────────
router.put(
  '/theme',
  protect,
  asyncHandler(async (req, res) => {
    const { themePreference } = req.body;
    if (!['light', 'dark'].includes(themePreference)) {
      return res.status(400).json({ success: false, message: 'Invalid theme preference' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { themePreference },
      { new: true }
    );

    res.json({ success: true, themePreference: user.themePreference });
  })
);

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user: serializeUser(user) });
  })
);

// ── PUT /api/auth/profile ────────────────────────────────────────────────────
// Updates name, email, and teacher-specific fields.
router.put(
  '/profile',
  protect,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('yearsOfTeaching')
      .optional({ nullable: true })
      .isInt({ min: 0 })
      .withMessage('Years of teaching must be a non-negative integer'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, degree, yearsOfTeaching, experienceDescription } = req.body;
    const userId = req.user._id;

    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already in use by another account',
      });
    }

    const updateData = { name, email };

    // Allow teachers to update their extra profile fields
    const user = await User.findById(userId);
    if (user.role === 'teacher') {
      if (degree !== undefined) updateData.degree = degree;
      if (yearsOfTeaching !== undefined) updateData.yearsOfTeaching = Number(yearsOfTeaching);
      if (experienceDescription !== undefined) updateData.experienceDescription = experienceDescription;
    }

    const updated = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, user: serializeUser(updated) });
  })
);

// ── POST /api/auth/avatar ────────────────────────────────────────────────────
// Handles profile photo upload. Returns updated user with new avatar URL.
router.post(
  '/avatar',
  protect,
  avatarUpload.single('avatar'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const { url } = await uploadToCloudinary({
      buffer: req.file.buffer,
      mimetype: req.file.mimetype,
      folder: 'avatars',
      resourceType: 'image',
      overwrite: true,
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: url },
      { new: true }
    );

    res.json({ success: true, user: serializeUser(user) });
  })
);

// ── PUT /api/auth/change-password ────────────────────────────────────────────
router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  })
);

// ── DELETE /api/auth/account ─────────────────────────────────────────────────
// Self-service account deletion. Requires current password.
router.delete(
  '/account',
  protect,
  [body('password').notEmpty().withMessage('Password is required to delete your account')],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin accounts cannot be deleted from the profile page. Use another admin account if needed.',
      });
    }

    const { password } = req.body;
    if (!(await user.comparePassword(password))) {
      return res.status(400).json({ success: false, message: 'Password is incorrect' });
    }

    const userId = user._id;

    await deleteCoursesCreatedByUser(userId);
    await deleteUserScopedData(userId);

    await user.deleteOne();

    res.json({ success: true, message: 'Your account has been deleted' });
  })
);

// ── Admin-only user management endpoints ─────────────────────────────────────

// GET /api/auth/admin/pending-teachers
router.get(
  '/admin/pending-teachers',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const users = await User.find({ role: 'teacher', isApproved: false }).sort({ createdAt: -1 });
    res.json({
      success: true,
      users: users.map(serializeUser).map((u, i) => ({ ...u, qualificationDoc: users[i].qualificationDoc })),
    });
  })
);

// PUT /api/auth/admin/approve-teacher/:id
router.put(
  '/admin/approve-teacher/:id',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    
    if (user.role !== 'teacher') {
      return res.status(400).json({ success: false, message: 'User is not a teacher' });
    }

    user.isApproved = true;
    await user.save();

    try {
      await sendApprovalEmail({ to: user.email, name: user.name });
    } catch (err) {
      console.error('Failed to send approval email:', err);
    }

    res.json({ success: true, message: 'Teacher approved successfully', user: serializeUser(user) });
  })
);

// DELETE /api/auth/admin/reject-teacher/:id
router.delete(
  '/admin/reject-teacher/:id',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Teacher not found' });
    }
    
    if (user.role !== 'teacher') {
      return res.status(400).json({ success: false, message: 'User is not a teacher' });
    }

    await user.deleteOne();

    res.json({ success: true, message: 'Teacher application rejected and removed' });
  })
);

// GET /api/auth/admin/users?role=teacher|student|admin
router.get(
  '/admin/users',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }

    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({
      success: true,
      users: users.map(serializeUser),
    });
  })
);

// POST /api/auth/admin/users
router.post(
  '/admin/users',
  protect,
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
    body('role')
      .optional()
      .isIn(['student', 'teacher', 'admin'])
      .withMessage('Invalid role'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const {
      name,
      email,
      password,
      role = 'student',
      status,
      degree,
      yearsOfTeaching,
      experienceDescription,
    } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: 'User already exists with this email' });
    }

    const doc = new User({
      name,
      email,
      password,
      role,
      status: status || 'active',
    });

    if (role === 'teacher') {
      if (degree) doc.degree = degree;
      if (yearsOfTeaching !== undefined) doc.yearsOfTeaching = Number(yearsOfTeaching);
      if (experienceDescription) doc.experienceDescription = experienceDescription;
    }

    // Admin-created accounts are considered verified and do not use OTP.
    doc.isEmailVerified = true;
    await doc.save();

    res.status(201).json({
      success: true,
      user: serializeUser(doc),
    });
  })
);

// PUT /api/auth/admin/users/:id
router.put(
  '/admin/users/:id',
  protect,
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email'),
    body('role')
      .optional()
      .isIn(['student', 'teacher', 'admin'])
      .withMessage('Invalid role'),
    body('status')
      .optional()
      .isIn(['active', 'inactive'])
      .withMessage('Invalid status'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const userId = req.params.id;
    const { name, email, role, status, degree, yearsOfTeaching, experienceDescription, password } =
      req.body;

    const existingWithEmail = await User.findOne({ email, _id: { $ne: userId } });
    if (existingWithEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email is already in use by another account',
      });
    }

    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = name;
    user.email = email;
    if (role) user.role = role;
    if (status) user.status = status;

    if (password) {
      user.password = password;
    }

    if (user.role === 'teacher') {
      if (degree !== undefined) user.degree = degree;
      if (yearsOfTeaching !== undefined) user.yearsOfTeaching = Number(yearsOfTeaching);
      if (experienceDescription !== undefined)
        user.experienceDescription = experienceDescription;
    }

    await user.save();

    res.json({
      success: true,
      user: serializeUser(user),
    });
  })
);

// DELETE /api/auth/admin/users/:id
router.delete(
  '/admin/users/:id',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const userId = req.params.id;

    if (String(userId) === String(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.deleteOne();

    res.json({ success: true, message: 'User deleted successfully' });
  })
);

// GET /api/auth/admin/stats
// Returns aggregated counts for dashboard cards.
router.get(
  '/admin/stats',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const [totalUsers, totalTeachers, totalAdmins] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: 'teacher' }),
      User.countDocuments({ role: 'admin' }),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalTeachers,
        totalAdmins,
      },
    });
  })
);

export default router;