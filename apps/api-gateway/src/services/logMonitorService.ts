import * as logService from './logService';
import { Server } from 'socket.io';

export class LogMonitorService {
  private io: Server;
  private lastCheckTime: Date;
  private intervalId: NodeJS.Timeout | null = null;
  private static INTERVAL = 5000;

  constructor(io: Server) {
    this.io = io;
    this.lastCheckTime = new Date();
  }

  start() {
    console.log('Starting log monitoring service...');
    
    this.intervalId = setInterval(async () => {
      await this.checkForNewLogs();
    }, LogMonitorService.INTERVAL);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Log monitoring service stopped');
    }
  }

  private async checkForNewLogs() {
    try {
      const newLogs = await logService.getNewLogs(this.lastCheckTime);
      
      if (newLogs.length > 0) {
        console.log(`Found ${newLogs.length} new logs, broadcasting to clients`);
        
        this.io.emit('newLogs', {
          logs: newLogs,
          timestamp: new Date()
        });

        this.lastCheckTime = newLogs[newLogs.length - 1].date;
      }
    } catch (error) {
      console.error('Error checking for new logs:', error);
    }
  }

  handleClientConnection(socket: any) {
    this.sendRecentLogsToClient(socket);
  }

  private async sendRecentLogsToClient(socket: any) {
    try {
      // Send logs from last 24 hours to new client
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentLogs = await logService.getNewLogs(twentyFourHoursAgo);

      if (recentLogs.length > 0) {
        socket.emit('recentLogs', {
          logs: recentLogs,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error sending recent logs to client:', error);
    }
  }
}