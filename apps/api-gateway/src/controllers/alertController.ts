import { NextFunction, Request, Response } from 'express';
import createResponse from '../utils/responseHelper';
import { alertService } from '../services';

export const getAlerts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json(
        createResponse(401, 'User authentication required', null)
      );
      return;
    }

    const alerts = await alertService.getAlerts(userId);
    res.status(200).json(
      createResponse(200, 'Alerts fetched successfully', alerts)
    );
  } catch (error) {
    next(error);
  }
};

export const resolveAlert = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json(
        createResponse(400, 'Alert ID is required', null)
      );
      return;
    }

    const alert = await alertService.resolveAlert(id);
    
    if (!alert) {
      res.status(404).json(
        createResponse(404, 'Alert not found', null)
      );
      return;
    }

    res.status(200).json(
      createResponse(200, 'Alert resolved successfully', alert)
    );
  } catch (error) {
    next(error);
  }
};
