// src/controllers/committee.controller.js
const prisma = require('../config/database');

const getCommittees = async (req, res, next) => {
  try {
    const committees = await prisma.committee.findMany({
      orderBy: { acting_year: 'desc' },
      include: {
        members: {
          include: {
            member: {
              select: {
                id: true,
                full_name: true,
                email: true,
                batch: true,
                phone_number: true,
                alternative_phone: true,
                job_title: true,
                organisation: true,
                organisation_address: true,
                blood_group: true,
                photo_url: true,
              },
            },
          },
          orderBy: { position: 'asc' },
        },
      },
    });

    const formatted = committees.map((c) => {
      const presRow = c.members.find((m) => m.position === 'PRESIDENT');
      const gsRow = c.members.find((m) => m.position === 'GENERAL_SECRETARY');
      return {
        id: c.id,
        acting_year: c.acting_year,
        president: presRow
          ? { ...presRow.member, committee_member_id: presRow.id }
          : null,
        general_secretary: gsRow
          ? { ...gsRow.member, committee_member_id: gsRow.id }
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
  try {
    const { committee_id, member_id, position } = req.body;

    const committee = await prisma.committee.findUnique({ where: { id: committee_id } });
    if (!committee) return res.status(404).json({ success: false, message: 'Committee not found' });

    const member = await prisma.member.findUnique({ where: { id: member_id } });
    if (!member) return res.status(404).json({ success: false, message: 'Member not found' });

    // Replace any existing occupant for this position
    await prisma.committeeMember.deleteMany({ where: { committee_id, position } });

    const cm = await prisma.committeeMember.create({
      data: { committee_id, member_id, position },
    });

    res.status(201).json({ success: true, message: 'Member assigned successfully', data: cm });
  } catch (err) { next(err); }
};

const deleteCommitteeMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cm = await prisma.committeeMember.findUnique({ where: { id } });
    if (!cm) return res.status(404).json({ success: false, message: 'Committee member not found' });
    await prisma.committeeMember.delete({ where: { id } });
    res.json({ success: true, message: 'Leader removed from committee' });
  } catch (err) { next(err); }
};

const deleteCommittee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const committee = await prisma.committee.findUnique({ where: { id } });
    if (!committee) return res.status(404).json({ success: false, message: 'Committee not found' });
    await prisma.committee.delete({ where: { id } });
    res.json({ success: true, message: 'Committee deleted' });
  } catch (err) { next(err); }
};

module.exports = { getCommittees, createCommittee, assignMember, deleteCommitteeMember, deleteCommittee };