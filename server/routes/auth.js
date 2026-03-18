import express from 'express';
import { body, validationResult } from 'express-validator';
import asyncHandler from 'express-async-handler';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ── Multer setup for avatar uploads ─────────────────────────────────────────
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/avatars';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user._id}-${Date.now()}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
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
});

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post(
  '/register',
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
      if (degree) userData.degree = degree;
      if (yearsOfTeaching !== undefined) userData.yearsOfTeaching = Number(yearsOfTeaching);
      if (experienceDescription) userData.experienceDescription = experienceDescription;
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
      return res.status(400).json({ success: false, message: 'No account found with this email' });
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
      message: 'An OTP has been sent to your email address for password reset.',
      email: user.email,
    });
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

    const token = generateToken(user._id);
    res.json({ success: true, token, user: serializeUser(user) });
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

    // Build a publicly accessible URL (assumes Express serves /uploads statically)
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
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

// ── Admin-only user management endpoints ─────────────────────────────────────

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
