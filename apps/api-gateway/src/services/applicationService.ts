import Application, { IApplication } from '../models/Application.model';

export const getAllApplications = async () => {
  try {
    return await Application.find({ deleted: false }).sort({ createdAt: -1 });
  } catch (error) {
    console.error('Error in getAllApplications:', error);
    throw new Error('Failed to fetch applications.');
  }
};

export const createApplication = async (data: Partial<IApplication>): Promise<IApplication> => {
  try {
    const application = new Application(data);
    return await application.save();
  } catch (error: any) {
    if (error.code === 11000 && error.keyPattern?.name) {
      throw new Error(`Application with name "${data.name}" already exists.`);
    }

    console.error('Error in createApplication:', error);
    throw new Error('Failed to create application.');
  }
};

export const updateApplication = async (
  id: string,
  updates: { name?: string; description?: string, active?: boolean }
) => {
  try {
    const updatedApp = await Application.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedApp) {
      throw new Error('Application not found');
    }

    return updatedApp;
  } catch (error: any) {
    if (error.code === 11000 && error.keyPattern?.name) {
      throw new Error(`Application with this name already exists.`);
    }

    console.error('Error in updateApplication:', error);
    throw new Error('Failed to update application.');
  }
};

export const deleteApplication = async (id: string) => {
  try {
    const application = await Application.findByIdAndUpdate(
      id,
      { deleted: true, active: false },
      { new: true }
    );

    if (!application) {
      throw new Error('Application not found');
    }

    return application;
  } catch (error) {
    console.error('Error in deleteApplication:', error);
    throw new Error('Failed to delete application.');
  }
};

export const updateThresholdAndTimePeriod = async (
  id: string,
  data: { threshold: number; time_period: number }
) => {
  try {
    const updatedApp = await Application.findByIdAndUpdate(
      id,
      {
        threshold: data.threshold,
        time_period: data.time_period,
      },
      { new: true }
    );

    if (!updatedApp) {
      throw new Error('Application not found');
    }

    return updatedApp;
  } catch (error) {
    console.error('Error in updateThresholdAndTimePeriod:', error);
    throw new Error('Failed to update threshold and time period.');
  }
};