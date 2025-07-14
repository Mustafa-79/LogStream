import { Request, Response, NextFunction } from 'express';
import { userService } from '../services';
import createResponse from '../utils/responseHelper';
import Group from '../models/Group.model';
import Application from '../models/Application.model';
import DRP from '../models/DRP.model';
import { ObjectId } from 'mongoose';



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

        console.log('User Groups:', userGroups);

        const applicationIDs = new Set<ObjectId>();

        userGroups.forEach(group => {
            group.applicationIDs.forEach(appId => {
                applicationIDs.add(appId);
            });
        });

        console.log('Application IDs:', applicationIDs);

        const applicationIDsArray = Array.from(applicationIDs);

        const applications = await Application.find({
            _id: { $in: applicationIDsArray },
            active: true,
            deleted: false
        });

        console.log('Applications:', applications);

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
        console.error('Error getting user applications:', error);
        next(error);
    }
}

export const getDRP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Find the single DRP document in the collection
        const drpDocument = await DRP.findOne();

        if (!drpDocument) {
            // If no DRP document exists, create a default one
            const defaultDRP = new DRP({
                dataRetentionPeriod: 30 // default to 30 days
            });
            
            const savedDRP = await defaultDRP.save();
            
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
        console.error('Error getting data retention period:', error);
        next(error);
    }
}

export const updateDRP = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { dataRetentionPeriod } = req.body;

        // Validate the input
        console.log('Updating DRP with:', dataRetentionPeriod);
        if (!dataRetentionPeriod || typeof dataRetentionPeriod !== 'number' || dataRetentionPeriod <= 0) {
            res.status(400).json(
                createResponse(400, 'Valid data retention period (positive number) is required', null)
            );
            return;
        }

        // Find and update the DRP document, or create one if it doesn't exist
        const updatedDRP = await DRP.findOneAndUpdate(
            {}, // empty filter to match any document (since there should be only one)
            { dataRetentionPeriod },
            { 
                new: true, // return the updated document
                upsert: true // create if doesn't exist
            }
        );

        res.status(200).json(
            createResponse(200, 'Data retention period updated successfully', {
                id: updatedDRP._id,
                dataRetentionPeriod: updatedDRP.dataRetentionPeriod
            })
        );

    } catch (error) {
        console.error('Error updating data retention period:', error);
        next(error);
    }
}