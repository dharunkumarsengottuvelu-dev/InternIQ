import express from 'express';
import { getPlatformStats, getAtsDistribution, getSkillsDemand } from '../../controllers/adminController.js';
import { getUsers, toggleBlockUser, getInternships, createInternship, updateInternship, deleteInternship } from '../../controllers/recruiterController.js';
import { authenticateToken, authorize } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorize('admin', 'recruiter'));

router.get('/stats', getPlatformStats);
router.get('/ats-distribution', getAtsDistribution);
router.get('/skills-demand', getSkillsDemand);

// Users Management
router.get('/users', getUsers);
router.patch('/users/:id/block', toggleBlockUser);

// Internship Management
router.route('/internships')
  .get(getInternships)
  .post(createInternship);

router.route('/internships/:id')
  .put(updateInternship)
  .delete(deleteInternship);

export default router;
