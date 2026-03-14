// src/index.js
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// ── File Logging ──────────────────────────────────────────────────────────────
const LOG_DIR = '/home/stataisr/logs';
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const COMBINED_LOG = path.join(LOG_DIR, 'combined.log');
const MAX_COMBINED = 2000;

const timestamp = () => {
  const now = new Date(Date.now() + 6 * 60 * 60 * 1000); // UTC+6 (Dhaka)
  return now.toISOString().replace('T', ' ').substring(0, 19);
};

function writeLog(line) {
  try {
    let lines = [];
    if (fs.existsSync(COMBINED_LOG)) {
      const content = fs.readFileSync(COMBINED_LOG, 'utf8');
      lines = content.split('\n').filter(function (l) { return l.trim() !== ''; });
    }
    lines.push(line.trimEnd());
    if (lines.length > MAX_COMBINED) lines = lines.slice(-MAX_COMBINED);
    fs.writeFileSync(COMBINED_LOG, lines.join('\n') + '\n');
  } catch (e) { /* ignore */ }
}

const _log = console.log.bind(console);
const _err = console.error.bind(console);
const _warn = console.warn.bind(console);

console.log = (...args) => {
  writeLog(`[${timestamp()}] [INFO]  ${args.join(' ')}`);
  _log(...args);
};
console.error = (...args) => {
  writeLog(`[${timestamp()}] [ERROR] ${args.join(' ')}`);
  _err(...args);
};
console.warn = (...args) => {
  writeLog(`[${timestamp()}] [WARN]  ${args.join(' ')}`);
  _warn(...args);
};

process.on('uncaughtException', (err) => {
  if (err.code === 'EPIPE') return;
  writeLog(`[${timestamp()}] [ERROR] UncaughtException: ${err.stack || err}`);
  _err('UncaughtException:', err.stack || err);
});
process.on('unhandledRejection', (err) => {
  writeLog(`[${timestamp()}] [ERROR] UnhandledRejection: ${err}`);
  _err('UnhandledRejection:', err);
});
// ─────────────────────────────────────────────────────────────────────────────

const { errorHandler, notFound } = require('./middlewares/error');
const publicRoutes = require('./routes/public.routes');
const adminRoutes = require('./routes/admin.routes');
const asplRoutes = require('./aspl/routes/aspl.routes');

const app = express();

// Trust reverse proxy (cPanel/Nginx/Apache) — required for express-rate-limit
app.set('trust proxy', 1);
// CORS — allow frontend origin
const allowedOrigins = [
  ...(process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean),
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, curl, mobile apps)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Security headers (after cors so cors headers aren't overridden)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow /uploads images to load
}));

// Rate limiting (global)
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static uploads — served with cross-origin policy so images load in browser
const uploadsDir = process.env.UPLOAD_PATH || '/tmp/uploads';
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(uploadsDir));

app.use('/tmp/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(uploadsDir));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'STATA Backend API is running',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
  });
});

// Routes
app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/aspl', asplRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`\n🎓 STATA Backend running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log(`🔒 Admin: http://localhost:${PORT}/api/admin`);
  console.log(`❤️  Health: http://localhost:${PORT}/health\n`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the existing process first (fuser -k ${PORT}/tcp), then restart.`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

module.exports = app;