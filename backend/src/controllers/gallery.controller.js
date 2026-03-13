// src/controllers/gallery.controller.js
const prisma = require('../config/database');
const { processImage, toUrlPath, toFilePath } = require('../utils/processImage');
const fs = require('fs');

// Helper: group photos by date → subject
function groupPhotos(photos) {
  const byDate = {};
  for (const photo of photos) {
    const dateKey = photo.moment_date.toISOString().slice(0, 10);
    if (!byDate[dateKey]) byDate[dateKey] = { date: dateKey, subjects: {} };
    if (!byDate[dateKey].subjects[photo.subject]) {
      byDate[dateKey].subjects[photo.subject] = [];
    }
    byDate[dateKey].subjects[photo.subject].push(photo);
  }
  return Object.values(byDate)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(d => ({
      date: d.date,
      subjects: Object.entries(d.subjects)
        .map(([subject, photos]) => ({ subject, photos }))
        .sort((a, b) => new Date(b.photos[0].created_at) - new Date(a.photos[0].created_at)),
    }));
}

const getGallery = async (req, res, next) => {
  try {
    const { from, to, subject } = req.query;
    const where = {};
    if (from || to) {
      where.moment_date = {};
      if (from) where.moment_date.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.moment_date.lte = toDate;
      }
    }
    if (subject) where.subject = subject;

    const photos = await prisma.galleryPhoto.findMany({
      where,
      orderBy: [{ moment_date: 'desc' }, { created_at: 'desc' }],
      select: { id: true, image_url: true, subject: true, moment_date: true, created_at: true },
    });

    const data = groupPhotos(photos);
    res.json({ success: true, data, total: photos.length });
  } catch (err) { next(err); }
};

const getGalleryDates = async (req, res, next) => {
  try {
    const photos = await prisma.galleryPhoto.findMany({
      select: { moment_date: true, subject: true },
      orderBy: { moment_date: 'desc' },
    });

    const dateMap = {};
    for (const p of photos) {
      const date = p.moment_date.toISOString().slice(0, 10);
      if (!dateMap[date]) dateMap[date] = new Set();
      dateMap[date].add(p.subject);
    }

    const data = Object.entries(dateMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, subjects]) => ({ date, subjects: Array.from(subjects) }));

    res.json({ success: true, data });
  } catch (err) { next(err); }
};

const getSubjectsByDate = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'date is required' });

    const start = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const photos = await prisma.galleryPhoto.findMany({
      where: { moment_date: { gte: start, lte: end } },
      select: { subject: true },
      distinct: ['subject'],
    });

    res.json({ success: true, data: photos.map(p => p.subject) });
  } catch (err) { next(err); }
};

const uploadPhotos = async (req, res, next) => {
  const savedPaths = [];
  try {
    const { moment_date, subject } = req.body;
    if (!moment_date) return res.status(400).json({ success: false, message: 'moment_date is required' });
    if (!subject || !subject.trim()) return res.status(400).json({ success: false, message: 'subject is required' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: 'At least one image is required' });

    const momentDateObj = new Date(moment_date);
    const subjectTrimmed = subject.trim();

    const processedPaths = await Promise.all(
      req.files.map(file => processImage(file.buffer, file.mimetype, { maxWidth: 1400, maxHeight: 1400 }))
    );
    savedPaths.push(...processedPaths);

    const photoData = processedPaths.map((savedPath) => ({
      image_url: toUrlPath(savedPath),
      subject: subjectTrimmed,
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
    for (const p of savedPaths) { try { fs.unlinkSync(p); } catch {} }
    next(err);
  }
};

const deletePhoto = async (req, res, next) => {
  try {
    const photo = await prisma.galleryPhoto.findUnique({ where: { id: req.params.id } });
    if (!photo) return res.status(404).json({ success: false, message: 'Photo not found' });
    if (photo.image_url) try { fs.unlinkSync(toFilePath(photo.image_url)); } catch {}
    await prisma.galleryPhoto.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Photo deleted' });
  } catch (err) { next(err); }
};

const getAdminGallery = async (req, res, next) => {
  try {
    const photos = await prisma.galleryPhoto.findMany({
      orderBy: [{ moment_date: 'desc' }, { created_at: 'desc' }],
      select: {
        id: true, image_url: true, subject: true, moment_date: true, created_at: true,
        admin: { select: { id: true, username: true } },
      },
    });

    const data = groupPhotos(photos);
    res.json({ success: true, data, total: photos.length });
  } catch (err) { next(err); }
};

module.exports = { getGallery, getGalleryDates, getSubjectsByDate, uploadPhotos, deletePhoto, getAdminGallery };
