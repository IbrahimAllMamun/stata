// src/utils/processImage.js
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// HEIC MIME types including the octet-stream edge case iPhones sometimes send
const HEIC_MIME_TYPES = new Set([
  'image/heic',
  'image/heif',
  'image/heic-sequence',
  'image/heif-sequence',
]);

/**
 * Detect HEIC by magic bytes when MIME type is unreliable (e.g. application/octet-stream).
 * HEIC files have 'ftyp' at byte offset 4 followed by a HEIC brand identifier.
 */
function isHeicBuffer(buffer) {
  if (buffer.length < 12) return false;
  const ftyp = buffer.toString('ascii', 4, 8);
  if (ftyp !== 'ftyp') return false;
  const brand = buffer.toString('ascii', 8, 12);
  return ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand);
}

/**
 * Convert HEIC buffer → JPEG buffer using heic-convert.
 * heic-convert is a pure-JS library, no native deps required.
 */
async function heicToJpeg(buffer) {
  // Lazy-require so the app still starts if heic-convert isn't installed yet
  let heicConvert;
  try {
    heicConvert = require('heic-convert');
  } catch {
    throw new Error(
      'HEIC upload received but heic-convert is not installed. Run: npm install heic-convert'
    );
  }
  const jpegBuffer = await heicConvert({
    buffer,
    format: 'JPEG',
    quality: 1, // full quality — Sharp will compress it afterwards
  });
  return Buffer.from(jpegBuffer);
}

/**
 * Process and compress an uploaded image buffer.
 * - Supports JPEG, PNG, WebP, GIF, and HEIC/HEIF (iPhone photos)
 * - Converts everything to WebP
 * - Resizes to maxWidth/maxHeight preserving aspect ratio, never upscales
 * - Quality 82 (visually lossless, ~60–70% smaller than source)
 * - Auto-rotates based on EXIF orientation
 * - Strips all metadata
 *
 * @param {Buffer} buffer           - Raw file buffer from multer memoryStorage
 * @param {string} mimetype         - MIME type reported by multer (used for HEIC detection)
 * @param {object} [opts]
 * @param {number} [opts.maxWidth=1200]
 * @param {number} [opts.maxHeight=1200]
 * @param {number} [opts.quality=82]
 * @returns {Promise<string>}       - Absolute file path of the saved WebP
 */
async function processImage(buffer, mimetype = '', opts = {}) {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 82,
  } = opts;

  const uploadDir = process.env.UPLOAD_PATH || '/tmp/uploads';

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Convert HEIC → JPEG first if needed
  let workingBuffer = buffer;
  if (HEIC_MIME_TYPES.has(mimetype) || isHeicBuffer(buffer)) {
    workingBuffer = await heicToJpeg(buffer);
  }

  const filename = `${uuidv4()}.webp`;
  const outputPath = path.join(uploadDir, filename);

  await sharp(workingBuffer)
    .rotate()                       // auto-correct EXIF orientation
    .resize({
      width: maxWidth,
      height: maxHeight,
      fit: 'inside',                // preserve aspect ratio, never upscale
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toFile(outputPath);

  return outputPath;
}

module.exports = processImage;
