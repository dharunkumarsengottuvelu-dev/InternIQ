import express from 'express';
import { getRecommendationsForUser } from '../../controllers/recommendationController.js';
import { authenticateToken, authorize } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorize('student'));

router.get('/', getRecommendationsForUser);

export default router;
