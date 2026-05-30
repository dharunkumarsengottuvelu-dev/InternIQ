import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Upload a buffer to local disk (server/uploads/resumes)
 * @param {Buffer} buffer - File buffer
 * @param {object} options - Upload options
 */
export const uploadBuffer = async (buffer, options = {}) => {
  logger.info('📂 Saving file to local disk storage');
  
  const uploadsDir = path.join(__dirname, '../../uploads/resumes');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Determine extension from options.originalname or default to .pdf
  const ext = options.originalname ? path.extname(options.originalname) : '.pdf';
  const fileName = `${options.public_id || `resume_${Date.now()}`}${ext}`;
  const filePath = path.join(uploadsDir, fileName);

  await fs.promises.writeFile(filePath, buffer);

  const port = process.env.PORT || 5000;
  const url = `http://localhost:${port}/uploads/resumes/${fileName}`;

  return {
    public_id: fileName,
    secure_url: url,
  };
};

/**
 * Delete a file from local disk by filename
 */
export const deleteFile = async (publicId) => {
  try {
    const uploadsDir = path.join(__dirname, '../../uploads/resumes');
    const filePath = path.join(uploadsDir, publicId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info(`🗑️  Local storage delete: ${publicId}`);
    }
    return { result: 'ok' };
  } catch (err) {
    logger.error(`❌ Local storage delete error: ${err.message}`);
    throw err;
  }
};
