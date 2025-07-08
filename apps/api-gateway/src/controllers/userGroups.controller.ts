import { Request, Response, NextFunction } from 'express'
import { userGroupService } from '../services'
import createResponse from '../utils/responseHelper'

export const getUserGroups = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const groups = await userGroupService.getAllUserGroups()
        res.status(200).json(
            createResponse(200, 'User groups fetched successfully', groups)
        )
    } catch (error) {
        next(error)
    }
}

export const createUserGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const group = await userGroupService.createUserGroup(req.body)
        res.status(201).json(
            createResponse(201, 'User group created successfully', group)
        )
    } catch (error) {
        next(error)
    }
}

export const updateUserGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const group = await userGroupService.updateUserGroup(req.params.id, req.body)

        res.status(200).json(
            createResponse(200, 'User group updated successfully', group)
        )
    } catch (error) {
        next(error)
    }
}

export const deleteUserGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const group = await userGroupService.deleteUserGroup(req.params.id)
        res.status(200).json(
            createResponse(200, 'User group deleted successfully', group)
        )
    } catch (error) {
        next(error)
    }
}

export const restoreUserGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const group = await userGroupService.restoreUserGroup(req.params.id)
        res.status(200).json(
            createResponse(200, 'User group restored successfully', group)
        )
    } catch (error) {
        next(error)
    }
}

export const addUserToGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params; // group ID
        const { userId } = req.body;

        if (!userId) {
            res.status(400).json(
                createResponse(400, 'User ID is required', null)
            );
            return;
        }

        const group = await userGroupService.addUserToGroup(id, userId);
        res.status(200).json(
            createResponse(200, 'User added to group successfully', group)
        );
    } catch (error) {
        console.error('Error adding user to group:', error);
        next(error);
    }
}

export const removeUserFromGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params; // group ID
        const { userId } = req.body;

        if (!userId) {
            res.status(400).json(
                createResponse(400, 'User ID is required', null)
            );
            return;
        }

        const group = await userGroupService.removeUserFromGroup(id, userId);
        res.status(200).json(
            createResponse(200, 'User removed from group successfully', group)
        );
    } catch (error) {
        console.error('Error removing user from group:', error);
        next(error);
    }
};
