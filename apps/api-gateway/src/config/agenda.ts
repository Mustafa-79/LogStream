import { Agenda } from 'agenda';
import config from './config';
import { processLogExport } from '../utils/agendaUtils';
import { JobStatusModel } from '../models/JobStatus.model';
import logger from './logger';

// Agenda debug logger
const agendaDebugger = logger.withTraceId('AGENDA');

const agenda = new Agenda({
  db: {
    address: config.mongoose,
    collection: 'agendaJobs',
  },
  processEvery: '30 seconds',
  maxConcurrency: 5,
  defaultConcurrency: 1
});

agenda.define('export-logs', { concurrency: 3 }, async (job: any) => {
  const { jobId, userId, userEmail, since, filters, format } = job.attrs.data;
  
  try {
    agendaDebugger.info(`Processing export job: ${jobId}`);
    await processLogExport(userId, userEmail, since, filters, format);
    agendaDebugger.info(`Export job completed: ${jobId}`);
  } catch (error) {
    agendaDebugger.error(`Export job failed: ${jobId}`, error);
    
    const jobStatus = await JobStatusModel.findOne({ jobId });
    if (jobStatus && jobStatus.retryCount < jobStatus.maxRetries) {
      agendaDebugger.info(`Retrying job ${jobId} (attempt ${jobStatus.retryCount + 1})`);
      
      await JobStatusModel.findOneAndUpdate(
        { jobId },
        { 
          $inc: { retryCount: 1 },
          status: 'queued',
          updatedAt: new Date()
        }
      );
      
      // Schedule retry with exponential backoff
      const delay = Math.pow(2, jobStatus.retryCount) * 60000;
      await agenda.schedule(new Date(Date.now() + delay), 'export-logs', job.attrs.data);
    }
    
    throw error;
  }
});

// Enhanced event handlers
agenda.on('ready', () => {
  agendaDebugger.info('Agenda.js is ready');
});

agenda.on('error', (error) => {
  agendaDebugger.error('Agenda.js error:', error);
});

agenda.on('start', (job) => {
  agendaDebugger.info(`Job ${job.attrs.name} starting`);
});

agenda.on('complete', (job) => {
  agendaDebugger.info(`Job ${job.attrs.name} completed`);
});

agenda.on('fail', async (err, job) => {
  agendaDebugger.error(`Job ${job.attrs.name} failed:`, err);
  
  // Update job status
  const { jobId } = job.attrs.data;
  if (jobId) {
    await JobStatusModel.findOneAndUpdate(
      { jobId },
      { 
        status: 'failed',
        error: err.message,
        failedAt: new Date(),
        updatedAt: new Date()
      }
    );
  }
});

export const startAgenda = async () => {
  await agenda.start();
  agendaDebugger.info('Agenda.js started successfully');
};

export const stopAgenda = async () => {
  await agenda.stop();
  agendaDebugger.info('Agenda.js stopped');
};

export { agenda };
