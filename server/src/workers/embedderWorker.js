import { Worker } from 'bullmq';
import { getRedisClient } from '../config/redis.js';
import logger from '../utils/logger.js';
import { generateEmbedding } from '../services/embeddings/vectorService.js';
import User from '../models/User.js';
import Internship from '../models/Internship.js';

let worker = null;

export const startEmbedderWorker = () => {
  if (worker) return worker;

  worker = new Worker(
    'embedder',
    async (job) => {
      const { type, id, text } = job.data;

      try {
        logger.info(`[Job ${job.id}] Generating embedding for ${type} ${id}`);
        
        // 1. Generate the embedding vector
        const embedding = await generateEmbedding(text);

        // 2. Save it back to the database
        if (type === 'user') {
          await User.findByIdAndUpdate(id, { profileEmbedding: embedding });
        } else if (type === 'internship') {
          await Internship.findByIdAndUpdate(id, { embedding });
        } else {
          throw new Error(`Unknown entity type: ${type}`);
        }

        logger.info(`[Job ${job.id}] Successfully generated embedding for ${type} ${id}`);
        return { success: true };
      } catch (error) {
        logger.error(`[Job ${job.id}] Embedding generation failed:`, error);
        throw error;
      }
    },
    { connection: getRedisClient() }
  );

  worker.on('failed', (job, err) => {
    logger.error(`❌ Job ${job.id} (embedder) failed: ${err.message}`);
  });

  logger.info('👷 embedder worker started');
  return worker;
};
