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
