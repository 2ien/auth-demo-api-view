const { createPostSchema } = require('../middlewares/validator');
const Post = require('../models/postsModel');
const mongoose = require('mongoose');

// Lấy danh sách bài viết (phân trang)
exports.getPosts = async (req, res) => {
  const { page = 1 } = req.query;
  const postsPerPage = 10;

  try {
    const pageNum = parseInt(page) > 1 ? parseInt(page) - 1 : 0;

    const result = await Post.find({ status: 'published' })
      .sort({ publishedAt: -1 })
      .skip(pageNum * postsPerPage)
      .limit(postsPerPage)
      .populate({ path: 'author', select: 'email name' });

    res.status(200).json({ success: true, message: 'List of posts', data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Lấy bài viết đơn lẻ
exports.singlePost = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid post ID' });
  }

  try {
    const post = await Post.findById(id).populate({ path: 'author', select: 'email name' });
    if (!post || post.status !== 'published') {
      return res.status(404).json({ success: false, message: 'Post not found or not published' });
    }

    post.views = (post.views || 0) + 1;
    await post.save();

    res.status(200).json({ success: true, message: 'Post detail', data: post });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Tạo bài viết mới
exports.createPost = async (req, res) => {
  const {
    title, subtitle, content, summary, tags, category, coverImage, status, publishedAt,
  } = req.body;

  const userId = req.user.id;

  try {
    const { error } = createPostSchema.validate({ title, content, userId, status });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const newPost = await Post.create({
      title,
      subtitle,
      content,
      summary,
      tags,
      category,
      coverImage,
      status: status || 'draft',
      publishedAt: status === 'published' ? (publishedAt || new Date()) : null,
      author: userId,
    });

    res.status(201).json({ success: true, message: 'Post created', data: newPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Cập nhật bài viết
exports.updatePost = async (req, res) => {
  const { id } = req.params;
  const {
    title, subtitle, content, summary, tags, category, coverImage, status, publishedAt,
  } = req.body;

  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid post ID' });
  }

  try {
    const { error } = createPostSchema.validate({ title, content, userId, status });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'You are not the author' });
    }

    Object.assign(post, {
      title: title || post.title,
      subtitle: subtitle || post.subtitle,
      content: content || post.content,
      summary: summary || post.summary,
      tags: tags || post.tags,
      category: category || post.category,
      coverImage: coverImage || post.coverImage,
      status: status || post.status,
      publishedAt: status === 'published' ? (publishedAt || new Date()) : post.publishedAt,
    });

    const result = await post.save();
    res.status(200).json({ success: true, message: 'Post updated', data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Xóa bài viết
exports.deletePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid post ID' });
  }

  try {
    const post = await Post.findById(id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.author.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'You are not the author' });
    }

    await post.deleteOne();

    res.status(200).json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
