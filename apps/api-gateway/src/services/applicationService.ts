import Application, { IApplication } from '../models/Application.model';
import { Log } from '../models/Log.model';
import Group from '../models/Group.model';
import mongoose from 'mongoose';

export const getAllApplications = async (
  page: number = 1,
  limit: number = 25,
  active?: boolean
): Promise<{
  applications: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    limit: number;
  };
}> => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const skip = (page - 1) * limit;

    const filterQuery: any = { deleted: false };
    
    if (active !== undefined) {
      filterQuery.active = active;
    }


    const totalCount = await Application.countDocuments(filterQuery);

    const applications = await Application.find(filterQuery)
      .collation({ locale: 'en', strength: 2 })
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);


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

    const totalPages = Math.ceil(totalCount / limit);

    const pagination = {
      currentPage: page,
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      limit
    };

    return {
      applications: enrichedApplications,
      pagination
    };
  } catch (error) {
    console.error('Error in getAllApplications:', error);
    throw new Error('Failed to fetch applications with log stats.');
  }
};

export const getApplicationNames = async (): Promise<{ value: string; label: string }[]> => {
  try {
    const applications = await Application.find({ deleted: false }, 'name _id').sort({ createdAt: -1 });
    return applications.map(app => ({
      value: (app as any)._id.toString(),
      label: app.name
    }));
  } catch (error) {
    console.error('Error in getApplicationNames:', error);
    throw new Error('Failed to fetch application names.');
  }
};

export const getApplications = async (): Promise<IApplication[]> => {
  try {
    return await Application.find({ deleted: false });
  } catch (error) {
    console.error('Error in getApplications:', error);
    throw new Error('Failed to fetch applications.');
  }
};

export const createApplication = async (data: Partial<IApplication>): Promise<IApplication> => {
  try {
    const existingApp = await Application.findOne({ name: data.name, deleted: false });
    if (existingApp) {
      throw new Error(`Application with name "${data.name}" already exists.`);
    }

    const application = new Application(data);
    await application.save();

    // Add applicationID to Administrators group
    await Group.findOneAndUpdate(
      { name: 'Administrators', deleted: false },
      { $push: { applicationIDs: application._id } },
      { new: true }
    );
    return application;

  } catch (error: any) {
    console.error('Error in createApplication:', error);
    throw error;
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