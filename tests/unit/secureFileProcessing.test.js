import { describe, it, expect, vi } from 'vitest';
const {
  detectImageMimeType,
  verifyImageSignatures,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
} = require('../../backend/utils/uploadMiddleware');
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require('../../backend/utils/cloudinary');

describe('Module 02: Secure File Processing & Magic Byte Verification', () => {
  // Helper to construct mock image buffers
  const createMockJpegBuffer = () => Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
  const createMockPngBuffer = () => Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
  const createMockGifBuffer = () => Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00]);
  const createMockWebpBuffer = () => {
    const buf = Buffer.alloc(16);
    buf.write('RIFF', 0, 4, 'ascii');
    buf.writeUInt32LE(8, 4);
    buf.write('WEBP', 8, 4, 'ascii');
    return buf;
  };
  const createMockAvifBuffer = () => {
    const buf = Buffer.alloc(16);
    buf.write('....ftypavif....', 0, 16, 'ascii');
    return buf;
  };

  describe('Cryptographic Magic Byte Detection (detectImageMimeType)', () => {
    it('should correctly identify JPEG files by magic bytes', () => {
      const mime = detectImageMimeType(createMockJpegBuffer());
      expect(mime).toBe('image/jpeg');
    });

    it('should correctly identify PNG files by magic bytes', () => {
      const mime = detectImageMimeType(createMockPngBuffer());
      expect(mime).toBe('image/png');
    });

    it('should correctly identify GIF files by magic bytes', () => {
      const mime = detectImageMimeType(createMockGifBuffer());
      expect(mime).toBe('image/gif');
    });

    it('should correctly identify WebP files by magic bytes', () => {
      const mime = detectImageMimeType(createMockWebpBuffer());
      expect(mime).toBe('image/webp');
    });

    it('should correctly identify AVIF files by magic bytes', () => {
      const mime = detectImageMimeType(createMockAvifBuffer());
      expect(mime).toBe('image/avif');
    });

    it('should reject fake image files with malicious script content (Polyglot Malware Defense)', () => {
      // PHP / Bash script disguised with .jpg extension
      const maliciousBuffer = Buffer.from('<?php echo "HACKED"; system($_GET["cmd"]); ?>');
      const mime = detectImageMimeType(maliciousBuffer);
      expect(mime).toBeNull();
    });

    it('should return null for empty or truncated buffers (<12 bytes)', () => {
      expect(detectImageMimeType(Buffer.from([]))).toBeNull();
      expect(detectImageMimeType(Buffer.from([0xff, 0xd8]))).toBeNull();
      expect(detectImageMimeType(null)).toBeNull();
    });
  });

  describe('verifyImageSignatures Middleware', () => {
    it('should allow valid image uploads to proceed to next()', () => {
      const req = {
        files: {
          imageCover: [
            {
              originalname: 'cover.jpg',
              mimetype: 'image/jpeg',
              buffer: createMockJpegBuffer(),
            },
          ],
          images: [
            {
              originalname: 'side.png',
              mimetype: 'image/png',
              buffer: createMockPngBuffer(),
            },
          ],
        },
      };

      const next = vi.fn();
      verifyImageSignatures(req, {}, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.files.imageCover[0].detectedMimeType).toBe('image/jpeg');
      expect(req.files.images[0].detectedMimeType).toBe('image/png');
    });

    it('should block spoofed image files with 400 AppError', () => {
      const req = {
        files: {
          imageCover: [
            {
              originalname: 'trojan_masquerading_as_photo.jpg',
              mimetype: 'image/jpeg',
              buffer: Buffer.from('MZ\x90\x00\x03\x00\x00\x00WindowsExecutablePayload'),
            },
          ],
        },
      };

      const next = vi.fn();
      verifyImageSignatures(req, {}, next);

      expect(next).toHaveBeenCalled();
      const error = next.mock.calls[0][0];
      expect(error).toBeDefined();
      expect(error.statusCode).toBe(400);
      expect(error.message).toContain('failed binary magic byte inspection');
    });
  });

  describe('Cloudinary Media Storage Utility', () => {
    it('should upload image buffer and return webp optimized object', async () => {
      const buffer = createMockJpegBuffer();
      const res = await uploadToCloudinary(buffer, { folder: 'apexmart/test' });

      expect(res).toBeDefined();
      expect(res.secure_url).toBeDefined();
      expect(res.public_id).toContain('apexmart/products');
      expect(res.format).toBe('webp');
    });

    it('should safely delete assets from Cloudinary', async () => {
      const res = await deleteFromCloudinary('apexmart/products/test_asset_123');
      expect(res).toEqual({ result: 'ok' });
    });
  });

  describe('Security Boundaries & Constraints', () => {
    it('should enforce 5MB maximum file size limit', () => {
      expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
    });

    it('should allow exactly standard web image MIME types', () => {
      expect(ALLOWED_MIME_TYPES.has('image/jpeg')).toBe(true);
      expect(ALLOWED_MIME_TYPES.has('image/png')).toBe(true);
      expect(ALLOWED_MIME_TYPES.has('image/webp')).toBe(true);
      expect(ALLOWED_MIME_TYPES.has('image/avif')).toBe(true);
      expect(ALLOWED_MIME_TYPES.has('application/pdf')).toBe(false);
      expect(ALLOWED_MIME_TYPES.has('text/html')).toBe(false);
    });
  });
});
