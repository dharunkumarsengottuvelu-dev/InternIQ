import 'dotenv/config';
import { getRedisClient } from './src/config/redis.js';

async function check() {
  console.log('Connecting to Redis...');
  const client = getRedisClient();
  console.log('Sending PING...');
  const pong = await client.ping();
  console.log(`PING Response: ${pong}`);
  await client.quit();
  process.exit(0);
}

check().catch(err => {
  console.error('Redis check failed:', err);
  process.exit(1);
});
