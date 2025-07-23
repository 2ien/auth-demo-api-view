const { createPostSchema } = require('../middlewares/validator');
const Post = require('../models/postsModel');
const mongoose = require('mongoose');

// Lấy danh sách bài viết, phân trang
exports.getPosts = async (req, res) => {
  const { page } = req.query;
  const postsPerPage = 10;

  try {
    const pageNum = (page && page > 1) ? page - 1 : 0;

    const result = await Post.find({ status: 'published' })  // chỉ lấy bài đã xuất bản
      .sort({ publishedAt: -1 })
      .skip(pageNum * postsPerPage)
      .limit(postsPerPage)
      .populate({ path: 'author', select: 'email name' });

    res.status(200).json({ success: true, message: 'posts', data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Lấy bài viết đơn lẻ theo param id
exports.singlePost = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid post ID' });
  }

  try {
    const existingPost = await Post.findById(id).populate({ path: 'author', select: 'email name' });
    if (!existingPost || existingPost.status !== 'published') {
      return res.status(404).json({ success: false, message: 'Post unavailable' });
    }

    // Tăng views mỗi lần xem
    existingPost.views = (existingPost.views || 0) + 1;
    await existingPost.save();

    res.status(200).json({ success: true, message: 'single post', data: existingPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Tạo bài viết mới
exports.createPost = async (req, res) => {
  const {
    title,
    subtitle,
    content,
    summary,
    tags,
    category,
    coverImage,
    status,
    publishedAt,
  } = req.body;

  const { userId } = req.user.id;

  try {
    const { error } = createPostSchema.validate({
      title,
      content,
      userId,
      status,
    });

    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const postData = {
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
    };

    const result = await Post.create(postData);

    res.status(201).json({ success: true, message: 'created', data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Cập nhật bài viết theo param id
exports.updatePost = async (req, res) => {
  const { id } = req.params;
  const {
    title,
    subtitle,
    content,
    summary,
    tags,
    category,
    coverImage,
    status,
    publishedAt,
  } = req.body;

  const { userId } = req.user;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid post ID' });
  }

  try {
    const { error } = createPostSchema.validate({
      title,
      content,
      userId,
      status,
    });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const existingPost = await Post.findById(id);
    if (!existingPost) {
      return res.status(404).json({ success: false, message: 'Post unavailable' });
    }

    if (existingPost.author.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    existingPost.title = title || existingPost.title;
    existingPost.subtitle = subtitle || existingPost.subtitle;
    existingPost.content = content || existingPost.content;
    existingPost.summary = summary || existingPost.summary;
    existingPost.tags = tags || existingPost.tags;
    existingPost.category = category || existingPost.category;
    existingPost.coverImage = coverImage || existingPost.coverImage;
    existingPost.status = status || existingPost.status;
    existingPost.publishedAt = status === 'published' ? (publishedAt || new Date()) : existingPost.publishedAt;

    const result = await existingPost.save();
    res.status(200).json({ success: true, message: 'Updated', data: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Xóa bài viết theo param id
exports.deletePost = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // hoặc req.user._id

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid post ID' });
  }

  try {
    const existingPost = await Post.findById(id);
    if (!existingPost) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (existingPost.author.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await Post.deleteOne({ _id: id });

    // Nếu xóa bằng form và muốn redirect về trang posts:
    if (req.headers.accept && req.headers.accept.includes('html')) {
      return res.redirect('/posts');
    }

    // Nếu xóa bằng API gọi fetch/ajax trả về JSON:
    res.status(200).json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

