import mongoose from 'mongoose';

const quizQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 1000 },
    options: { type: [String], required: true, validate: [(v) => v.length >= 2, 'At least 2 options required'] },
    // Index into `options`
    correctAnswer: { type: Number, required: true, min: 0 },
  },
  { _id: true, timestamps: false }
);

const assignmentSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
    type: { type: String, enum: ['quiz', 'project'], required: true, index: true },

    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', trim: true, maxlength: 2000 },

    dueAt: { type: Date, default: null },
    duration: { type: String, default: '' }, // display only (e.g. "30 minutes")
    points: { type: Number, default: 0, min: 0 },

    // Quiz-specific
    questions: { type: [quizQuestionSchema], default: [] },

    // Project-specific
    requirements: { type: [String], default: [] },

    // Teacher sets publish immediately in MVP
    isPublished: { type: Boolean, default: true, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

const AssignmentModel =
  mongoose.models.Assignment || mongoose.model('Assignment', assignmentSchema);

export default AssignmentModel;
