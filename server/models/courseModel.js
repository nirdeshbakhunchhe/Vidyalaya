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
    // Cloudinary `public_id` for the thumbnail image.
    imagePublicId: {
      type: String,
      default: '',
    },

    // Uploaded course videos (Cloudinary `resource_type: "video"`).
    videos: [
      {
        title: { type: String, required: true, trim: true, maxlength: 200 },
        url: { type: String, required: true },
        public_id: { type: String, required: true },
      },
    ],
    // Course price in NPR. 0 means free course.
    price: {
      type: Number,
      default: 0,
      min: 0,
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

    // Curriculum used by CourseDetail.jsx.
    // We generate/update this automatically when teachers upload videos
    // (teacher can refine it later).
    curriculum: [
      {
        section: {
          type: String,
          required: true,
          trim: true,
        },
        lessons: [
          {
            title: {
              type: String,
              required: true,
              trim: true,
              maxlength: 200,
            },
            duration: {
              type: String,
              default: '',
            },
            free: {
              type: Boolean,
              default: false,
            },
          },
        ],
      },
    ],
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