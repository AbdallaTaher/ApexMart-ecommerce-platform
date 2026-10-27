const multer = require('multer');
const AppError = require('./appError');

/**
 * Module 02: Secure File Processing & Magic Byte Verification
 * Defends against polyglot malware, executable masquerading, and oversized asset uploads.
 */

// Permitted image MIME types
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
]);

// Maximum file size: 5MB per image asset
const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Inspects binary magic byte headers to determine true content type
 * @param {Buffer} buffer
 * @returns {string|null} Detected MIME type or null if invalid/unknown
 */
function detectImageMimeType(buffer) {
  if (!buffer || buffer.length < 12) return null;

  // 1. JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }

  // 2. PNG: 89 50 4E 47 (.PNG)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }

  // 3. GIF: GIF8 (47 49 46 38)
  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return 'image/gif';
  }

  // 4. WebP: RIFF (bytes 0-3) + WEBP (bytes 8-11)
  const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF';
  const isWebp = buffer.toString('ascii', 8, 12) === 'WEBP';
  if (isRiff && isWebp) {
    return 'image/webp';
  }

  // 5. AVIF: ftypavif or ftypmif1 (bytes 4-12)
  const ftyp = buffer.toString('ascii', 4, 12);
  if (ftyp === 'ftypavif' || ftyp === 'ftypmif1') {
    return 'image/avif';
  }

  return null;
}

// In-Memory storage: Files are buffered in RAM for cryptographic/magic byte inspection before cloud transmission
const storage = multer.memoryStorage();

/**
 * Initial Multer filter (checks extension & reported MIME type)
 */
const multerFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid file type (${file.mimetype}). Only JPEG, PNG, WebP, AVIF, and GIF image files are allowed.`,
        400
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter: multerFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

/**
 * Middleware: Enforces multi-angle product media limits
 * - Primary cover image: max 1
 * - Gallery images: max 5
 */
const uploadProductImages = upload.fields([
  { name: 'imageCover', maxCount: 1 },
  { name: 'images', maxCount: 5 },
]);

/**
 * Middleware: Single image upload (e.g., user avatar, category banner)
 * @param {string} fieldName
 */
const uploadSingleImage = (fieldName) => upload.single(fieldName);

/**
 * Post-Upload Middleware: Cryptographic Magic Byte Inspection
 * Verifies that the raw binary content actually matches an authentic image specification.
 */
const verifyImageSignatures = (req, res, next) => {
  const filesToVerify = [];

  if (req.file) {
    filesToVerify.push(req.file);
  }

  if (req.files) {
    if (Array.isArray(req.files)) {
      filesToVerify.push(...req.files);
    } else {
      // Object containing field arrays (like { imageCover: [...], images: [...] })
      Object.values(req.files).forEach((fileArray) => {
        if (Array.isArray(fileArray)) {
          filesToVerify.push(...fileArray);
        }
      });
    }
  }

  for (const file of filesToVerify) {
    const verifiedMime = detectImageMimeType(file.buffer);

    if (!verifiedMime || !ALLOWED_MIME_TYPES.has(verifiedMime)) {
      return next(
        new AppError(
          `Security Alert: File "${file.originalname}" failed binary magic byte inspection. The file content does not match an authentic image format.`,
          400
        )
      );
    }

    // Attach validated MIME type to file metadata
    file.detectedMimeType = verifiedMime;
  }

  next();
};

module.exports = {
  upload,
  uploadProductImages,
  uploadSingleImage,
  verifyImageSignatures,
  detectImageMimeType,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
};
