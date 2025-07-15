import { JobStatusModel } from "../models/JobStatus.model";
import { sendExportErrorEmail } from "../utils/exportUtils";

class MonitoringService {
  private interval: NodeJS.Timeout | null = null;
  
  start() {
    this.interval = setInterval(async () => {
      try {
        // Find stuck jobs (processing for > 15 minutes)
        const stuckJobs = await JobStatusModel.find({
          status: 'processing',
          updatedAt: { $lt: new Date(Date.now() - 15 * 60 * 1000) }
        });
        
        for (const job of stuckJobs) {
          console.warn(`Found stuck job: ${job.jobId}`);
          
          await JobStatusModel.findOneAndUpdate(
            { jobId: job.jobId },
            { 
              status: 'stuck',
              error: 'Job appears to be stuck - no progress for 30 minutes',
              updatedAt: new Date()
            }
          );
          
          // Notify user
          await this.notifyStuckJob(job);
        }
        
      } catch (error) {
        console.error('Error in monitoring service:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }
  
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
  
  async notifyStuckJob(job: any) {
    try {
      console.log(`Sending stuck job notification to ${job.userEmail} for job ${job.jobId}`);
      
      const errorMessage = `Your log export job (ID: ${job.jobId}) appears to be stuck and has been automatically cancelled. 
      
      Job Details:
      - Job ID: ${job.jobId}
      - Created: ${job.createdAt}
      - Last Update: ${job.updatedAt}
      - Status: Processing for over 30 minutes
      
      This may have occurred due to:
      - Server restart during processing
      - Network connectivity issues
      - Heavy system load
      
      Please try submitting a new export request. If the issue persists, please contact support.`;
      
      await sendExportErrorEmail(job.userEmail, errorMessage);
      
      console.log(`Stuck job notification sent successfully to ${job.userEmail}`);
      
      await this.logError('stuck_job_notification_sent', {
        jobId: job.jobId,
        userId: job.userId,
        userEmail: job.userEmail,
        stuckDuration: Date.now() - new Date(job.updatedAt).getTime(),
        createdAt: job.createdAt,
        lastUpdated: job.updatedAt
      });
      
    } catch (error: any) {
      console.error(`Failed to send stuck job notification to ${job.userEmail}:`, error);
      
      // Log the failure for monitoring
      await this.logError('stuck_job_notification_failed', {
        jobId: job.jobId,
        userId: job.userId,
        userEmail: job.userEmail,
        error: error.message,
        stack: error.stack
      });
    }
  }
  
  async logError(type: string, data: any) {
    console.error(`[${type}]`, data);
  }
}

export const monitoringService = new MonitoringService();