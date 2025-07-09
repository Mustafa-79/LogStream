import Application, { IApplication } from '../models/Application.model';
import { Log } from '../models/Log.model';

export const getAllApplications = async () => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const applications = await Application.find({ deleted: false }).sort({ createdAt: -1 });

    const logsAggregation = await Log.aggregate([
      {
        $match: {
          date: { $gte: twentyFourHoursAgo },
          sourceApp: { $in: applications.map(app => app._id) }
        }
      },
      {
        $group: {
          _id: "$sourceApp",
          totalLogs: { $sum: 1 },
          errorLogs: {
            $sum: {
              $cond: [{ $eq: ["$logLevel", "ERROR"] }, 1, 0]
            }
          }
        }
      }
    ]);
    

    const logStatsMap = new Map<string, { totalLogs: number; errorLogs: number }>();
    logsAggregation.forEach(stat => {
      logStatsMap.set(stat._id.toString(), {
        totalLogs: stat.totalLogs,
        errorLogs: stat.errorLogs
      });
    });

    const enrichedApplications = applications.map(app => {
      const stats = logStatsMap.get((app as any)._id.toString()) || { totalLogs: 0, errorLogs: 0 };
      return {
        ...app.toObject(),
        logsToday: stats.totalLogs,
        errorsToday: stats.errorLogs
      };
    });

    return enrichedApplications;
  } catch (error) {
    console.error('Error in getAllApplications:', error);
    throw new Error('Failed to fetch applications with log stats.');
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