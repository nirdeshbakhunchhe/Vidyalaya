import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'enrollment_request',
        'enrollment_approved',
        'enrolled',
        'assignment',
        'content',
        'submission'
      ],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
