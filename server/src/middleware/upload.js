import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc (legacy)
];

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.doc'];
const MAX_FILE_SIZE_MB = 50;

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(
      new ApiError(400, 'Only PDF and DOCX files are allowed', 'INVALID_FILE_TYPE'),
      false
    );
  }
  const ext = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new ApiError(400, 'Invalid file extension', 'INVALID_FILE_EXTENSION'),
      false
    );
  }
  cb(null, true);
};

export const resumeUpload = multer({
  storage: multer.memoryStorage(), // store in memory → stream to Cloudinary
  limits: {
    fileSize: MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
  fileFilter,
});

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new ApiError(400, 'Only image files are allowed', 'INVALID_FILE_TYPE'), false);
    }
    cb(null, true);
  },
});

// Express error handler for multer errors
export const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(400, `File size exceeds ${MAX_FILE_SIZE_MB}MB limit`, 'FILE_TOO_LARGE'));
    }
    return next(new ApiError(400, err.message, 'UPLOAD_ERROR'));
  }
  next(err);
};
