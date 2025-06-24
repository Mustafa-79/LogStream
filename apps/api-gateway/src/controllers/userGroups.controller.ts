import { Request, Response, NextFunction } from 'express'
import * as userGroupService from '../services/userGroups.service'

export const getUserGroups = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const groups = await userGroupService.getAllUserGroups()
        res.status(200).json({ status: 200, message: 'User groups fetched successfully', data: groups })
    } catch (error) {
        next(error)
    }
}



export const createUserGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const group = await userGroupService.createUserGroup(req.body)
        res.status(201).json({ status: 201, message: 'User group created successfully', data: group })
    } catch (error) {
        next(error)
    }
}

export const updateUserGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const group = await userGroupService.updateUserGroup(req.params.id, req.body)
        if (!group) {
            res.status(404).json({ status: 404, message: 'User group not found' })
            return
        }
        res.status(200).json({ status: 200, message: 'User group updated successfully', data: group })
        return
    } catch (error) {
        next(error)
        return
    }
}

export const deleteUserGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const group = await userGroupService.deleteUserGroup(req.params.id)
        if (!group) {
            res.status(404).json({ status: 404, message: 'User group not found' })
            return
        }
        res.status(200).json({ status: 200, message: 'User group deleted successfully', data: group })
        return
    } catch (error) {
        next(error)
        return
    }
}

export const addMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId, userId } = req.body
        const membership = await userGroupService.addMember(groupId, userId)
        res.status(200).json({ status: 200, message: 'Member added successfully', data: membership })
    } catch (error) {
        next(error)
    }
}

export const removeMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId, userId } = req.body
        const membership = await userGroupService.removeMember(groupId, userId)
        res.status(200).json({ status: 200, message: 'Member removed successfully', data: membership })
    } catch (error) {
        next(error)
    }
}

export const addApplication = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId, applicationId } = req.body
        const groupApp = await userGroupService.addApplication(groupId, applicationId)
        res.status(200).json({ status: 200, message: 'Application added successfully', data: groupApp })
    } catch (error) {
        next(error)
    }
}

export const removeApplication = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId, applicationId } = req.body
        const groupApp = await userGroupService.removeApplication(groupId, applicationId)
        res.status(200).json({ status: 200, message: 'Application removed successfully', data: groupApp })
    } catch (error) {
        next(error)
    }
}