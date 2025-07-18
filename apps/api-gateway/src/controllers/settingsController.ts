import { Request, Response, NextFunction } from 'express';
import { userService } from '../services';
import createResponse from '../utils/responseHelper';
import Group from '../models/Group.model';
import Application from '../models/Application.model';
import DRP from '../models/DRP.model';
import { ObjectId } from 'mongoose';
import { logRetentionService } from '../services/dataRetentionService';
import logger from '../config/logger';

// Settings controller debug logger
const settingsDebugger = logger.withTraceId('SETTINGS_CTRL');

export const getUserApplications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userEmail = req.user?.email;

        if (!userEmail) {
            res.status(401).json(
                createResponse(401, 'User email not found in request', null)
            );
            return;
        }

        const user = await userService.getUserByEmail(userEmail);

        if (!user) {
            res.status(404).json(
                createResponse(404, 'User not found', null)
            );
            return;
        }

        
        const userGroups = await Group.find({
            memberIDs: { $in: [user._id] },
            active: true,
            deleted: false
        });

        const applicationIDs = new Set<ObjectId>();

        userGroups.forEach(group => {
            group.applicationIDs.forEach(appId => {
                applicationIDs.add(appId);
            });
        });

        const applicationIDsArray = Array.from(applicationIDs);

        const applications = await Application.find({
            _id: { $in: applicationIDsArray },
            active: true,
            deleted: false
        });

        res.status(200).json(
            createResponse(200, 'User applications retrieved successfully', {
                applications: applications.map(app => ({
                    id: app._id,
                    name: app.name,
                    description: app.description,
                    threshold: app.threshold,
                    timePeriod: app.timePeriod,
                    active: app.active,
                    notificationsEnabled: app.notificationsEnabled,
                })),
                totalApplications: applications.length
            })
        );

    } catch (error) {
        settingsDebugger.error('Error getting user applications:', error);
        next(error);
    }
}

export const getDRP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const drpDocument = await DRP.findOne();

        if (!drpDocument) {
            const defaultDRP = new DRP({
                dataRetentionPeriod: 30
            });
            
            const savedDRP = await defaultDRP.save();
            
            // Initialize log retention with default value
            await logRetentionService.updateLogRetention(savedDRP.dataRetentionPeriod);
            
            res.status(200).json(
                createResponse(200, 'Data retention period retrieved successfully (default created)', {
                    dataRetentionPeriod: savedDRP.dataRetentionPeriod
                })
            );
            return;
        }

        res.status(200).json(
            createResponse(200, 'Data retention period retrieved successfully', {
                dataRetentionPeriod: drpDocument.dataRetentionPeriod
            })
        );

    } catch (error) {
        settingsDebugger.error('Error getting data retention period:', error);
        next(error);
    }
}

export const updateDRP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { dataRetentionPeriod } = req.body;

        if (!dataRetentionPeriod || typeof dataRetentionPeriod !== 'number' || dataRetentionPeriod <= 0) {
            res.status(400).json(
                createResponse(400, 'Valid data retention period (positive number) is required', null)
            );
            return;
        }

        const updatedDRP = await DRP.findOneAndUpdate(
            {},
            { dataRetentionPeriod },
            { 
                new: true,
                upsert: true
            }
        );

        // Update log TTL index
        await logRetentionService.updateLogRetention(dataRetentionPeriod);

        res.status(200).json(
            createResponse(200, 'Data retention period updated successfully', {
                id: updatedDRP._id,
                dataRetentionPeriod: updatedDRP.dataRetentionPeriod
            })
        );

    } catch (error) {
        settingsDebugger.error('Error updating data retention period:', error);
        next(error);
    }
}

export const saveSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { enableAlerts, applications, dataRetentionPeriod } = req.body;
        const userEmail = req.user?.email;

        if (!userEmail) {
            res.status(401).json(
                createResponse(401, 'User email not found in request', null)
            );
            return;
        }

        // Validate input
        const validationError = validateSaveSettingsInput({ enableAlerts, applications, dataRetentionPeriod });
        if (validationError) {
            res.status(400).json(
                createResponse(400, validationError, null)
            );
            return;
        }

        let applicationsResult;

        if (enableAlerts === false) {
            // Step 1: Disable notifications for all applications
            applicationsResult = await disableNotificationsForApplications(applications);
        } else {
            // Step 2: Update application settings
            applicationsResult = await updateApplicationSettings(applications);
        }

        // Step 3: Update data retention period if different
        const drpResult = await updateDataRetentionPeriodIfChanged(dataRetentionPeriod);

        res.status(200).json(
            createResponse(200, 'Settings saved successfully', {
                enableAlerts,
                applications: applicationsResult,
                dataRetentionPeriod: drpResult
            })
        );

    } catch (error) {
        settingsDebugger.error('Error saving settings:', error);
        next(error);
    }
};

