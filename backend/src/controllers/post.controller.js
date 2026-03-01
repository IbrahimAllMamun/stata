// src/controllers/post.controller.js
const prisma = require('../config/database');
const { generateSlug, paginate, paginatedResponse } = require('../utils/helpers');
const fs = require('fs');

const getPosts = async (req, res, next) => {
  try {
    const { page, limit, skip } = paginate(req.query);

    const where = { published: true };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        select: {
          id: true, title: true, slug: true, cover_image: true,
          published: true, created_at: true, updated_at: true,
          admin: { select: { id: true, username: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(posts, total, page, limit) });
  } catch (err) {
    next(err);
  }
};

const getPostBySlug = async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({
      where: { slug: req.params.slug },
      include: { admin: { select: { id: true, username: true } } },
    });

    if (!post || !post.published) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
};

const createPost = async (req, res, next) => {
  try {
    const { title, content, published } = req.body;
    const slug = generateSlug(title);
    const cover_image = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : null;

    const post = await prisma.post.create({
      data: {
        title,
        slug,
        content,
        cover_image,
        published: published !== undefined ? published : true,
        created_by: req.admin.id,
      },
    });

    res.status(201).json({ success: true, message: 'Post created', data: post });
  } catch (err) {
    if (req.file) try { fs.unlinkSync(req.file.path); } catch {}
    next(err);
  }
};

const updatePost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, published } = req.body;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (published !== undefined) updateData.published = published;

    if (req.file) {
      updateData.cover_image = `/${req.file.path.replace(/\\/g, '/')}`;
      if (post.cover_image) {
        try { fs.unlinkSync(post.cover_image.replace(/^\//, '')); } catch {}
      }
    }

    const updated = await prisma.post.update({ where: { id }, data: updateData });
    res.json({ success: true, message: 'Post updated', data: updated });
  } catch (err) {
    if (req.file) try { fs.unlinkSync(req.file.path); } catch {}
    next(err);
  }
};

const deletePost = async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    if (post.cover_image) {
      try { fs.unlinkSync(post.cover_image.replace(/^\//, '')); } catch {}
    }

    await prisma.post.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
};

const togglePublish = async (req, res, next) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: req.params.id } });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const updated = await prisma.post.update({
      where: { id: req.params.id },
      data: { published: !post.published },
    });

    res.json({
      success: true,
      message: `Post ${updated.published ? 'published' : 'unpublished'}`,
      data: { id: updated.id, published: updated.published },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPosts, getPostBySlug, createPost, updatePost, deletePost, togglePublish };
