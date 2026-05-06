// src/controllers/event.controller.js
const prisma = require('../config/database');
const { paginate, paginatedResponse, generateSlug } = require('../utils/helpers');
const { processImage, toUrlPath, toFilePath } = require('../utils/processImage');
const fs = require('fs');

const getEvents = async (req, res, next) => {
  try {
    const { type } = req.query;
    const { page, limit, skip } = paginate(req.query);
    const now = new Date();

    let where = {};
    let orderBy = {};

    if (type === 'upcoming') {
      where.event_date = { gte: now };
      orderBy = { event_date: 'asc' };
    } else if (type === 'past') {
      where.event_date = { lt: now };
      orderBy = { event_date: 'desc' };
    } else {
      orderBy = { event_date: 'desc' };
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where, skip, take: limit, orderBy,
        include: { admin: { select: { id: true, username: true } } },
      }),
      prisma.event.count({ where }),
    ]);

    res.json({ success: true, ...paginatedResponse(events, total, page, limit) });
  } catch (err) { next(err); }
};

const getEventBySlug = async (req, res, next) => {
  try {
    const event = await prisma.event.findUnique({
      where: { slug: req.params.slug },
      include: { admin: { select: { id: true, username: true } } },
    });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (err) { next(err); }
};

const createEvent = async (req, res, next) => {
  let savedPath = null;
  try {
    const { title, description, event_date, location } = req.body;
    const eventDate = new Date(event_date);
    const is_upcoming = eventDate >= new Date();

    let slug = generateSlug(title);
    const exists = await prisma.event.findUnique({ where: { slug } });
    if (exists) slug = generateSlug(title);

    if (req.file) {
      savedPath = await processImage(req.file.buffer, req.file.mimetype, { maxWidth: 1400, maxHeight: 900 });
    }
    const banner_image = savedPath ? toUrlPath(savedPath) : null;

    const event = await prisma.event.create({
      data: {
        title, slug,
        description: description || null,
        event_date: eventDate,
        location: location || null,
        banner_image,
        is_upcoming,
        created_by: req.admin.id,
      },
    });

    res.status(201).json({ success: true, message: 'Event created', data: event });
  } catch (err) {
    if (savedPath) try { fs.unlinkSync(savedPath); } catch { }
    next(err);
  }
};

const updateEvent = async (req, res, next) => {
  let savedPath = null;
  try {
    const { id } = req.params;
    const { title, description, event_date, location } = req.body;

    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (event_date !== undefined) {
      const ed = new Date(event_date);
      updateData.event_date = ed;
      updateData.is_upcoming = ed >= new Date();
    }

    if (req.file) {
      savedPath = await processImage(req.file.buffer, req.file.mimetype, { maxWidth: 1400, maxHeight: 900 });
      updateData.banner_image = toUrlPath(savedPath);
      if (event.banner_image) try { fs.unlinkSync(toFilePath(event.banner_image)); } catch { }
    }

    const updated = await prisma.event.update({ where: { id }, data: updateData });
    res.json({ success: true, message: 'Event updated', data: updated });
  } catch (err) {
    if (savedPath) try { fs.unlinkSync(savedPath); } catch { }
    next(err);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.banner_image) try { fs.unlinkSync(toFilePath(event.banner_image)); } catch { }
    await prisma.event.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) { next(err); }
};

module.exports = { getEvents, getEventBySlug, createEvent, updateEvent, deleteEvent };
