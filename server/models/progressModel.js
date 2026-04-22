import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    completedLessons: [
      {
        lessonTitle: { type: String, required: true },
        completedAt: { type: Date, default: Date.now },
      },
    ],
    completionPercentage: {
      type: Number,
      default: 0,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
    watchTimeLogs: {
      type: [
        {
          date: { type: String, required: true }, // Format "YYYY-MM-DD"
          timeSpent: { type: Number, default: 0 }, // In seconds
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// One progress document per user per course
progressSchema.index({ user: 1, course: 1 }, { unique: true });

const ProgressModel =
  mongoose.models.Progress || mongoose.model('Progress', progressSchema);

export default ProgressModel;
