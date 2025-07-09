import { Request, Response, NextFunction } from 'express';
import { AnalyticsService, AnalyticsFilters } from '../services/analyticsService';
import createResponse from '../utils/responseHelper';

export class AnalyticsController {
  /**
   * Get comprehensive analytics data for the authenticated user (filtered by accessible applications)
   * GET /analytics
   * 
   * Query Parameters:
   * - applicationIDs: comma-separated list of application IDs to filter by
   * - logLevels: comma-separated list of log levels to filter by (info, warn, error, debug)
   * - from: start date for filtering (ISO string)
   * - to: end date for filtering (ISO string)
   */
  static async getAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || req.user?.userId;
      
      if (!userId) {
        res.status(401).json(
          createResponse(401, 'User authentication required', null)
        );
        return;
      }

      const filters = AnalyticsController.parseFilters(req);
      const data = await AnalyticsService.getAnalytics(userId, filters);
      
      res.status(200).json(
        createResponse(200, 'Analytics data retrieved successfully', data)
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Parse filters from request query parameters
   */
  private static parseFilters(req: Request): AnalyticsFilters {
    const { applicationIDs, logLevels, from, to } = req.query;

    const filters: AnalyticsFilters = {};

    // Parse application IDs (comma-separated)
    if (applicationIDs && typeof applicationIDs === 'string') {
      filters.applicationIDs = applicationIDs.split(',').map(id => id.trim()).filter(id => id);
    }

    // Parse log levels (comma-separated)
    if (logLevels && typeof logLevels === 'string') {
      filters.logLevels = logLevels.split(',').map(level => level.trim()).filter(level => level);
    }

    // Parse from date
    if (from && typeof from === 'string') {
      const parsedFrom = new Date(from);
      if (!isNaN(parsedFrom.getTime())) {
        filters.from = parsedFrom;
      }
    }

    // Parse to date
    if (to && typeof to === 'string') {
      const parsedTo = new Date(to);
      if (!isNaN(parsedTo.getTime())) {
        filters.to = parsedTo;
      }
    }

    return filters;
  }
}

// Export the main function for easier imports
export const getAnalytics = AnalyticsController.getAnalytics;

export default AnalyticsController;

