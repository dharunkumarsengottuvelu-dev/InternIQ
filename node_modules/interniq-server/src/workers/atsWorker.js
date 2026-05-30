import { Worker } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import { addJob } from '../config/queues.js';
import User from '../models/User.js';
import { analyzeATS } from '../services/ai/atsAnalyzer.js';
import { emitJobProgress, emitToUser } from '../config/socket.js';
import logger from '../utils/logger.js';

const startATSWorker = () => {
  const worker = new Worker(
    'ats-analyzer',
    async (job) => {
      const { userId, resumeText } = job.data;
      logger.info(`📊 ATS analysis for user: ${userId} [job: ${job.id}]`);

      const checkActive = async () => {
        const { getQueues } = await import('../config/queues.js');
        const fresh = await getQueues().atsAnalyzer.getJob(job.id);
        return !!fresh;
      };

      if (!(await checkActive())) {
        logger.info(`🛑 ATS analysis aborted for user ${userId}: job ${job.id} is no longer active.`);
        return;
      }
      emitJobProgress(userId, job.id, 20, 'analyzing', { message: 'AI is scoring your resume...' });

      const atsReport = await analyzeATS(resumeText);

      if (!(await checkActive())) {
        logger.info(`🛑 ATS analysis aborted for user ${userId}: job ${job.id} is no longer active.`);
        return;
      }
      await job.updateProgress(80);
      emitJobProgress(userId, job.id, 80, 'saving', { message: 'Saving your ATS report...' });

      // Store ATS report and update score
      await User.findByIdAndUpdate(userId, {
        atsScore: atsReport.overallScore,
        'parsedResume.atsReport': atsReport,
      });

      // Trigger score recalculation
      await addJob('scorer', 'recalculate-score', { userId, component: 'ats', score: atsReport.overallScore });

      if (!(await checkActive())) {
        logger.info(`🛑 ATS analysis aborted for user ${userId}: job ${job.id} is no longer active.`);
        return;
      }
      await job.updateProgress(100);

      // Push full ATS report to client via WebSocket
      emitToUser(userId, 'ats:complete', {
        atsReport,
        atsScore: atsReport.overallScore,
      });

      logger.info(`✅ ATS complete for ${userId}: ${atsReport.overallScore}/100`);
      return { userId, atsScore: atsReport.overallScore };
    },
    {
      connection: getRedisClient(),
      concurrency: 3,
    }
  );

  worker.on('failed', (job, err) => {
    logger.error(`❌ ATS analysis failed: job ${job?.id} — ${err.message}`);
    if (job?.data?.userId) {
      emitToUser(job.data.userId, 'ats:failed', { message: 'ATS analysis failed. Please try again.' });
    }
  });

  logger.info('🔧 ATS analyzer worker started');
  return worker;
};

export default startATSWorker;
