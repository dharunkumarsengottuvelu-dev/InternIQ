import { Queue } from 'bullmq';
import { getRedisClient } from './redis.js';
import logger from '../utils/logger.js';

// Shared job options — retry with exponential backoff
export const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 2000 },
  removeOnComplete: { age: 3600, count: 100 },
  removeOnFail: { age: 86400 },
};

let queues = null;

export const getQueues = () => {
  if (queues) return queues;

  const connection = getRedisClient();

  queues = {
    resumeParser:  new Queue('resume-parser',  { connection, defaultJobOptions }),
    atsAnalyzer:   new Queue('ats-analyzer',   { connection, defaultJobOptions }),
    testGenerator: new Queue('test-generator', { connection, defaultJobOptions }),
    codeEvaluator: new Queue('code-evaluator', { connection, defaultJobOptions }),
    scorer:        new Queue('scorer',         { connection, defaultJobOptions }),
    embedder:      new Queue('embedder',       { connection, defaultJobOptions }),
  };

  logger.info('✅ BullMQ queues initialized');
  return queues;
};

/**
 * Add a job to a named queue with default options
 */
export const addJob = async (queueName, jobName, data, options = {}) => {
  const qs = getQueues();
  const camelQueueName = queueName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  const queue = qs[queueName] || qs[camelQueueName];
  if (!queue) throw new Error(`Unknown queue: ${queueName}`);
  const job = await queue.add(jobName, data, { ...defaultJobOptions, ...options });
  logger.debug(`📬 Job added: ${queueName}/${jobName} [${job.id}]`);
  return job;
};

export default getQueues;
