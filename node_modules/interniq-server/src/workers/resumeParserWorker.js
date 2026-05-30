import { Worker } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import { addJob } from '../config/queues.js';
import User from '../models/User.js';
import Test from '../models/Test.js';
import { extractTextFromBuffer, parseResumeWithLLM, flattenSkills } from '../services/ai/resumeParser.js';
import { emitJobProgress } from '../config/socket.js';
import logger from '../utils/logger.js';

const startResumeParserWorker = () => {
  const worker = new Worker(
    'resume-parser',
    async (job) => {
      const { userId, resumeUrl } = job.data;
      logger.info(`📄 Processing resume for user: ${userId} [job: ${job.id}]`);

      // Helper: check that this job has not been cancelled/removed
      const checkActive = async () => {
        const { getQueues } = await import('../config/queues.js');
        const fresh = await getQueues().resumeParser.getJob(job.id);
        return !!fresh;
      };

      // ── Step 1: Extract text ──────────────────────────────────
      if (!(await checkActive())) {
        logger.info(`🛑 Resume parsing aborted for user ${userId}: job ${job.id} was removed.`);
        return;
      }
      await job.updateProgress(10);
      emitJobProgress(userId, job.id, 10, 'parsing', { message: 'Extracting text from your resume...' });

      // Reconstruct the Buffer — handle multiple serialization formats:
      // 1. base64 string (new, preferred)
      // 2. {type:'Buffer', data:[...]} from buffer.toJSON() (old format)
      // 3. Raw buffer passed directly
      const { fileBuffer, fileEncoding, mimetype } = job.data;
      let buffer;
      if (fileEncoding === 'base64' || (typeof fileBuffer === 'string')) {
        buffer = Buffer.from(fileBuffer, 'base64');
      } else if (fileBuffer?.type === 'Buffer' && Array.isArray(fileBuffer.data)) {
        buffer = Buffer.from(fileBuffer.data);
      } else {
        buffer = Buffer.from(fileBuffer);
      }
      let resumeText = '';
      try {
        resumeText = await extractTextFromBuffer(buffer, mimetype);
        logger.info(`📃 Extracted ${resumeText.length} chars from resume for user ${userId}`);
      } catch (err) {
        logger.warn(`⚠️ Text extraction failed: ${err.message}. Using fallback text.`);
      }

      if (!resumeText || resumeText.length < 50) {
        logger.warn(`⚠️ Resume text too short (${resumeText?.length ?? 0} chars). Trying Cloudinary URL fetch.`);
        // Try fetching from Cloudinary URL as a fallback
        if (resumeUrl) {
          try {
            const { default: axios } = await import('axios');
            const response = await axios.get(resumeUrl, { responseType: 'arraybuffer', timeout: 15000 });
            const remoteBuffer = Buffer.from(response.data);
            resumeText = await extractTextFromBuffer(remoteBuffer, mimetype || 'application/pdf');
            logger.info(`📃 Fetched ${resumeText.length} chars from Cloudinary URL`);
          } catch (fetchErr) {
            logger.warn(`⚠️ Cloudinary fetch also failed: ${fetchErr.message}`);
          }
        }
      }

      if (!resumeText || resumeText.length < 50) {
        logger.warn('Could not extract readable text from the uploaded resume. Proceeding with fallback parsing.');
        resumeText = "MOCK_TRIGGER: Text extraction failed.";
      }

      // ── Step 2: LLM structured parsing ───────────────────────
      if (!(await checkActive())) {
        logger.info(`🛑 Resume parsing aborted for user ${userId}: job ${job.id} was removed.`);
        return;
      }
      await job.updateProgress(35);
      emitJobProgress(userId, job.id, 35, 'parsing', { message: 'AI is reading and understanding your resume...' });

      const parsedResume = await parseResumeWithLLM(resumeText);
      const flatSkills   = flattenSkills(parsedResume);
      logger.info(`🧠 Parsed resume for ${userId}: ${flatSkills.length} skills found`);

      // ── Step 3: Store parsed data in DB ──────────────────────
      if (!(await checkActive())) {
        logger.info(`🛑 Resume parsing aborted for user ${userId}: job ${job.id} was removed.`);
        return;
      }
      await job.updateProgress(65);
      emitJobProgress(userId, job.id, 65, 'parsing', { message: 'Saving your resume profile...' });

      // Attach the raw resume text for downstream use (ATS, test generation)
      parsedResume.resumeText = resumeText;

      await User.findByIdAndUpdate(userId, {
        parsedResume,
        skills: flatSkills,
      });

      // ── Step 4: Queue downstream jobs ────────────────────────
      if (!(await checkActive())) {
        logger.info(`🛑 Resume parsing aborted for user ${userId}: job ${job.id} was removed.`);
        return;
      }
      await job.updateProgress(80);
      // Switch status to 'analyzing' — this signals ATS phase is starting.
      // IMPORTANT: do NOT emit 'complete' here; that blocks ATS progress events in the client.
      emitJobProgress(userId, job.id, 80, 'analyzing', { message: 'Starting AI ATS scoring...' });

      // Queue ATS analysis (primary output of this pipeline)
      await addJob('ats-analyzer', 'analyze-ats', { userId, resumeText });

      // Queue embedding generation for recommendation matching
      const embedText = flatSkills.join(' ');
      await addJob('embedder', 'generate-embedding', { type: 'user', id: userId, text: embedText });

      // Queue test generation only if no completed/active test exists
      if (flatSkills && flatSkills.length > 0) {
        const existingTest = await Test.findOne({
          userId,
          status: { $in: ['generated', 'active', 'completed'] },
        });
        if (!existingTest) {
          await addJob('test-generator', `generate-${userId}`, {
            userId,
            skills: flatSkills,
            resumeText,
          });
          logger.info(`🎯 Queued test generation for user ${userId}`);
        } else {
          logger.info(`ℹ️ Skipping test generation — existing test found for user ${userId}`);
        }
      }

      logger.info(`✅ Resume parser done for ${userId}: ${flatSkills.length} skills, ATS + embedding queued`);
      return { userId, skillsExtracted: flatSkills.length };
    },
    {
      connection: getRedisClient(),
      concurrency: 3,
    }
  );

  worker.on('completed', (job, result) => {
    logger.info(`✅ Resume parsed: job ${job.id} — ${result?.skillsExtracted ?? 0} skills`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`❌ Resume parse failed: job ${job?.id} — ${err.message}`);
    if (job?.data?.userId) {
      emitJobProgress(job.data.userId, job.id, 0, 'failed', { message: `Resume parsing failed: ${err.message}` });
    }
  });

  logger.info('🔧 Resume parser worker started');
  return worker;
};

export default startResumeParserWorker;
