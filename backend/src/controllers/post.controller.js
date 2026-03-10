// src/controllers/post.controller.js
const prisma = require('../config/database');
const { generateSlug, paginate, paginatedResponse } = require('../utils/helpers');
const { processImage, toUrlPath, toFilePath } = require('../utils/processImage');
const fs = require('fs');

// ─── Public ───────────────────────────────────────────────────────────────────

const getPosts = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);
    const where = { status: 'APPROVED', published: true };
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where, skip, take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true, title: true, slug: true, cover_image: true,
          status: true, published: true, author_name: true, author_batch: true,
          created_at: true, updated_at: true,
          admin: { select: { id: true, username: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);
    res.json({ success: true, ...paginatedResponse(posts, total, page, limit) });
  } catch (err) { next(err); }
};

const getPostBySlug = async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({
      where: { slug: req.params.slug },
      include: { admin: { select: { id: true, username: true } } },
    });
    if (!post || post.status !== 'APPROVED' || !post.published) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.json({ success: true, data: post });
  } catch (err) { next(err); }
};

const submitPost = async (req, res, next) => {
  let savedPath = null;
  try {
    const { title, content, author_name, author_batch } = req.body;
    const slug = generateSlug(title);

    if (req.file) {
      savedPath = await processImage(req.file.buffer, req.file.mimetype, { maxWidth: 1200, maxHeight: 1200 });
    }
    const cover_image = savedPath ? toUrlPath(savedPath) : null;

    const post = await prisma.post.create({
      data: {
        title, slug, content, cover_image,
        author_name: author_name.trim(),
        author_batch: parseInt(author_batch),
        status: 'PENDING',
        published: false,
        created_by: null,
      },
    });
    res.status(201).json({ success: true, message: 'Post submitted for review', data: { id: post.id } });
  } catch (err) {
    if (savedPath) try { fs.unlinkSync(savedPath); } catch { }
    next(err);
  }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

const getAdminPosts = async (req, res, next) => {
  try {
    const { status } = req.query;
    const { page, limit, skip } = paginate(req.query);
    const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
    const where = status && validStatuses.includes(status.toUpperCase())
      ? { status: status.toUpperCase() } : {};
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where, skip, take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true, title: true, slug: true, content: true, cover_image: true,
          status: true, published: true, author_name: true, author_batch: true,
          created_at: true, updated_at: true,
          admin: { select: { id: true, username: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);
    res.json({ success: true, ...paginatedResponse(posts, total, page, limit) });
  } catch (err) { next(err); }
};

const approvePost = async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    const updated = await prisma.post.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED', published: true, created_by: req.admin.id },
    });
    res.json({ success: true, message: 'Post approved and published', data: updated });
  } catch (err) { next(err); }
};

const rejectPost = async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    const updated = await prisma.post.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED', published: false },
    });
    res.json({ success: true, message: 'Post rejected', data: updated });
  } catch (err) { next(err); }
};

const createPost = async (req, res, next) => {
  let savedPath = null;
  try {
    const { title, content, published, author_name, author_batch } = req.body;
    const slug = generateSlug(title);

    if (req.file) {
      savedPath = await processImage(req.file.buffer, req.file.mimetype, { maxWidth: 1200, maxHeight: 1200 });
    }
    const cover_image = savedPath ? toUrlPath(savedPath) : null;

    const post = await prisma.post.create({
      data: {
        title, slug, content, cover_image,
        author_name: (author_name || req.admin.username).trim(),
        author_batch: author_batch ? parseInt(author_batch) : 0,
        status: 'APPROVED',
        published: published !== undefined ? published : true,
        created_by: req.admin.id,
      },
    });
    res.status(201).json({ success: true, message: 'Post created', data: post });
  } catch (err) {
    if (savedPath) try { fs.unlinkSync(savedPath); } catch { }
    next(err);
  }
};

const updatePost = async (req, res, next) => {
  let savedPath = null;
  try {
    const { id } = req.params;
    const { title, content, published, author_name, author_batch } = req.body;
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (published !== undefined) updateData.published = published;
    if (author_name !== undefined) updateData.author_name = author_name.trim();
    if (author_batch !== undefined) updateData.author_batch = parseInt(author_batch);

    if (req.file) {
      savedPath = await processImage(req.file.buffer, req.file.mimetype, { maxWidth: 1200, maxHeight: 1200 });
      updateData.cover_image = toUrlPath(savedPath);
      if (post.cover_image) try { fs.unlinkSync(toFilePath(post.cover_image)); } catch { }
    }

    const updated = await prisma.post.update({ where: { id }, data: updateData });
    res.json({ success: true, message: 'Post updated', data: updated });
  } catch (err) {
    if (savedPath) try { fs.unlinkSync(savedPath); } catch { }
    next(err);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (post.cover_image) try { fs.unlinkSync(toFilePath(post.cover_image)); } catch { }
    await prisma.post.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) { next(err); }
};

const togglePublish = async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    const updated = await prisma.post.update({
      where: { id: req.params.id },
      data: { published: !post.published },
    });
    res.json({ success: true, message: `Post ${updated.published ? 'published' : 'unpublished'}`, data: { id: updated.id, published: updated.published } });
  } catch (err) { next(err); }
};

const getPendingPostCount = async (req, res, next) => {
  try {
    const count = await prisma.post.count({ where: { status: 'PENDING' } });
    res.json({ success: true, data: { count } });
  } catch (err) { next(err); }
};

module.exports = {
  getPosts, getPostBySlug, submitPost,
  getAdminPosts, createPost, updatePost, deletePost, togglePublish,
  approvePost, rejectPost, getPendingPostCount,
};
