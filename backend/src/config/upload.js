// src/config/upload.js
const multer = require('multer');

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
  // iPhones sometimes send HEIC as octet-stream — we detect it by magic bytes in processImage
  'application/octet-stream',
];

// Use memory storage — Sharp will process the buffer and write the final WebP to disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(Object.assign(
      new Error('Invalid file type. Allowed: jpg, png, webp, gif, heic/heif.'),
      { status: 400 }
    ));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    // Accept up to 15MB raw — Sharp will compress to a fraction of this
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 15 * 1024 * 1024,
  },
});

module.exports = upload;
