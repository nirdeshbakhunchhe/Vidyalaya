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
      // pending  → student requested; waiting teacher decision
      // approved → teacher approved; for PAID courses this means "ready to pay"
      // rejected → teacher rejected
      // enrolled → student is fully enrolled (free approval OR paid+verified)
      enum: ['pending', 'approved', 'rejected', 'enrolled'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      // not_required → free course (no payment step)
      // pending      → paid course; not yet verified as paid
      // paid         → paid course; verified as completed
      // failed       → paid course; verification returned cancel/expired/refunded
      enum: ['not_required', 'pending', 'paid', 'failed'],
      default: 'not_required',
      index: true,
    },
    // Filled only after successful payment verification (paid courses)
    paidAt: { type: Date, default: null },
    transactionId: { type: String, default: null },
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
