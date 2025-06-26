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

export const addMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId, userId } = req.body
        const membership = await userGroupService.addMember(groupId, userId)

        res.status(200).json(
            createResponse(200, 'Member added to user group successfully', membership)
        )
    } catch (error) {
        next(error)
    }
}

export const removeMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId, userId } = req.body
        const membership = await userGroupService.removeMember(groupId, userId)
        res.status(200).json(
            createResponse(200, 'Member removed successfully', membership)
        )
    } catch (error) {
        next(error)
    }
}

export const addApplication = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId, applicationId } = req.body
        const groupApp = await userGroupService.addApplication(groupId, applicationId)
        res.status(200).json(
            createResponse(200, 'Application added successfully', groupApp)
        )
    } catch (error) {
        next(error)
    }
}

export const removeApplication = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId, applicationId } = req.body
        const groupApp = await userGroupService.removeApplication(groupId, applicationId)
        res.status(200).json(
            createResponse(200, 'Application removed successfully', groupApp)
        )
    } catch (error) {
        next(error)
    }
}
