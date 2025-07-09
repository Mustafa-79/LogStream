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

    console.log('🔧 Processed filters:', processedFilters);
    console.log('🔍 Match stage:', matchStage);
    console.log('⏱ Granularity:', granularity);

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

    console.log(`🔍 Time difference: ${diffMs} ms, ${diffMinutes} minutes, ${diffHours} hours, ${diffDays} days`);

    if (diffMinutes <= 120) return 'minute';
    if (diffHours <= 48) return 'hour';
    return 'day';
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
    const groupingExpression = AnalyticsService.getGroupingExpression(granularity);

    const results = await Log.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupingExpression,
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log('📊 Volume trend aggregation results:', results);

    // Convert aggregation results to map for quick lookup
    const resultMap = new Map<string, number>();
    results.forEach(item => {
      const key = AnalyticsService.formatGroupId(item._id, granularity);
      resultMap.set(key, item.count);
    });

    // Extract date range from match stage
    const dateRange = matchStage.date as { $gte: Date; $lte: Date };
    const from = dateRange.$gte;
    const to = dateRange.$lte;

    // Generate all possible intervals and fill with actual counts or 0
    const allIntervals = AnalyticsService.generateAllIntervals(from, to, granularity);
    

    return allIntervals.map(interval => ({
      _id: interval.id,
      count: resultMap.get(interval.id) || 0,
      timestamp: interval.timestamp
    }));
  }

  /**
   * Get MongoDB grouping expression for different granularities
   * Using UTC timezone to match JavaScript Date behavior
   */
  private static getGroupingExpression(granularity: string): Record<string, unknown> {
    switch (granularity) {
      case 'minute':
        return {
          year: { $year: { $toDate: '$date' } },
          month: { $month: { $toDate: '$date' } },
          day: { $dayOfMonth: { $toDate: '$date' } },
          hour: { $hour: { $toDate: '$date' } },
          minute: { $minute: { $toDate: '$date' } }
        };
      case 'hour':
        return {
          year: { $year: { $toDate: '$date' } },
          month: { $month: { $toDate: '$date' } },
          day: { $dayOfMonth: { $toDate: '$date' } },
          hour: { $hour: { $toDate: '$date' } }
        };
      case 'day':
        return {
          year: { $year: { $toDate: '$date' } },
          month: { $month: { $toDate: '$date' } },
          day: { $dayOfMonth: { $toDate: '$date' } }
        };
      default:
        return {
          year: { $year: { $toDate: '$date' } },
          month: { $month: { $toDate: '$date' } },
          day: { $dayOfMonth: { $toDate: '$date' } }
        };
    }
  }

  /**
   * Format group ID for display
   */
  private static formatGroupId(groupId: Record<string, number>, granularity: string): string {
    switch (granularity) {
      case 'minute':
        return `${groupId.year}-${groupId.month.toString().padStart(2, '0')}-${groupId.day.toString().padStart(2, '0')}-${groupId.hour.toString().padStart(2, '0')}-${groupId.minute.toString().padStart(2, '0')}`;
      case 'hour':
        return `${groupId.year}-${groupId.month.toString().padStart(2, '0')}-${groupId.day.toString().padStart(2, '0')}-${groupId.hour.toString().padStart(2, '0')}`;
      case 'day':
        return `${groupId.year}-${groupId.month.toString().padStart(2, '0')}-${groupId.day.toString().padStart(2, '0')}`;
      default:
        return `${groupId.year}-${groupId.month.toString().padStart(2, '0')}-${groupId.day.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Create timestamp from MongoDB group ID
   * Using UTC to match MongoDB aggregation behavior
   */
  private static createTimestampFromGroupId(groupId: Record<string, number>, granularity: string): Date {
    switch (granularity) {
      case 'minute':
        return new Date(Date.UTC(groupId.year, groupId.month - 1, groupId.day, groupId.hour, groupId.minute));
      case 'hour':
        return new Date(Date.UTC(groupId.year, groupId.month - 1, groupId.day, groupId.hour));
      case 'day':
        return new Date(Date.UTC(groupId.year, groupId.month - 1, groupId.day));
      default:
        return new Date(Date.UTC(groupId.year, groupId.month - 1, groupId.day));
    }
  }

  /**
   * Generate all possible intervals within a date range
   * Using UTC to match MongoDB aggregation behavior
   */
  private static generateAllIntervals(from: Date, to: Date, granularity: string): Array<{ id: string; timestamp: Date }> {
    const intervals: Array<{ id: string; timestamp: Date }> = [];
    const current = new Date(from.getTime()); // Create a copy to avoid modifying original

    // Normalize the start time based on granularity
    AnalyticsService.normalizeDate(current, granularity);

    while (current <= to) {
      const timestamp = new Date(current);
      
      // Create group ID object to match MongoDB aggregation format using UTC
      const groupId = AnalyticsService.createGroupIdFromDate(timestamp, granularity);
      const id = AnalyticsService.formatGroupId(groupId, granularity);
      
      intervals.push({ id, timestamp });
      
      // Increment by the appropriate amount
      AnalyticsService.incrementDate(current, granularity);
    }

    return intervals;
  }

  /**
   * Normalize date to the start of the interval based on granularity
   * Using UTC methods to match MongoDB aggregation behavior
   */
  private static normalizeDate(date: Date, granularity: string): void {
    switch (granularity) {
      case 'minute':
        date.setUTCSeconds(0, 0);
        break;
      case 'hour':
        date.setUTCMinutes(0, 0, 0);
        break;
      case 'day':
        date.setUTCHours(0, 0, 0, 0);
        break;
      default:
        date.setUTCHours(0, 0, 0, 0);
    }
  }

  /**
   * Increment date by the appropriate amount based on granularity
   * Using UTC methods to match MongoDB aggregation behavior
   */
  private static incrementDate(date: Date, granularity: string): void {
    switch (granularity) {
      case 'minute':
        date.setUTCMinutes(date.getUTCMinutes() + 1);
        break;
      case 'hour':
        date.setUTCHours(date.getUTCHours() + 1);
        break;
      case 'day':
        date.setUTCDate(date.getUTCDate() + 1);
        break;
      default:
        date.setUTCDate(date.getUTCDate() + 1);
    }
  }

  /**
   * Create group ID object from a Date object
   * Using UTC methods to match MongoDB aggregation behavior
   */
  private static createGroupIdFromDate(date: Date, granularity: string): Record<string, number> {
    switch (granularity) {
      case 'minute':
        return {
          year: date.getUTCFullYear(),
          month: date.getUTCMonth() + 1,
          day: date.getUTCDate(),
          hour: date.getUTCHours(),
          minute: date.getUTCMinutes()
        };
      case 'hour':
        return {
          year: date.getUTCFullYear(),
          month: date.getUTCMonth() + 1,
          day: date.getUTCDate(),
          hour: date.getUTCHours()
        };
      case 'day':
        return {
          year: date.getUTCFullYear(),
          month: date.getUTCMonth() + 1,
          day: date.getUTCDate()
        };
      default:
        return {
          year: date.getUTCFullYear(),
          month: date.getUTCMonth() + 1,
          day: date.getUTCDate()
        };
    }
  }
}

export default AnalyticsService;