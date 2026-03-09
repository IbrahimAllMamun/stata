// src/controllers/visitor.controller.js
const prisma = require('../config/database');

/**
 * POST /api/track
 * Records a visit. Extracts real IP from X-Forwarded-For (proxy-aware).
 */
async function trackVisitor(req, res) {
  try {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded
      ? forwarded.split(',')[0].trim()
      : req.socket?.remoteAddress || req.ip || 'unknown';

    await prisma.visitorLog.create({ data: { ip } });
    res.json({ ok: true });
  } catch {
    // Silently swallow — never break the page over analytics
    res.json({ ok: false });
  }
}

/**
 * GET /api/visitors/stats
 * Returns { today: number, lifetime: number } unique IP counts.
 * Always returns 200 — even if the table is missing, returns zeros.
 */
async function getVisitorStats(req, res) {
  try {
    const [today, lifetime] = await Promise.all([
      prisma.visitorLog.findMany({
        where: {
          visited_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
        select: { ip: true },
        distinct: ['ip'],
      }),
      prisma.visitorLog.findMany({
        select: { ip: true },
        distinct: ['ip'],
      }),
    ]);

    res.json({ today: today.length, lifetime: lifetime.length });
  } catch {
    // Table may not exist yet (migration pending) — return zeros gracefully
    res.json({ today: 0, lifetime: 0 });
  }
}

module.exports = { trackVisitor, getVisitorStats };