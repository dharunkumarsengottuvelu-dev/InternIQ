import Redis from 'ioredis';
import logger from '../utils/logger.js';

let redisClient = null;

const createRedisClient = () => {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  const client = new Redis(url, {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => {
      const delay = Math.min(times * 500, 5000);
      if (times % 5 === 0) {
        logger.warn(`⚠️  Redis connection offline (attempt ${times}). Retrying in ${delay}ms...`);
      }
      return delay;
    },
    enableReadyCheck: true,
    lazyConnect: false,
    enableOfflineQueue: false,
  });

  client.on('connect',       () => logger.info('✅ Redis connected'));
  client.on('ready',         () => logger.info('✅ Redis ready'));
  client.on('error',  (err)  => logger.error(`❌ Redis error: ${err.message}`));
  client.on('close',         () => logger.warn('⚠️  Redis connection closed'));
  client.on('reconnecting',  () => logger.warn('⚠️  Redis reconnecting...'));

  return client;
};

export const getRedisClient = () => {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
};

export const healthCheck = async () => {
  try {
    const client = getRedisClient();
    const pong = await client.ping();
    return { status: pong === 'PONG' ? 'healthy' : 'unhealthy' };
  } catch {
    return { status: 'unhealthy' };
  }
};

export default getRedisClient;
