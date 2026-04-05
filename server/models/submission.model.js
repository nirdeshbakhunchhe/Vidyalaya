import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    status: {
      type: String,
      enum: ['pending', 'submitted', 'graded'],
      default: 'submitted',
      index: true,
    },

    // For quiz submissions
    quizAnswers: {
      // [{ questionId, selectedIndex }]
      type: [
        {
          questionId: { type: String, required: true },
          selectedIndex: { type: Number, required: true },
        },
      ],
      default: [],
    },

    score: { type: Number, default: null }, // points earned
    correctCount: { type: Number, default: null },
    totalQuestions: { type: Number, default: null },
    feedback: { type: String, default: '' },

    // For project/file submissions
    file: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
      originalName: { type: String, default: '' },
      mimetype: { type: String, default: '' },
    },

    gradedAt: { type: Date, default: null },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One submission per student per assignment (MVP).
submissionSchema.index({ student: 1, assignment: 1 }, { unique: true });

const SubmissionModel =
  mongoose.models.Submission || mongoose.model('Submission', submissionSchema);

export default SubmissionModel;
