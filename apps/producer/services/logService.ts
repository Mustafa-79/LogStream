import { logQueue } from '../queues/logQueue';

export async function queueLogs(logs: any[]) {
  const records = Array.isArray(logs) ? logs : [logs];

  for (const record of records) {
    const log = record?.log ?? record;


    console.log('Adding log to queue:', log);
    
    await logQueue.add('new_log', log);
  }
}
