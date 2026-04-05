// models/payment.model.js
// Tracks every Khalti payment attempt for a course enrollment.
// One record is created when payment is initiated (status: 'pending'),
// and updated to 'completed' or 'failed' after Khalti verification.

import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    // The student who is paying
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // The course being paid for
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },

    // The enrollment request that was approved by the teacher.
    // We store this so we can mark it 'enrolled' after payment succeeds.
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
    },

    // Amount in NPR (e.g. 999). We store what was charged at time of payment.
    amount: {
      type: Number,
      required: true,
    },

    // Khalti's pidx — the unique payment index Khalti gives us on initiation.
    // This is the key used to look up the payment status in /verify.
    pidx: {
      type: String,
      required: true,
      unique: true,
    },

    // Khalti's transaction_id — only populated after successful verification.
    transactionId: {
      type: String,
      default: null,
    },

    // pending → payment initiated but not yet verified
    // completed → Khalti confirmed payment was successful
    // failed → Khalti confirmed payment failed/was cancelled
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },

    // Timestamp when the payment was verified as completed
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true } // createdAt = when payment was initiated
);

// Indexes for fast lookups by student/enrollment
paymentSchema.index({ student: 1 });
paymentSchema.index({ enrollment: 1 });

// Prevent OverwriteModelError on dev hot-reload
const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
export default Payment;     