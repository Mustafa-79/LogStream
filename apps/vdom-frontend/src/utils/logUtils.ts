import { Log } from "../utils/applicationUtils";

export interface LogCounts {
  logsToday: number;
  errors: number;
}

export type LogCountsRecord = Record<string, LogCounts>;

export class LogUtils {
  static computeLogCounts(logs: Log[]): LogCountsRecord {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const counts: LogCountsRecord = {};

    logs.forEach(log => {
      const sourceAppId = log.sourceApp;

      if (!sourceAppId) {
        return;
      }

      const logDate = new Date(log.date);
      if (isNaN(logDate.getTime())) {
        return;
      }

      logDate.setHours(0, 0, 0, 0);

      if (!counts[sourceAppId]) {
        counts[sourceAppId] = { logsToday: 0, errors: 0 };
      }

      counts[sourceAppId].logsToday++;

      if (log.logLevel && log.logLevel.toLowerCase().includes('error')) {
        counts[sourceAppId].errors++;
      }
    });

    return counts;
  }

  static getLatestLogDate(logs: Log[]): string | null {
    if (logs.length === 0) return null;
    return logs[logs.length - 1].date;
  }

  static mergeLogs(existingLogs: Log[], newLogs: Log[]): Log[] {
    return [...existingLogs, ...newLogs];
  }

  static filterLogsBySourceApp(logs: Log[], sourceApp: string): Log[] {
    return logs.filter(log => log.sourceApp === sourceApp);
  }

  static filterLogsByLevel(logs: Log[], level: string): Log[] {
    return logs.filter(log => 
      log.logLevel && log.logLevel.toLowerCase().includes(level.toLowerCase())
    );
  }
}

export default LogUtils;