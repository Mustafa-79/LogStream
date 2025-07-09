import { Log } from '../models/Log.model';
import Group from '../models/Group.model';
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
   * Get comprehensive analytics data filtered by user's accessible applications
   */
  static async getAnalytics(userId: string, filters: AnalyticsFilters = {}): Promise<AnalyticsResponse> {
    const userApplicationIds = await AnalyticsService.getUserAccessibleApplications(userId);

    // If user has no access to any applications, return empty analytics
    if (userApplicationIds.length === 0) {
      return AnalyticsService.getEmptyAnalytics(filters);
    }

    // Filter applications based on user access
    const userFilters: AnalyticsFilters = {
      ...filters,
      applicationIDs: AnalyticsService.filterUserApplications(
        filters.applicationIDs,
        userApplicationIds
      )
    };

    // Apply defaults and build query
    const processedFilters = AnalyticsService.applyDefaults(userFilters);
    const matchStage = AnalyticsService.buildMatchStage(processedFilters);
    const granularity = AnalyticsService.determineGranularity(processedFilters.from, processedFilters.to);

    // Execute all aggregations in parallel
    const [
      totalLogs,
      logLevelDistribution,
      applicationCounts,
      volumeTrend
    ] = await Promise.all([
      Log.countDocuments(matchStage),
      AnalyticsService.getLogLevelDistribution(matchStage),
      AnalyticsService.getApplicationCounts(matchStage),
      AnalyticsService.getVolumeTrend(matchStage, granularity)
    ]);

    return {
      logLevelDistribution,
      applicationCounts,
      volumeTrend,
      totalLogs,
      period: {
        from: processedFilters.from,
        to: processedFilters.to,
        granularity
      }
    };
  }

  /**
   * Get application IDs that a user has access to through their group memberships
   */
  private static async getUserAccessibleApplications(userId: string): Promise<mongoose.Types.ObjectId[]> {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);

      const result = await Group.aggregate([
        // Stage 1: Find groups where user is a member
        {
          $match: {
            memberIDs: userObjectId,
            active: true,
            deleted: false
          }
        },
        // Stage 2: Unwind applicationIDs array to work with individual app IDs
        {
          $unwind: "$applicationIDs"
        },
        // Stage 3: Group by null to collect all unique application IDs
        {
          $group: {
            _id: null,
            applicationIds: { $addToSet: "$applicationIDs" }
          }
        }
      ]);

      return result.length > 0 ? result[0].applicationIds : [];
    } catch (error) {
      console.error('Error fetching user accessible applications:', error);
      return [];
    }
  }

  /**
   * Filter application IDs based on user access
   */
  private static filterUserApplications(
    requestedAppIds: string[] | undefined,
    userAccessibleAppIds: mongoose.Types.ObjectId[]
  ): string[] {
    const userAccessibleStrings = userAccessibleAppIds.map(id => id.toString());

    if (!requestedAppIds || requestedAppIds.length === 0) {
      return userAccessibleStrings;
    }

    return requestedAppIds.filter(id => userAccessibleStrings.includes(id));
  }

  /**
   * Get empty analytics response with proper date defaults
   */
  private static getEmptyAnalytics(filters: AnalyticsFilters): AnalyticsResponse {
    const { from, to } = AnalyticsService.getDefaultDateRange(filters);

    return {
      logLevelDistribution: [],
      applicationCounts: [],
      volumeTrend: [],
      totalLogs: 0,
      period: {
        from,
        to,
        granularity: AnalyticsService.determineGranularity(from, to)
      }
    };
  }

  /**
   * Get default date range
   */
  private static getDefaultDateRange(filters: AnalyticsFilters): { from: Date; to: Date } {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    return {
      from: filters.from || sevenDaysAgo,
      to: filters.to || now
    };
  }

  /**
   * Apply default filters
   */
  private static applyDefaults(filters: AnalyticsFilters): Required<AnalyticsFilters> {
    const { from, to } = AnalyticsService.getDefaultDateRange(filters);

    return {
      applicationIDs: filters.applicationIDs || [],
      logLevels: filters.logLevels || [],
      from,
      to
    };
  }

  /**
   * Build MongoDB match stage
   */
  private static buildMatchStage(filters: Required<AnalyticsFilters>): Record<string, unknown> {
    const match: Record<string, unknown> = {
      date: { $gte: filters.from, $lte: filters.to }
    };

    if (filters.applicationIDs.length > 0) {
      match.sourceApp = {
        $in: filters.applicationIDs.map(id => new mongoose.Types.ObjectId(id))
      };
    }

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

    if (diffMinutes <= 120) return 'minute';
    if (diffHours <= 48) return 'hour';
    if (diffDays <= 30) return 'day';
    return 'week';
  }

  /**
   * Get log level distribution with percentages
   */
  private static async getLogLevelDistribution(matchStage: Record<string, unknown>): Promise<LogLevelDistribution[]> {
    const results = await Log.aggregate([
      { $match: matchStage },
      { $group: { _id: '$logLevel', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const total = results.reduce((sum, item) => sum + item.count, 0);
    return results.map(item => ({
      ...item,
      percentage: total > 0 ? Math.round((item.count / total) * 100) : 0
    }));
  }

  /**
   * Get application counts with names
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
      { $sort: { applicationName: 1 } }
    ]);
  }

  /**
   * Get volume trend with proper timestamps
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

    return results.map(item => ({
      ...item,
      timestamp: AnalyticsService.parseGroupedDate(item._id, granularity)
    }));
  }

  /**
   * Parse grouped date string back to Date object
   */
  private static parseGroupedDate(dateStr: string, granularity: string): Date {
    const parts = dateStr.split('-').map(Number);

    switch (granularity) {
      case 'minute':
        return new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4]);
      case 'hour':
        return new Date(parts[0], parts[1] - 1, parts[2], parts[3]);
      case 'day':
        return new Date(parts[0], parts[1] - 1, parts[2]);
      case 'week': {
        const [weekYear, week] = parts;
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