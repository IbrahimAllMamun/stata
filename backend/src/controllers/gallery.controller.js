// src/controllers/gallery.controller.js
const prisma = require('../config/database');
const processImage = require('../utils/processImage');
const fs = require('fs');

// ─── Public ───────────────────────────────────────────────────────────────────

/**
 * GET /api/gallery
 * Returns all photos grouped by moment_date (YYYY-MM-DD),
 * sorted newest date first, photos within each group sorted by created_at.
 * Optional ?from=YYYY-MM-DD&to=YYYY-MM-DD for date filtering.
 */
const getGallery = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    const where = {};
    if (from || to) {
      where.moment_date = {};
      if (from) where.moment_date.gte = new Date(from);
      if (to) {
        // Include all of the `to` day
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.moment_date.lte = toDate;
      }
    }

    const photos = await prisma.galleryPhoto.findMany({
      where,
      orderBy: [{ moment_date: 'desc' }, { created_at: 'asc' }],
      select: {
        id: true,
        image_url: true,
        caption: true,
        moment_date: true,
        created_at: true,
      },
    });

    // Group by moment_date (date string YYYY-MM-DD)
    const grouped = {};
    for (const photo of photos) {
      const dateKey = photo.moment_date.toISOString().slice(0, 10);
      if (!grouped[dateKey]) grouped[dateKey] = { date: dateKey, photos: [] };
      grouped[dateKey].photos.push(photo);
    }

    // Return as sorted array (newest first)
    const data = Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));

    res.json({ success: true, data, total: photos.length });
  } catch (err) { next(err); }
};

/**
 * GET /api/gallery/dates
 * Returns all distinct moment_dates that have photos — for date filter UI.
 */
const getGalleryDates = async (req, res, next) => {
  try {
    const photos = await prisma.galleryPhoto.findMany({
      select: { moment_date: true },
      distinct: ['moment_date'],
      orderBy: { moment_date: 'desc' },
    });
    const dates = photos.map(p => p.moment_date.toISOString().slice(0, 10));
    res.json({ success: true, data: dates });
  } catch (err) { next(err); }
};

// ─── Admin ────────────────────────────────────────────────────────────────────

/**
 * POST /api/admin/gallery
 * Upload up to 10 images at once. Body: moment_date (ISO string), optional captions[].
 * Files: images[] (multer array, max 10)
 */
const uploadPhotos = async (req, res, next) => {
  const savedPaths = [];
  try {
    const { moment_date, captions } = req.body;
    if (!moment_date) {
      return res.status(400).json({ success: false, message: 'moment_date is required' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one image is required' });
    }

    const parsedCaptions = captions
      ? (Array.isArray(captions) ? captions : [captions])
      : [];

    const momentDateObj = new Date(moment_date);

    // Process all images in parallel
    const processedPaths = await Promise.all(
      req.files.map(file => processImage(file.buffer, file.mimetype, { maxWidth: 1400, maxHeight: 1400 }))
    );
    savedPaths.push(...processedPaths);

    // Build DB records
    const photoData = processedPaths.map((savedPath, idx) => ({
      image_url: '/' + savedPath.replace(/^\//, '').replace(/\\/g, '/'),
      caption: parsedCaptions[idx]?.trim() || null,
      moment_date: momentDateObj,
      created_by: req.admin.id,
    }));

    await prisma.galleryPhoto.createMany({ data: photoData });

    res.status(201).json({
      success: true,
      message: `${photoData.length} photo${photoData.length > 1 ? 's' : ''} uploaded`,
      data: { count: photoData.length },
    });
  } catch (err) {
    // Clean up any saved files on error
    for (const p of savedPaths) {
      try { fs.unlinkSync(p); } catch {}
    }
    next(err);
  }
};

/**
 * DELETE /api/admin/gallery/:id
 */
const deletePhoto = async (req, res, next) => {
  try {
    const photo = await prisma.galleryPhoto.findUnique({ where: { id: req.params.id } });
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });

    // Delete file from disk
    if (photo.image_url) {
      try { fs.unlinkSync(photo.image_url.replace(/^\//, '')); } catch {}
    }

    await prisma.galleryPhoto.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Photo deleted' });
  } catch (err) { next(err); }
};

/**
 * GET /api/admin/gallery
 * Admin view — same as public but includes created_by info.
 */
const getAdminGallery = async (req, res, next) => {
  try {
    const photos = await prisma.galleryPhoto.findMany({
      orderBy: [{ moment_date: 'desc' }, { created_at: 'asc' }],
      select: {
        id: true,
        image_url: true,
        caption: true,
        moment_date: true,
        created_at: true,
        admin: { select: { id: true, username: true } },
      },
    });

    const grouped = {};
    for (const photo of photos) {
      const dateKey = photo.moment_date.toISOString().slice(0, 10);
      if (!grouped[dateKey]) grouped[dateKey] = { date: dateKey, photos: [] };
      grouped[dateKey].photos.push(photo);
    }

    const data = Object.values(grouped).sort((a, b) => b.date.localeCompare(a.date));
    res.json({ success: true, data, total: photos.length });
  } catch (err) { next(err); }
};

module.exports = { getGallery, getGalleryDates, uploadPhotos, deletePhoto, getAdminGallery };
