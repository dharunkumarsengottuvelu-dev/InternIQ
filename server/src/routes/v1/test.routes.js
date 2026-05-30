import express from 'express';
import { generateTest, getMyTest, runCode, submitMCQ, submitCode, requestRetest } from '../../controllers/testController.js';
import { authenticateToken, authorize } from '../../middleware/auth.js';

const router = express.Router();

// All test endpoints require authentication
router.use(authenticateToken);
router.use(authorize('student')); // Only students can take tests

// Generate a new test
router.post('/generate', generateTest);

// Request a retest (archives current test and generates new)
router.post('/retest', requestRetest);

// Get active test
router.get('/my-test', getMyTest);

// Run arbitrary code
router.post('/run', runCode);

// Submit portions of the test
router.post('/:testId/mcq', submitMCQ);
router.post('/:testId/code', submitCode);

export default router;
