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
