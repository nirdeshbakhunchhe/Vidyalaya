import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      default: 'student',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    avatar: {
      type: String,
      default: '',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    
    // ── Engagement Features ──────────────────────────────────────────────────
    themePreference: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
    loginStreak: {
      type: Number,
      default: 0,
    },
    lastLoginDate: {
      type: Date,
      default: null,
    },
    badges: [
      {
        badgeType: { type: String, required: true },
        name: { type: String, required: true },
        icon: { type: String },
        awardedAt: { type: Date, default: Date.now },
      }
    ],

    // ── Teacher-specific fields ──────────────────────────────────────────────
    degree: {
      type: String,
      trim: true,
      default: '',
      // e.g. "M.Sc. Computer Science", "PhD Mathematics"
    },
    yearsOfTeaching: {
      type: Number,
      min: [0, 'Years of teaching cannot be negative'],
      default: null,
    },
    experienceDescription: {
      type: String,
      trim: true,
      maxlength: [500, 'Experience description cannot exceed 500 characters'],
      default: '',
    },

    // ── OTP fields for email verification / password reset ────────────────────
    otpCode: {
      type: String,
      select: false,
    },
    otpExpiresAt: {
      type: Date,
      select: false,
    },
    otpPurpose: {
      type: String,
      enum: ['signup', 'resetPassword', 'changePassword'],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;