// src/utils/processImage.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const HEIC_MIME_TYPES = new Set([
  'image/heic', 'image/heif',
  'image/heic-sequence', 'image/heif-sequence',
]);

function isHeicBuffer(buffer) {
  if (buffer.length < 12) return false;
  const ftyp = buffer.toString('ascii', 4, 8);
  if (ftyp !== 'ftyp') return false;
  const brand = buffer.toString('ascii', 8, 12);
  return ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand);
}

async function heicToJpeg(buffer) {
  let heicConvert;
  try { heicConvert = require('heic-convert'); }
  catch { throw new Error('HEIC upload received but heic-convert is not installed.'); }
  return Buffer.from(await heicConvert({ buffer, format: 'JPEG', quality: 1 }));
}

/**
 * Process and compress an uploaded image buffer.
 * - Supports JPEG, PNG, WebP, GIF, and HEIC/HEIF
 * - Converts everything to WebP
 * - Resizes to maxWidth/maxHeight preserving aspect ratio, never upscales
 * - Auto-rotates based on EXIF orientation, strips metadata
 *
 * @param {Buffer} buffer
 * @param {string} mimetype
 * @param {object} [opts]  { maxWidth=1200, maxHeight=1200, quality=82 }
 * @returns {Promise<string>}  absolute file path of saved WebP
 */
async function processImage(buffer, mimetype = '', opts = {}) {
  const { maxWidth = 1200, maxHeight = 1200, quality = 82 } = opts;

  const uploadDir = process.env.UPLOAD_PATH || '/tmp/uploads';
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  let workingBuffer = buffer;
  if (HEIC_MIME_TYPES.has(mimetype) || isHeicBuffer(buffer)) {
    workingBuffer = await heicToJpeg(buffer);
  }

  const outputPath = path.join(uploadDir, `${uuidv4()}.webp`);

  await sharp(workingBuffer)
    .rotate()
    .resize({ width: maxWidth, height: maxHeight, fit: 'inside', withoutEnlargement: true })
    .webp({ quality })
    .toFile(outputPath);

  return outputPath;
}

/**
 * Convert an absolute savedPath to a clean URL path for storing in DB.
 * e.g. /home/instechb/uploads/uuid.webp  →  /uploads/uuid.webp
 */
function toUrlPath(savedPath) {
  return '/uploads/' + path.basename(savedPath);
}

/**
 * Convert a stored URL path back to an absolute file path for deletion.
 * e.g. /uploads/uuid.webp  →  /home/instechb/uploads/uuid.webp
 */
function toFilePath(urlPath) {
  if (!urlPath) return null;
  const uploadDir = process.env.UPLOAD_PATH || '/tmp/uploads';
  return path.join(uploadDir, path.basename(urlPath));
}

module.exports = { processImage, toUrlPath, toFilePath };