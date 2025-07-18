import { Request, Response, NextFunction } from 'express';
import * as logService from '../services/logService';
import createResponse from '../utils/responseHelper';
import { agenda } from '../config/agenda';
import { JobStatusModel } from '../models/JobStatus.model';
import logger from '../config/logger';
import config from '../config/config';

// Log controller debug logger
const logControllerDebugger = logger.withTraceId('LOG_CTRL');

interface LogFilters {
  applications?: string[];
  logLevels?: string[];
  fromDate?: Date;
  toDate?: Date;
}

export const getLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sinceParam = req.query.since as string | undefined;
    const pageParam = req.query.page as string | undefined;
    const limitParam = req.query.limit as string | undefined;
    const applicationsParam = req.query.applications as string | undefined;
    const logLevelsParam = req.query.logLevels as string | undefined;
    const fromDateParam = req.query.fromDate as string | undefined;
    const toDateParam = req.query.toDate as string | undefined;
    const searchParam = req.query.search as string | undefined;
    const sortByParam = req.query.sortBy as string | undefined;
    const sortOrderParam = req.query.sortOrder as string | undefined;
    
    const since = sinceParam ? new Date(sinceParam) : new Date(0);
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 25;
    
    const applications = applicationsParam ? applicationsParam.split(',').map(app => app.trim()).filter(app => app.length > 0) : undefined;
    const logLevels = logLevelsParam ? logLevelsParam.split(',').map(level => level.trim()).filter(level => level.length > 0) : undefined;
    const search = searchParam ? searchParam.trim() : undefined;
    
    const sortBy = sortByParam ? sortByParam.trim() : undefined;
    const sortOrder = sortOrderParam && ['asc', 'desc'].includes(sortOrderParam.toLowerCase()) 
      ? sortOrderParam.toLowerCase() as 'asc' | 'desc' 
      : undefined;
    
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
      toDate,
      search
    };

    const { logs, pagination } = await logService.getLogs(userId, since, page, limit, filters, sortBy, sortOrder);

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
};

export const exportLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sinceParam = req.query.since as string | undefined;
    const applicationsParam = req.query.applications as string | undefined;
    const logLevelsParam = req.query.logLevels as string | undefined;
    const fromDateParam = req.query.fromDate as string | undefined;
    const toDateParam = req.query.toDate as string | undefined;
    const formatParam = req.query.format as string | undefined;
    
    const since = sinceParam ? new Date(sinceParam) : new Date(0);
    const applications = applicationsParam ? 
      applicationsParam.split(',').map(app => app.trim()).filter(app => app.length > 0) : 
      undefined;
    const logLevels = logLevelsParam ? 
      logLevelsParam.split(',').map(level => level.trim()).filter(level => level.length > 0) : 
      undefined;
    
    const fromDate = fromDateParam ? new Date(fromDateParam) : undefined;
    const toDate = toDateParam ? new Date(toDateParam) : undefined;
    
    const format = formatParam?.toLowerCase() === 'json' ? 'json' : 'csv';
    
    if (formatParam && !['csv', 'json'].includes(formatParam.toLowerCase())) {
      res.status(400).json({ error: 'Invalid format. Supported formats: csv, json' });
      return;
    }
    
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
    
    const userId = req.user?.userId;
    const userEmail = req.user?.email;
    if (config.nodeEnv === 'development') {
      logControllerDebugger.debug(`User ID: ${userId}, User Email: ${userEmail}, Format: ${format}`);
    }
    
    if (!userId) {
      res.status(401).json({ error: 'User authentication required' });
      return;
    }
    
    if (!userEmail) {
      res.status(400).json({ error: 'User email not found' });
      return;
    }

    const filters: LogFilters = {
      applications,
      logLevels,
      fromDate,
      toDate
    };

    const jobId = `export-${userId}-${Date.now()}`;
    
    // Create job status record first
    await JobStatusModel.create({
      jobId,
      userId,
      userEmail,
      status: 'queued',
      metadata: { since, filters, format }
    });

    // Queue the job
    const job = await agenda.now('export-logs', {
      jobId,
      userId,
      userEmail,
      since,
      filters,
      format
    });

    logControllerDebugger.info(`Log export job queued: ${jobId}`);

    res.status(202).json(
      createResponse(202, `Log export request accepted. You will receive an email when complete.`, {
        message: 'Export process started',
        format: format.toUpperCase(),
        jobId,
        statusUrl: `/api/jobs/${jobId}/status`,
        estimatedCompletionTime: 'You will receive an email notification when ready'
      })
    );
    
  } catch (error) {
    next(error);
  }
};
