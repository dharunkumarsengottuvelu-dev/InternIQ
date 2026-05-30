import { Worker } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

const startScorerWorker = () => {
  const worker = new Worker(
    'scorer',
    async (job) => {
      const { userId } = job.data;

      const user = await User.findById(userId).select('atsScore mcqScore codingScore');
      if (!user) throw new Error(`User not found: ${userId}`);

      const overallScore = user.calculateOverallScore();
      if (overallScore !== null) {
        await User.findByIdAndUpdate(userId, { overallScore });
        logger.info(`📈 Overall score updated: ${userId} → ${overallScore}`);
      }

      return { userId, overallScore };
    },
    { connection: getRedisClient(), concurrency: 5 }
  );

  worker.on('failed', (job, err) => {
    logger.error(`❌ Scorer failed: job ${job?.id} — ${err.message}`);
  });

  logger.info('🔧 Scorer worker started');
  return worker;
};

export default startScorerWorker;
