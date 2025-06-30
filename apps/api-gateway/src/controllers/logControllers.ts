import { Request, Response, NextFunction } from 'express';
import * as logService from '../services/logService';
import createResponse from '../utils/responseHelper';

export const getAllLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await logService.getAllLogs();
    res.status(200).json(createResponse(200, 'Logs fetched successfully', logs));
  } catch (error) {
    next(error);
  }
};

export const getNewLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const sinceParam = req.query.since as string | undefined;
    const since = sinceParam ? new Date(sinceParam) : new Date(0); 

    const logs = await logService.getNewLogs(since);

    res.status(200).json(
      createResponse
        ? createResponse(200, 'New logs fetched successfully', logs)
        : { data: logs }
    );
  } catch (error) {
    next(error);
  }
};
