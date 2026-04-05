import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['user', 'ai'],
      required: true,
    },
    content: {
      type: String,
      required: true,
      default: '',
    },
    files: [
      {
        // "image" vs "file" (derived from mimetype)
        kind: {
          type: String,
          enum: ['image', 'file'],
          default: 'file',
        },
        name: {
          type: String,
          default: '',
        },
        mimetype: {
          type: String,
          default: '',
        },
        size: {
          type: Number,
          default: 0,
        },
      },
    ],
    // Keep per-message timestamps for ordering.
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const chatHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      // "general", "mathematics", "programming", etc.
      type: String,
      required: true,
      index: true,
    },
    messages: {
      type: [chatMessageSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// One conversation document per user+subject.
chatHistorySchema.index({ user: 1, subject: 1 }, { unique: true });

const ChatHistoryModel =
  mongoose.models.ChatHistory || mongoose.model('ChatHistory', chatHistorySchema);

export default ChatHistoryModel;
