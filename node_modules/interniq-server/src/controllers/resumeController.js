import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { uploadBuffer, deleteFile } from '../config/cloudinary.js';
import { addJob } from '../config/queues.js';
import logger from '../utils/logger.js';

// ─── Upload Resume ────────────────────────────────────────────
export const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('No file provided', 'NO_FILE');

  const { buffer, mimetype, originalname } = req.file;
  const userId = req.user._id.toString();

  // Delete old resume from Cloudinary if exists
  if (req.user.resumePublicId) {
    await deleteFile(req.user.resumePublicId, 'raw').catch(() => {});
  }

  // Upload to Cloudinary
  const uploadResult = await uploadBuffer(buffer, {
    folder: `interniq/resumes/${userId}`,
    resource_type: 'raw',
    public_id: `resume_${Date.now()}`,
    use_filename: false,
    originalname,
  });

  logger.info(`📤 Resume uploaded: ${uploadResult.public_id} for user ${userId}`);

  // Update user with new resume URL
  await User.findByIdAndUpdate(userId, {
    resumeUrl:      uploadResult.secure_url,
    resumePublicId: uploadResult.public_id,
    // Clear old data
    parsedResume:   null,
    atsScore:       null,
    overallScore:   null,
  });

  // Queue background parsing job — serialize buffer as base64 for reliable Redis transport
  const job = await addJob('resume-parser', 'parse-resume', {
    userId,
    resumeUrl: uploadResult.secure_url,
    fileBuffer: buffer.toString('base64'),
    fileEncoding: 'base64',
    mimetype,
    originalname,
  });

  return ApiResponse.accepted(res, 'Resume uploaded. AI analysis has started.', {
    resumeUrl: uploadResult.secure_url,
    jobId: job.id,
  });
});

// ─── Get ATS Report ───────────────────────────────────────────
export const getATSReport = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user.resumeUrl) {
    throw ApiError.notFound('No resume found', 'NO_RESUME');
  }

  if (!user.parsedResume?.atsReport) {
    const { getQueues } = await import('../config/queues.js');
    const qs = getQueues();
    let isRunning = false;
    const targetQueues = [qs.resumeParser, qs.atsAnalyzer, qs.testGenerator];
    
    try {
      for (const queue of targetQueues) {
        if (!queue) continue;
        const jobs = await queue.getJobs(['active', 'waiting', 'delayed']);
        if (jobs.some(job => job.data?.userId === req.user._id.toString())) {
          isRunning = true;
          break;
        }
      }
    } catch (err) {
      logger.warn(`Failed to check job queue status: ${err.message}`);
    }

    if (!isRunning) {
      return ApiResponse.success(res, 'Analysis failed or was interrupted.', {
        status: 'failed',
        resumeUrl: user.resumeUrl
      });
    }

    return ApiResponse.success(res, 'ATS analysis in progress. Check back shortly.', {
      status: 'pending',
      resumeUrl: user.resumeUrl,
      atsScore: user.atsScore,
    });
  }

  return ApiResponse.success(res, 'ATS report retrieved', {
    status: 'complete',
    resumeUrl:   user.resumeUrl,
    atsScore:    user.atsScore,
    atsReport:   user.parsedResume.atsReport,
    parsedResume: {
      name:     user.parsedResume.name,
      skills:   user.parsedResume.skills,
      education:user.parsedResume.education,
      experience:user.parsedResume.experience,
      projects: user.parsedResume.projects,
    },
  });
});

// ─── Re-analyze Resume ────────────────────────────────────────
export const reanalyzeResume = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user.resumeUrl) throw ApiError.notFound('No resume to re-analyze', 'NO_RESUME');

  let buffer;
  const fs = await import('fs');
  const path = await import('path');
  const uploadsDir = path.join(process.cwd(), 'uploads/resumes');
  const localPath = user.resumePublicId ? path.join(uploadsDir, user.resumePublicId) : null;

  if (localPath && fs.existsSync(localPath)) {
    buffer = await fs.promises.readFile(localPath);
    logger.info(`📖 Re-analyzing local resume file: ${localPath}`);
  } else {
    logger.info(`🌐 Re-analyzing remote/Cloudinary resume file: ${user.resumeUrl}`);
    const response = await import('axios');
    const res2 = await response.default.get(user.resumeUrl, { responseType: 'arraybuffer' });
    buffer = Buffer.from(res2.data);
  }

  const job = await addJob('resume-parser', 'parse-resume', {
    userId: user._id.toString(),
    resumeUrl: user.resumeUrl,
    fileBuffer: buffer.toString('base64'),
    fileEncoding: 'base64',
    mimetype: 'application/pdf', // assume PDF for re-analysis
  });

  return ApiResponse.accepted(res, 'Re-analysis started', { jobId: job.id });
});

// ─── Job Status ───────────────────────────────────────────────
export const getJobStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { getQueues } = await import('../config/queues.js');
  const { resumeParser } = getQueues();

  const job = await resumeParser.getJob(jobId);
  if (!job) throw ApiError.notFound('Job', 'JOB_NOT_FOUND');

  const state    = await job.getState();
  const progress = job.progress;

  return ApiResponse.success(res, 'Job status', { jobId, state, progress });
});

// ─── Stop Resume Analysis ────────────────────────────────────────────
export const stopAnalysis = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();
  const { getQueues } = await import('../config/queues.js');
  const qs = getQueues();

  let stoppedCount = 0;

  // We check the resume-parser, ats-analyzer, and test-generator queues
  const targetQueues = [qs.resumeParser, qs.atsAnalyzer, qs.testGenerator];

  try {
    for (const queue of targetQueues) {
      if (!queue) continue;
      // Get all jobs in active, waiting, or delayed states
      const jobs = await queue.getJobs(['active', 'waiting', 'delayed']);
      for (const job of jobs) {
        if (job.data?.userId === userId) {
          await job.remove().catch((err) => {
            logger.warn(`⚠️ Failed to remove job ${job.id}: ${err.message}`);
          });
          stoppedCount++;
          logger.info(`🛑 Stopped active/queued job ${job.id} on queue ${queue.name} for user ${userId}`);
        }
      }
    }
  } catch (err) {
    logger.warn(`⚠️ Failed to query/remove jobs from BullMQ: ${err.message}`);
  }

  // Delete old resume from Cloudinary if exists
  const user = await User.findById(req.user._id);
  if (user && user.resumePublicId) {
    const { deleteFile } = await import('../config/cloudinary.js');
    await deleteFile(user.resumePublicId, 'raw').catch((err) => {
      logger.warn(`⚠️ Failed to delete Cloudinary file: ${err.message}`);
    });
  }

  // Clear user resume & ATS analysis fields in DB to reset the state
  await User.findByIdAndUpdate(req.user._id, {
    resumeUrl:      null,
    resumePublicId: null,
    parsedResume:   null,
    atsScore:       null,
    overallScore:   null,
    activeTestId:   null,
  });

  // Delete incomplete tests generated from this resume
  const Test = (await import('../models/Test.js')).default;
  await Test.deleteMany({ userId: req.user._id, status: { $ne: 'completed' } });

  return ApiResponse.success(res, 'Analysis stopped successfully.', { stoppedCount });
});
