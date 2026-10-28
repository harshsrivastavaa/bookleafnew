import multer from 'multer';

const ALLOWED_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
]);

export const ticketAttachment = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, file, callback) {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      const error = new Error('Attach a PDF, Word document, text file, JPEG, or PNG (5 MB maximum)');
      error.status = 400;
      return callback(error);
    }
    return callback(null, true);
  },
}).single('attachment');
