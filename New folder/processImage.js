// src/utils/processImage.js
// Uses Jimp (pure JS, no native deps) instead of sharp — works on any host.
const path = require('path');
const fs   = require('fs');
const { v4: uuidv4 } = require('uuid');

const HEIC_MIME_TYPES = new Set([
  'image/heic', 'image/heif',
  'image/heic-sequence', 'image/heif-sequence',
]);

function isHeicBuffer(buf) {
  if (buf.length < 12) return false;
  return buf.toString('ascii', 4, 8) === 'ftyp' &&
    ['heic','heix','hevc','hevx','mif1','msf1'].includes(buf.toString('ascii', 8, 12));
}

async function heicToJpeg(buffer) {
  const heicConvert = require('heic-convert');
  return Buffer.from(await heicConvert({ buffer, format: 'JPEG', quality: 1 }));
}

/**
 * Process and compress an uploaded image using Jimp (pure JS, no native binaries).
 * @returns {Promise<string>} absolute file path of saved image
 */
async function processImage(buffer, mimetype = '', opts = {}) {
  const { maxWidth = 1200, maxHeight = 1200, quality = 82 } = opts;
  const uploadDir = process.env.UPLOAD_PATH || '/tmp/uploads';
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  let buf = buffer;
  if (HEIC_MIME_TYPES.has(mimetype) || isHeicBuffer(buf)) buf = await heicToJpeg(buf);

  const Jimp = require('jimp');
  const image = await Jimp.read(buf);
  if (image.getWidth() > maxWidth || image.getHeight() > maxHeight) {
    image.scaleToFit(maxWidth, maxHeight);
  }
  image.quality(quality);

  const outputPath = path.join(uploadDir, `${uuidv4()}.jpg`);
  await image.writeAsync(outputPath);
  return outputPath;
}

/**
 * Convert an absolute savedPath from processImage() to a clean URL path.
 * e.g. /home/instechb/uploads/uuid.jpg  →  /uploads/uuid.jpg
 *      uploads/uuid.jpg                  →  /uploads/uuid.jpg
 */
function toUrlPath(savedPath) {
  const uploadDir = process.env.UPLOAD_PATH || '/tmp/uploads';
  // Strip the upload directory prefix to get just the filename
  const filename = path.basename(savedPath);
  return '/uploads/' + filename;
}

/**
 * Convert a stored URL path back to an absolute file path for deletion.
 * e.g. /uploads/uuid.jpg  →  /home/instechb/uploads/uuid.jpg
 */
function toFilePath(urlPath) {
  if (!urlPath) return null;
  const uploadDir = process.env.UPLOAD_PATH || '/tmp/uploads';
  const filename = path.basename(urlPath);
  return path.join(uploadDir, filename);
}

module.exports = { processImage, toUrlPath, toFilePath };