// Helper function to validate input for saveSettings
const validateSaveSettingsInput = (input: { enableAlerts: unknown, applications: unknown, dataRetentionPeriod: unknown }): string | null => {
    const { enableAlerts, applications, dataRetentionPeriod } = input;

    if (typeof enableAlerts !== 'boolean') {
        return 'enableAlerts must be a boolean';
    }

    if (!applications || typeof applications !== 'object') {
        return 'applications must be an object';
    }

    if (typeof dataRetentionPeriod !== 'number' || dataRetentionPeriod <= 0) {
        return 'dataRetentionPeriod must be a positive number';
    }

    return null; // Valid
};

// Helper function to disable notifications for all applications (Step 1)
const disableNotificationsForApplications = async (applications: Record<string, { id: string; name: string; threshold: string; period: number; status: boolean }>): Promise<{ message: string; applicationsUpdated: number; totalApplications?: number; applicationIds?: string[] }> => {
    try {
        // Extract application IDs from the applications object
        const applicationIds = Object.values(applications)
            .map((app: { id: string }) => app.id)
            .filter(id => id); // Filter out any undefined/null IDs

        if (applicationIds.length === 0) {
            return { message: 'No valid application IDs found', applicationsUpdated: 0 };
        }

        // Set notificationsEnabled to false for all applications
        const updateResult = await Application.updateMany(
            { _id: { $in: applicationIds } },
            { $set: { notificationsEnabled: false } }
        );

        settingsDebugger.info(`Disabled notifications for ${updateResult.modifiedCount} applications`);

        return {
            message: 'Notifications disabled for all applications',
            applicationsUpdated: updateResult.modifiedCount,
            totalApplications: applicationIds.length,
            applicationIds
        };
    } catch (error) {
        settingsDebugger.error('Error disabling notifications:', error);
        throw error;
    }
};

// Helper function to update application settings (Step 2)
const updateApplicationSettings = async (applications: Record<string, { id: string; name: string; threshold: string; period: number; status: boolean }>): Promise<{ message: string; applicationsUpdated: number; totalApplications: number; applicationIds: string[] }> => {
    try {
        const applicationUpdates = [];
        const applicationIds = [];

        for (const appData of Object.values(applications)) {
            const { id, name, threshold, period, status } = appData;
            
            // Validate application data
            if (!id || !name || !threshold || typeof period !== 'number' || typeof status !== 'boolean') {
                throw new Error(`Invalid data for application ${name}`);
            }

            // Convert period from seconds back to minutes for storage
            const timePeriodInMinutes = Math.round(period / 60);

            applicationUpdates.push({
                updateOne: {
                    filter: { _id: id },
                    update: {
                        threshold: parseInt(threshold, 10),
                        timePeriod: timePeriodInMinutes,
                        notificationsEnabled: status
                    }
                }
            });

            applicationIds.push(id);
        }

        if (applicationUpdates.length === 0) {
            return { 
                message: 'No applications to update', 
                applicationsUpdated: 0, 
                totalApplications: 0, 
                applicationIds: [] 
            };
        }

        // Bulk update applications
        const updateResult = await Application.bulkWrite(applicationUpdates);

        settingsDebugger.info(`Updated settings for ${updateResult.modifiedCount} applications`);

        return {
            message: 'Application settings updated successfully',
            applicationsUpdated: updateResult.modifiedCount || 0,
            totalApplications: applicationIds.length,
            applicationIds
        };
    } catch (error) {
        settingsDebugger.error('Error updating application settings:', error);
        throw error;
    }
};

// Helper function to update data retention period if changed (Step 3)
const updateDataRetentionPeriodIfChanged = async (newDataRetentionPeriod: number): Promise<{ message: string; updated: boolean; dataRetentionPeriod: number }> => {
    try {
        const currentDRP = await DRP.findOne();
        
        if (!currentDRP) {
            const newDRP = new DRP({ dataRetentionPeriod: newDataRetentionPeriod });
            await newDRP.save();
            
            await logRetentionService.updateLogRetention(newDataRetentionPeriod);
            
            return {
                message: 'Data retention period created',
                updated: true,
                dataRetentionPeriod: newDataRetentionPeriod
            };
        }

        if (currentDRP.dataRetentionPeriod !== newDataRetentionPeriod) {
            currentDRP.dataRetentionPeriod = newDataRetentionPeriod;
            await currentDRP.save();
            
            await logRetentionService.updateLogRetention(newDataRetentionPeriod);
            
            return {
                message: 'Data retention period updated',
                updated: true,
                dataRetentionPeriod: newDataRetentionPeriod
            };
        }

        return {
            message: 'Data retention period unchanged',
            updated: false,
            dataRetentionPeriod: currentDRP.dataRetentionPeriod
        };
    } catch (error) {
        settingsDebugger.error('Error updating data retention period:', error);
        throw error;
    }
};