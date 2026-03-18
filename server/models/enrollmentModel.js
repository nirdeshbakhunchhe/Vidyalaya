import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
      index: true,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  }
);

// Prevent duplicate active requests per student/course (pending or approved)
enrollmentSchema.index(
  { student: 1, course: 1, status: 1 },
  { partialFilterExpression: { status: { $in: ['pending', 'approved'] } } }
);

const EnrollmentModel =
  mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);

export default EnrollmentModel;

