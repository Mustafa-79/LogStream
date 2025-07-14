import { Request, Response, NextFunction } from 'express';
import { userService } from '../services';
import createResponse from '../utils/responseHelper';
import Group from '../models/Group.model';
import Application from '../models/Application.model';
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