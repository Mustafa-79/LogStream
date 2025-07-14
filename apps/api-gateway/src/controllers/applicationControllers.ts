import { NextFunction, Request, Response } from 'express';
import { applicationService } from '../services';
import createResponse from '../utils/responseHelper';

export const getAllApplications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const pageParam = req.query.page as string | undefined;
    const limitParam = req.query.limit as string | undefined;
    const activeParam = req.query.active as string | undefined;
    
    const page = pageParam ? Math.max(1, parseInt(pageParam, 10)) : 1;
    const limit = limitParam ? Math.min(100, Math.max(1, parseInt(limitParam, 10))) : 25;
    
    let activeFilter: boolean | undefined;
    if (activeParam !== undefined) {
      activeFilter = activeParam.toLowerCase() === 'true';
    }

    const { applications, pagination } = await applicationService.getAllApplications(page, limit, activeFilter);

    res.status(200).json(
      createResponse(200, 'Applications fetched successfully', {
        applications,
        pagination
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getApplicationNames = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const appNames = await applicationService.getApplicationNames();

    res.status(200).json(
      createResponse(200, 'Application names fetched successfully', appNames)
    );
  } catch (error) {
    next(error);
  }
};

export const createApplication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const application = await applicationService.createApplication(req.body);
    
    res.status(201).json(
      createResponse(201, 'Application created successfully', application)
    );
  } catch (error: any) {
    res.status(400).json(createResponse(400, error.message || 'Failed to create application', null));
    next(error);
  }
};

export const updateApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, active } = req.body;

    const updatedApp = await applicationService.updateApplication(id, { name, description, active });

    res.status(200).json(
      createResponse(200, 'Application updated successfully', updatedApp)
    );
  } catch (error) {
    next(error);
  }
};

export const deleteApplication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedApp = await applicationService.deleteApplication(id);

    res.status(200).json(
      createResponse(200, 'Application deleted successfully', deletedApp)
    );
  } catch (error) {
    next(error);
  }
};

export const updateThresholdAndTimePeriod = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { threshold, time_period } = req.body;

    const updatedApp = await applicationService.updateThresholdAndTimePeriod(id, {
      threshold,
      time_period,
    });

    res.status(200).json(
      createResponse(200, 'Threshold and Time Period updated successfully', updatedApp)
    );
  } catch (error) {
    next(error);
  }
};