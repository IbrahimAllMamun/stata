// src/middlewares/memberAuth.js
// Unified member auth middleware — accepts tokens for any role: member, mod, admin
const jwt = require('jsonwebtoken');

// Accepts any logged-in member (member, mod, or admin)
const authenticateMember = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Must be a member-table token (has email field), not old Admin table token
    if (!decoded.email) {
      return res.status(403).json({ success: false, message: 'Member login required.' });
    }
    req.member = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// Requires admin or mod role from member table
const requireMemberRole = (...roles) => (req, res, next) => {
  if (!req.member) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  if (!roles.includes(req.member.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions.' });
  }
  next();
};

module.exports = { authenticateMember, requireMemberRole };
