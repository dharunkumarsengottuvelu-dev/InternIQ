import { Router } from 'express';
import authRoutes   from './auth.routes.js';
import resumeRoutes from './resume.routes.js';
import testRoutes   from './test.routes.js';
import recommendationRoutes from './recommendation.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.use('/auth',   authRoutes);
router.use('/resume', resumeRoutes);
router.use('/test',   testRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/admin', adminRoutes);

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'InternIQ API v1 — operational', timestamp: new Date().toISOString() });
});

export default router;
