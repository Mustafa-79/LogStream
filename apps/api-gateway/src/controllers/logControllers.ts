import { Request, Response, NextFunction } from 'express';
import * as logService from '../services/logService';
import createResponse from '../utils/responseHelper';

export const getLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sinceParam = req.query.since as string | undefined;
    const pageParam = req.query.page as string | undefined;
    const limitParam = req.query.limit as string | undefined;
    const applicationsParam = req.query.applications as string | undefined;
    const logLevelsParam = req.query.logLevels as string | undefined;
    const fromDateParam = req.query.fromDate as string | undefined;
    const toDateParam = req.query.toDate as string | undefined;
    
    const since = sinceParam ? new Date(sinceParam) : new Date(0);
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 25;
    
    const applications = applicationsParam ? applicationsParam.split(',').map(app => app.trim()).filter(app => app.length > 0) : undefined;
    const logLevels = logLevelsParam ? logLevelsParam.split(',').map(level => level.trim()).filter(level => level.length > 0) : undefined;
    
    const fromDate = fromDateParam ? new Date(fromDateParam) : undefined;
    const toDate = toDateParam ? new Date(toDateParam) : undefined;
    
    if (fromDate && isNaN(fromDate.getTime())) {
      res.status(400).json({ error: 'Invalid fromDate format' });
      return;
    }
    
    if (toDate && isNaN(toDate.getTime())) {
      res.status(400).json({ error: 'Invalid toDate format' });
      return;
    }
    
    if (fromDate && toDate && fromDate > toDate) {
      res.status(400).json({ error: 'fromDate cannot be later than toDate' });
      return;
    }
    
    const userId = req.user?.userId || req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'User authentication required' });
      return;
    }

    const filters = {
      applications,
      logLevels,
      fromDate,
      toDate
    };

    const { logs, pagination } = await logService.getLogs(userId, since, page, limit, filters);

    res.status(200).json(
      createResponse(200, 'Logs fetched successfully', {
        logs,
        pagination
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getLogStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'User authentication required' });
      return;
    }

    const stats = await logService.getLogStats(userId);

    res.status(200).json(
      createResponse(200, 'Log statistics fetched successfully', stats)
    );
  } catch (error) {
    next(error);
  }
}
