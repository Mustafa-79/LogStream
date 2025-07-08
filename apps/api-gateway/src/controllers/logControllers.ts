import { Request, Response, NextFunction } from 'express';
import * as logService from '../services/logService';
import createResponse from '../utils/responseHelper';

export const getNewLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sinceParam = req.query.since as string | undefined;
    const since = sinceParam ? new Date(sinceParam) : new Date(0);
    
    const userId = req.user?.userId || req.user?.userId;
    
    if (!userId) {
      res.status(401).json({
        error: 'User authentication required'
      });
      return;
    }

    const logs = await logService.getNewLogsUser(userId, since);

    res.status(200).json(
      createResponse
        ? createResponse(200, 'New logs fetched successfully', logs)
        : { data: logs }
    );
  } catch (error) {
    next(error);
  }
};
