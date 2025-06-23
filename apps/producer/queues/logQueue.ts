import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis';

export const logQueue = new Queue('log_queue', {
  connection: redisConnection
});
