const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Tiêu đề là bắt buộc'],
      trim: true,
    },
    subtitle: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Nội dung là bắt buộc'],
    },
    summary: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      trim: true,
    },
    coverImage: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    views: {
      type: Number,
      default: 0,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model('Post', postSchema);
