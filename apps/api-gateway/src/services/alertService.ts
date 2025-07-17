import Alert from '../models/Alert.model';
import Group from '../models/Group.model';
import Application from '../models/Application.model';
import ApiError from '../utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';

export const resolveAlert = async (id: string) => {
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid alert ID format');
  }

  const alert = await Alert.findByIdAndUpdate(
    id,
    { resolved: true },
    { new: true }
  );

  if (!alert) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Alert not found');
  }

  return alert;
};

export const getAlerts = async (userId: string) => {
  // Validate userId format
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid user ID format');
  }

  // Step 1: Find all user groups that include the user as a member
  const userGroups = await Group.find({
    memberIDs: userId,
    active: true,
    deleted: false
  });

  if (userGroups.length === 0) {
    return [];
  }

  // Step 2: Extract all application IDs from those user groups
  const applicationIds: string[] = [];
  userGroups.forEach(group => {
    group.applicationIDs.forEach(appId => {
      applicationIds.push(appId.toString());
    });
  });

  // Remove duplicates
  const uniqueAppIds = [...new Set(applicationIds)];

  if (uniqueAppIds.length === 0) {
    return [];
  }

  // Step 3: Filter alerts to only include alerts for those appIDs (exclude resolved alerts)
  const alerts = await Alert.find({
    appId: { $in: uniqueAppIds },
    resolved: false
  }).sort({ timestamp: -1 });

  if (alerts.length === 0) {
    return [];
  }

  // Step 4: Get application names for the alerts
  const applications = await Application.find({
    _id: { $in: uniqueAppIds },
    active: true,
    deleted: false
  }).select('name').lean();

  // Create a map for quick lookup
  const appNameMap = new Map(
    applications.map(app => [app._id!.toString(), app.name])
  );

  // Step 5: Enrich alerts with application names
  const results = alerts.map(alert => ({
    ...alert.toObject(),
    applicationName: appNameMap.get(alert.appId) || 'Unknown Application'
  }));

  return results;
};