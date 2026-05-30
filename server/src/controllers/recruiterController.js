import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import User from '../models/User.js';
import Internship from '../models/Internship.js';
import { getQueues } from '../config/queues.js';

// ─── Users Management ──────────────────────────────────────────

/**
 * Get all students (paginated)
 * @route GET /api/v1/admin/users
 */
export const getUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const users = await User.find({ role: 'student' })
    .select('-password -__v')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments({ role: 'student' });

  return ApiResponse.success(res, 'Users fetched successfully', {
    users,
    total,
    page,
    pages: Math.ceil(total / limit)
  });
});

/**
 * Toggle user block status
 * @route PATCH /api/v1/admin/users/:id/block
 */
export const toggleBlockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  user.isBlocked = !user.isBlocked;
  await user.save();

  return ApiResponse.success(res, `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`, { isBlocked: user.isBlocked });
});

// ─── Internship Management ─────────────────────────────────────

/**
 * Get all internships posted by recruiters/admins
 * @route GET /api/v1/admin/internships
 */
export const getInternships = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const internships = await Internship.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Internship.countDocuments();

  return ApiResponse.success(res, 'Internships fetched successfully', {
    internships,
    total,
    page,
    pages: Math.ceil(total / limit)
  });
});

/**
 * Create a new internship
 * @route POST /api/v1/admin/internships
 */
export const createInternship = asyncHandler(async (req, res) => {
  const internship = new Internship({
    ...req.body,
    postedBy: req.user._id
  });

  await internship.save();

  // Queue embedding generation
  const queues = getQueues();
  const embedText = `${internship.title} ${internship.company} ${internship.description} ${internship.requiredSkills?.join(' ') || ''} ${internship.domain?.join(' ') || ''}`;
  await queues.embedder.add('generate-embedding', {
    type: 'internship',
    id: internship._id,
    text: embedText,
  });

  return ApiResponse.success(res, 'Internship created successfully', internship, 201);
});

/**
 * Update an internship
 * @route PUT /api/v1/admin/internships/:id
 */
export const updateInternship = asyncHandler(async (req, res) => {
  const internship = await Internship.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!internship) throw new ApiError(404, 'Internship not found');

  // Re-queue embedding if key fields changed
  if (req.body.title || req.body.description || req.body.requiredSkills || req.body.domain) {
    const queues = getQueues();
    const embedText = `${internship.title} ${internship.company} ${internship.description} ${internship.requiredSkills?.join(' ') || ''} ${internship.domain?.join(' ') || ''}`;
    await queues.embedder.add('generate-embedding', {
      type: 'internship',
      id: internship._id,
      text: embedText,
    });
  }

  return ApiResponse.success(res, 'Internship updated successfully', internship, 200);
});

/**
 * Delete an internship
 * @route DELETE /api/v1/admin/internships/:id
 */
export const deleteInternship = asyncHandler(async (req, res) => {
  const internship = await Internship.findByIdAndDelete(req.params.id);
  if (!internship) throw new ApiError(404, 'Internship not found');

  return ApiResponse.success(res, 'Internship deleted successfully', null, 200);
});
