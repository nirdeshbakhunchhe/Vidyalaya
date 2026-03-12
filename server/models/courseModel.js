import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a course title'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a course description'],
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please provide a category'],
      enum: ['programming', 'design', 'science', 'mathematics', 'language', 'business', 'arts'],
    },
    level: {
      type: String,
      required: [true, 'Please provide a difficulty level'],
      enum: ['beginner', 'intermediate', 'advanced'],
    },
    instructor: {
      type: String,
      required: [true, 'Please provide an instructor name'],
      trim: true,
    },
    duration: {
      type: String,
      required: [true, 'Please provide the course duration'],
      // e.g. "8 weeks"
    },
    image: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: 'from-blue-500 to-cyan-500',
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    enrollmentCount: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for full-text search and filtering
courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ category: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ rating: -1 });

// Prevent OverwriteModelError on hot-reload (common in dev)
const CourseModel = mongoose.models.Course || mongoose.model('Course', courseSchema);

export default CourseModel;