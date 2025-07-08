import { Log } from '../models/Log.model';
import mongoose from 'mongoose';

export interface LogLevelDistribution {
  _id: string;
  count: number;
  percentage: number;
}

export interface ApplicationCount {
  _id: string;
  applicationName: string;
  count: number;
}

export interface VolumeDataPoint {
  _id: string;
  count: number;
  timestamp: Date;
}

export interface AnalyticsFilters {
  applicationIDs?: string[];
  logLevels?: string[];
  from?: Date;
  to?: Date;
}

export interface AnalyticsResponse {
  logLevelDistribution: LogLevelDistribution[];
  applicationCounts: ApplicationCount[];
  volumeTrend: VolumeDataPoint[];
  totalLogs: number;
  period: {
    from: Date;
    to: Date;
    granularity: string;
  };
}

export class AnalyticsService {
  /**
   * Get comprehensive analytics data for dashboard
   */
  static async getAnalytics(filters: AnalyticsFilters = {}): Promise<AnalyticsResponse> {
    // Set default values
    const defaultFilters = AnalyticsService.applyDefaults(filters);
    const matchStage = AnalyticsService.buildMatchStage(defaultFilters);
    const granularity = AnalyticsService.determineGranularity(defaultFilters.from!, defaultFilters.to!);

    // Execute all aggregations in parallel
    const [
      totalLogs,
      logLevelDistribution,
      applicationCounts,
      volumeTrend
    ] = await Promise.all([
      // Total count
      Log.countDocuments(matchStage),
      
      // Log level distribution for pie chart
      AnalyticsService.getLogLevelDistribution(matchStage),
      
      // Application counts for bar chart
      AnalyticsService.getApplicationCounts(matchStage),
      
      // Volume trend for line chart
      AnalyticsService.getVolumeTrend(matchStage, granularity)
    ]);

    return {
      logLevelDistribution,
      applicationCounts,
      volumeTrend,
      totalLogs,
      period: {
        from: defaultFilters.from!,
        to: defaultFilters.to!,
        granularity
      }
    };
  }

  /**
   * Apply default filters
   */
  private static applyDefaults(filters: AnalyticsFilters): Required<AnalyticsFilters> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      applicationIDs: filters.applicationIDs || [], // Empty array means all
      logLevels: filters.logLevels || [], // Empty array means all
      from: filters.from || sevenDaysAgo,
      to: filters.to || now
    };
  }

  /**
   * Build MongoDB match stage
   */
  private static buildMatchStage(filters: Required<AnalyticsFilters>): Record<string, unknown> {
    const match: Record<string, unknown> = {
      date: {
        $gte: filters.from,
        $lte: filters.to
      }
    };

    // Filter by application IDs if specified
    if (filters.applicationIDs.length > 0) {
      match.sourceApp = {
        $in: filters.applicationIDs.map(id => new mongoose.Types.ObjectId(id))
      };
    }

    // Filter by log levels if specified
    if (filters.logLevels.length > 0) {
      match.logLevel = { $in: filters.logLevels };
    }

    return match;
  }

  /**
   * Determine optimal granularity based on time range
   */
  private static determineGranularity(from: Date, to: Date): string {
    const diffMs = to.getTime() - from.getTime();
    const diffMinutes = diffMs / (1000 * 60);
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffMinutes <= 120) {
      return 'minute'; // Less than 120 minutes - group by minute
    } else if (diffHours <= 48) {
      return 'hour'; // Less than 2 days - group by hour
    } else if (diffDays <= 30) {
      return 'day'; // Up to 30 days - group by day
    } else {
      return 'week'; // More than 30 days - group by week
    }
  }

  /**
   * Get log level distribution
   */
  private static async getLogLevelDistribution(matchStage: Record<string, unknown>): Promise<LogLevelDistribution[]> {
    const results = await Log.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$logLevel',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Calculate percentages
    const total = results.reduce((sum, item) => sum + item.count, 0);
    
    return results.map(item => ({
      ...item,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
    }));
  }

  /**
   * Get application counts
   */
  private static async getApplicationCounts(matchStage: Record<string, unknown>): Promise<ApplicationCount[]> {
    return await Log.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: 'applications',
          localField: 'sourceApp',
          foreignField: '_id',
          as: 'application'
        }
      },
      { $unwind: '$application' },
      {
        $group: {
          _id: '$sourceApp',
          applicationName: { $first: '$application.name' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);
  }

  /**
   * Get volume trend
   */
  private static async getVolumeTrend(matchStage: Record<string, unknown>, granularity: string): Promise<VolumeDataPoint[]> {
    const dateFormats = {
      minute: '%Y-%m-%d-%H-%M',
      hour: '%Y-%m-%d-%H',
      day: '%Y-%m-%d',
      week: '%Y-%U'
    };

    const results = await Log.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormats[granularity as keyof typeof dateFormats],
              date: '$date'
            }
          },
          count: { $sum: 1 },
          timestamp: { $first: '$date' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Convert to proper timestamps
    return results.map(item => ({
      ...item,
      timestamp: AnalyticsService.parseGroupedDate(item._id, granularity)
    }));
  }

  /**
   * Parse grouped date string back to Date object
   */
  private static parseGroupedDate(dateStr: string, granularity: string): Date {
    switch (granularity) {
      case 'minute': {
        const [year, month, day, hour, minute] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day, hour, minute);
      }
      
      case 'hour': {
        const [year, month, day, hour] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day, hour);
      }
      
      case 'day': {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
      }
      
      case 'week': {
        const [weekYear, week] = dateStr.split('-').map(Number);
        const jan1 = new Date(weekYear, 0, 1);
        const daysOffset = (week - 1) * 7;
        return new Date(jan1.getTime() + daysOffset * 24 * 60 * 60 * 1000);
      }
      
      default:
        return new Date(dateStr);
    }
  }
}

export default AnalyticsService;