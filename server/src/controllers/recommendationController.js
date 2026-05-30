import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import { getRecommendations } from '../services/ai/recommender.js';

/**
 * Fetch personalized internship recommendations for the logged-in student.
 * @route GET /api/v1/recommendations
 */
export const getRecommendationsForUser = asyncHandler(async (req, res) => {
  const recommendations = await getRecommendations(req.user._id);

  return ApiResponse.success(res, 'Recommendations fetched successfully', recommendations);
});
