import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import User from '../models/User.js';
import Internship from '../models/Internship.js';

/**
 * Get top level platform statistics (Total Students, Total Internships, Avg ATS Score, etc.)
 * @route GET /api/v1/admin/stats
 */
export const getPlatformStats = asyncHandler(async (req, res) => {
  const totalStudents = await User.countDocuments({ role: 'student' });
  const totalInternships = await Internship.countDocuments({ isActive: true });

  const scoreAgg = await User.aggregate([
    { $match: { role: 'student', atsScore: { $ne: null } } },
    {
      $group: {
        _id: null,
        avgAts: { $avg: '$atsScore' },
        avgCoding: { $avg: '$codingScore' }
      }
    }
  ]);

  const stats = {
    totalStudents,
    totalInternships,
    avgAtsScore: scoreAgg[0] ? Math.round(scoreAgg[0].avgAts) : 0,
    avgCodingScore: scoreAgg[0] ? Math.round(scoreAgg[0].avgCoding) : 0,
  };

  return ApiResponse.success(res, 'Platform stats fetched successfully', stats);
});

/**
 * Get distribution of ATS scores to plot a histogram.
 * @route GET /api/v1/admin/ats-distribution
 */
export const getAtsDistribution = asyncHandler(async (req, res) => {
  // Bucket scores into ranges (e.g. 0-20, 21-40, 41-60, 61-80, 81-100)
  const distribution = await User.aggregate([
    { $match: { role: 'student', atsScore: { $ne: null } } },
    {
      $bucket: {
        groupBy: "$atsScore",
        boundaries: [0, 20, 40, 60, 80, 101],
        default: "Other",
        output: {
          count: { $sum: 1 }
        }
      }
    }
  ]);

  const labels = {
    0: '0-20',
    20: '21-40',
    40: '41-60',
    60: '61-80',
    80: '81-100',
    'Other': 'Unknown'
  };

  const formattedData = distribution.map(d => ({
    range: labels[d._id],
    students: d.count
  }));

  // Ensure all buckets exist even if count is 0
  const completeData = Object.values(labels).filter(l => l !== 'Unknown').map(range => {
    const found = formattedData.find(f => f.range === range);
    return found || { range, students: 0 };
  });

  return ApiResponse.success(res, 'ATS Distribution fetched', completeData);
});

/**
 * Get top skills demanded across all active internships vs what students have
 * @route GET /api/v1/admin/skills-demand
 */
export const getSkillsDemand = asyncHandler(async (req, res) => {
  const demandedSkills = await Internship.aggregate([
    { $match: { isActive: true } },
    { $unwind: "$requiredSkills" },
    { $group: { _id: "$requiredSkills", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  const topSkills = demandedSkills.map(d => d._id);

  const studentSkills = await User.aggregate([
    { $match: { role: 'student' } },
    { $unwind: "$skills" },
    { $match: { skills: { $in: topSkills } } },
    { $group: { _id: "$skills", count: { $sum: 1 } } }
  ]);

  const studentCountMap = {};
  studentSkills.forEach(s => { studentCountMap[s._id] = s.count; });

  const finalData = demandedSkills.map(d => ({
    skill: d._id,
    demand: d.count,
    supply: studentCountMap[d._id] || 0
  }));

  return ApiResponse.success(res, 'Skills demand fetched', finalData);
});
