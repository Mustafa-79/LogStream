import { createClient } from 'redis';

export const redisConnection = {
  host: '127.0.0.1',
  port: 6379
};

export const redisClient = createClient({ url: `redis://${redisConnection.host}:${redisConnection.port}` });

export async function initRedis() {
  redisClient.on('error', (err) => console.error('Redis Error:', err));
  await redisClient.connect();
}
