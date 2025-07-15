import { convertLogsToCSV, convertLogsToJSON, createFilterSummary, sendExportErrorEmail, sendLogExportEmail } from '../utils/exportUtils';
import { JobStatusModel } from '../models/JobStatus.model';
import * as logService from '../services/logService';

interface LogFilters {
  applications?: string[];
  logLevels?: string[];
  fromDate?: Date;
  toDate?: Date;
}

export async function updateJobProgress(
  jobId: string, 
  progress: number, 
  step: string, 
  metadata?: any
): Promise<void> {
  try {
    await JobStatusModel.findOneAndUpdate(
      { jobId },
      { 
        progress,
        step,
        metadata,
        updatedAt: new Date()
      }
    );
  } catch (error) {
    console.error(`Failed to update job progress for ${jobId}:`, error);
  }
}

export const processLogExport = async (
  userId: string,
  userEmail: string,
  since: Date,
  filters?: LogFilters,
  format: 'csv' | 'json' = 'csv'
): Promise<void> => {
  const jobId = `export-${userId}-${Date.now()}`;

  try {
    console.log(`Starting log export for user ${userId} in ${format.toUpperCase()} format`);
    
    // Initialize job status
    await JobStatusModel.create({
      jobId,
      userId,
      userEmail,
      status: 'processing',
      step: 'initializing',
      metadata: { since, filters, format }
    });
    
    // Step 1: Fetch logs with retry logic
    await updateJobProgress(jobId, 10, 'fetching_logs');
    const logs = await withRetry(
      () => logService.getAllLogs(userId, since, filters),
      3,
      2000,
      jobId
    );
    
    console.log(`[${jobId}] Fetched ${logs.length} logs`);
    
    // Step 2: Convert data
    await updateJobProgress(jobId, 50, 'converting_data', { recordCount: logs.length });
    const fileData = format === 'json' ? convertLogsToJSON(logs) : convertLogsToCSV(logs);
    
    // Step 3: Send email
    await updateJobProgress(jobId, 80, 'sending_email');
    await withRetry(
      () => sendLogExportEmail(userEmail, fileData, filters, format),
      5,
      3000,
      jobId
    );
    
    // Step 4: Complete job
    await updateJobProgress(jobId, 100, 'completed');
    await JobStatusModel.findOneAndUpdate(
      { jobId },
      { 
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date()
      }
    );
    
    console.log(`[${jobId}] Log export completed successfully`);    
  } catch (error: any) {
    console.error(`Error processing log export for user ${userId}:`, error);
    
    await sendExportErrorEmail(userEmail, error.message);
  }
};

async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number,
  baseDelay: number,
  jobId: string
): Promise<T> {
  let lastError: Error = new Error('Unexpected error in retry logic');
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      if (!isRetryableError(error)) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`[${jobId}] Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, error.message);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

function isRetryableError(error: any): boolean {
  const retryableCodes = ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNREFUSED'];
  return retryableCodes.includes(error.code) || 
         (error.response?.status >= 500 && error.response?.status < 600);
}