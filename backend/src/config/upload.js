// src/config/upload.js
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const storage = multer.diskStorage({
  // src/config/upload.js — change destination:
  destination: (req, file, cb) => {
    const uploadPath = process.env.UPLOAD_PATH || '/tmp/uploads';  // <-- use /tmp on Render
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

// Multer 2.x: fileFilter uses a different rejection mechanism
// Return an error to reject; call cb() with no args to accept
const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(Object.assign(new Error('Invalid file type. Only jpg, jpeg, png, webp allowed.'), { status: 400 }));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 2 * 1024 * 1024, // 2MB
  },
});

module.exports = upload;
