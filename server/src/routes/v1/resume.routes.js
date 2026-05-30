import { Router } from 'express';
import {
  uploadResume, getATSReport, reanalyzeResume, getJobStatus, stopAnalysis,
} from '../../controllers/resumeController.js';
import { authenticateToken, checkEmailVerified } from '../../middleware/auth.js';
import { uploadLimiter } from '../../middleware/rateLimit.js';
import { resumeUpload, handleMulterError } from '../../middleware/upload.js';

const router = Router();

// All resume routes require authentication + verified email
router.use(authenticateToken, checkEmailVerified);

router.post('/upload',
  uploadLimiter,
  resumeUpload.single('resume'),
  handleMulterError,
  uploadResume
);

router.get('/ats-report',     getATSReport);
router.post('/reanalyze',     uploadLimiter, reanalyzeResume);
router.get('/status/:jobId',  getJobStatus);
router.post('/stop',          stopAnalysis);

export default router;
