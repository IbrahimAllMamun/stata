// src/controllers/committee.controller.js
const prisma = require('../config/database');
const { processImage, toUrlPath, toFilePath } = require('../utils/processImage');
const fs = require('fs');

const getCommittees = async (req, res, next) => {
  try {
    const committees = await prisma.committee.findMany({
      orderBy: { acting_year: 'desc' },
      include: {
        members: {
          include: {
            member: {
              select: {
                id: true, full_name: true, email: true,
                batch: true, job_title: true, organisation: true,
                phone_number: true,
              },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    const formatted = committees.map((c) => {
      const president = c.members.find((m) => m.position === 'PRESIDENT');
      const gs = c.members.find((m) => m.position === 'GENERAL_SECRETARY');
      return {
        id: c.id,
        acting_year: c.acting_year,
        president: president
          ? { ...president.member, image_url: president.image_url, committee_member_id: president.id }
          : null,
        general_secretary: gs
          ? { ...gs.member, image_url: gs.image_url, committee_member_id: gs.id }
          : null,
        created_at: c.created_at,
      };
    });

    res.json({ success: true, data: formatted });
  } catch (err) { next(err); }
};

const createCommittee = async (req, res, next) => {
  try {
    const { acting_year } = req.body;
    const committee = await prisma.committee.create({
      data: { acting_year: parseInt(acting_year) },
    });
    res.status(201).json({ success: true, message: 'Committee created', data: committee });
  } catch (err) { next(err); }
};

const assignMember = async (req, res, next) => {
  let savedPath = null;
  try {
    const { committee_id, member_id, position } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }

    savedPath = await processImage(req.file.buffer, req.file.mimetype, { maxWidth: 800, maxHeight: 800 });
    const image_url = toUrlPath(savedPath);

    const committee = await prisma.committee.findUnique({ where: { id: committee_id } });
    if (!committee) {
      fs.unlinkSync(savedPath);
      return res.status(404).json({ success: false, message: 'Committee not found' });
    }

    const member = await prisma.member.findUnique({ where: { id: member_id } });
    if (!member) {
      fs.unlinkSync(savedPath);
      return res.status(404).json({ success: false, message: 'Member not found' });
    }

    const existing = await prisma.committeeMember.findUnique({
      where: { committee_id_position: { committee_id, position } },
    });
    if (existing) {
      fs.unlinkSync(savedPath);
      return res.status(409).json({
        success: false,
        message: `A ${position.replace('_', ' ').toLowerCase()} already exists for this committee year`,
      });
    }

    const cm = await prisma.committeeMember.create({
      data: { committee_id, member_id, position, image_url },
    });

    res.status(201).json({ success: true, message: 'Member assigned successfully', data: cm });
  } catch (err) {
    if (savedPath) try { fs.unlinkSync(savedPath); } catch { }
    next(err);
  }
};

const deleteCommittee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const committee = await prisma.committee.findUnique({
      where: { id },
      include: { members: true },
    });
    if (!committee) {
      return res.status(404).json({ success: false, message: 'Committee not found' });
    }

    for (const m of committee.members) {
      try { fs.unlinkSync(toFilePath(m.image_url)); } catch { }
    }

    await prisma.committee.delete({ where: { id } });
    res.json({ success: true, message: 'Committee deleted' });
  } catch (err) { next(err); }
};

module.exports = { getCommittees, createCommittee, assignMember, deleteCommittee };