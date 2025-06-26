// import { Application, ApplicationInput, IApplication, validateApplication } from "../models/applicationModel";
import Application, { IApplication } from '../models/Application.model';

export const getAllApplications = async () => {
  return await Application.find({ deleted: false }).sort({ createdAt: -1 });
};

export const createApplication = async (data: Partial<IApplication>): Promise<IApplication> => {
  const application = new Application(data);
  return await application.save();
};

export const updateApplication = async (id: string, updates: { name?: string; description?: string }) => {
  const updatedApp = await Application.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!updatedApp) {
    throw new Error('Application not found');
  }

  return updatedApp;
};

export const deleteApplication = async (id: string) => {
  const application = await Application.findByIdAndUpdate(
    id,
    { deleted: true, active: false },
    { new: true }
  );

  if (!application) {
    throw new Error('Application not found');
  }

  return application;
};

export const updateThresholdAndTimePeriod = async (id: string, data: { threshold: number; time_period: number }) => {
  return await Application.findByIdAndUpdate(
    id,
    { threshold: data.threshold, time_period: data.time_period },
    { new: true }
  );
};