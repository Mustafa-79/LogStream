import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import createResponse from '../utils/responseHelper';
import ApiError from '../utils/ApiError';
import { alertService } from '../services';

export const getAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    // This should not happen due to authentication middleware, but keeping as defensive programming
    if (!userId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User authentication required');
    }

    const alerts = await alertService.getAlerts(userId);
    res.status(httpStatus.OK).json(
      createResponse(httpStatus.OK, 'Alerts fetched successfully', alerts)
    );
  } catch (error) {
    next(error);
  }
};

export const resolveAlert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    
    // This should not happen due to authentication middleware, but keeping as defensive programming
    if (!userId) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User authentication required');
    }

    // Parameter validation is handled by middleware, but adding defensive check
    if (!id) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Alert ID is required');
    }

    const alert = await alertService.resolveAlert(id);
    
    if (!alert) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Alert not found');
    }

    res.status(httpStatus.OK).json(
      createResponse(httpStatus.OK, 'Alert resolved successfully', alert)
    );
  } catch (error) {
    next(error);
  }
};
