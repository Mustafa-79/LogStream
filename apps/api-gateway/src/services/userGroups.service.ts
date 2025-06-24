//// filepath: /home/mustafaabbas/Work/Probation/LogStream/LogStream/apps/api-gateway/src/services/userGroups.service.ts
import Group, { IGroup } from '../models/Group.model'
import UserGroup, { IUserGroup } from '../models/Group-User.model'
import GroupApplication, { IGroupApplication } from '../models/Group-Application.model'
import User from '../models/User.model'
import Application from '../models/Application.model'

interface CreateUserGroupInput extends Partial<IGroup> {
  members?: string[]
  applications?: string[]
}

export const getAllUserGroups = async (): Promise<any[]> => {
  const groups = await Group.find({ deleted: false })
  const result = await Promise.all(
    groups.map(async (group) => {
      const userGroups = await UserGroup.find({ group_id: group._id, active: true })
      const members = await User.find({ _id: { $in: userGroups.map((ug) => ug.user_id) } })
      const groupApps = await GroupApplication.find({ group_id: group._id, active: true })
      const applications = await Application.find({ _id: { $in: groupApps.map((ga) => ga.application_id) } })
      return {
        ...group.toObject(),
        members,
        applications,
      }
    })
  )
  return result
}

// Create a user group and add members and applications as provided
export const createUserGroup = async (data: CreateUserGroupInput): Promise<any> => {
  const { members, applications, ...groupData } = data

  // Validate provided members exist
  if (members && Array.isArray(members) && members.length > 0) {
    const foundUsers = await User.find({ _id: { $in: members } })
    if (foundUsers.length !== members.length) {
      throw new Error('One or more provided member IDs do not exist.')
    }
  }

  // Validate provided applications exist
  if (applications && Array.isArray(applications) && applications.length > 0) {
    const foundApps = await Application.find({ _id: { $in: applications } })
    if (foundApps.length !== applications.length) {
      throw new Error('One or more provided application IDs do not exist.')
    }
  }

  const group = await new Group(groupData).save()

  // Create user group memberships if provided
  if (members && Array.isArray(members) && members.length > 0) {
    await Promise.all(
      members.map(async (userId) => {
        const exists = await UserGroup.findOne({ group_id: group._id, user_id: userId, active: true })
        if (!exists) {
          await new UserGroup({ group_id: group._id, user_id: userId }).save()
        }
      })
    )
  }

  // Create group application entries if provided
  if (applications && Array.isArray(applications) && applications.length > 0) {
    await Promise.all(
      applications.map(async (applicationId) => {
        const exists = await GroupApplication.findOne({ group_id: group._id, application_id: applicationId, active: true })
        if (!exists) {
          await new GroupApplication({ group_id: group._id, application_id: applicationId }).save()
        }
      })
    )
  }

  // Optionally reload the group data with populated members and applications if needed.
  return group
}

export const updateUserGroup = async (id: string, data: Partial<IGroup>): Promise<IGroup | null> => {
  const updated = await Group.findOneAndUpdate({ _id: id, deleted: false }, data, { new: true })
  return updated
}

export const deleteUserGroup = async (id: string): Promise<IGroup | null> => {
  const group = await Group.findById(id)
  if (!group) {
    throw new Error('Group not found.')
  }
  if (group.deleted) {
    throw new Error('Group is already deleted.')
  }
  const deleted = await Group.findOneAndUpdate(
    { _id: id },
    { deleted: true, active: false, updated_on: new Date() },
    { new: true }
  )
  return deleted
}
















export const addMember = async (groupId: string, userId: string): Promise<IUserGroup> => {
  // Check if group exists
  const group = await Group.findById(groupId)
  if (!group) {
    throw new Error('Group not found.')
  }
  // Check if user exists
  const user = await User.findById(userId)
  if (!user) {
    throw new Error('User not found.')
  }
  // Check if membership already exists
  const exists = await UserGroup.findOne({ group_id: groupId, user_id: userId, active: true })
  if (exists) {
    throw new Error('Member already exists in the group.')
  }
  const membership = new UserGroup({ group_id: groupId, user_id: userId })
  return await membership.save()
}

export const removeMember = async (groupId: string, userId: string): Promise<IUserGroup | null> => {
  const membership = await UserGroup.findOneAndUpdate(
    { group_id: groupId, user_id: userId, active: true },
    { active: false, updated_at: new Date() },
    { new: true }
  )
  if (!membership) {
    throw new Error('Member not found in the group.')
  }
  return membership
}

export const addApplication = async (groupId: string, applicationId: string): Promise<IGroupApplication> => {
  // Check if group exists
  const group = await Group.findById(groupId)
  if (!group) {
    throw new Error('Group not found.')
  }
  // Check if application exists
  const application = await Application.findById(applicationId)
  if (!application) {
    throw new Error('Application not found.')
  }
  // Check if application membership already exists
  const exists = await GroupApplication.findOne({ group_id: groupId, application_id: applicationId, active: true })
  if (exists) {
    throw new Error('Application already added to the group.')
  }
  const groupApp = new GroupApplication({ group_id: groupId, application_id: applicationId })
  return await groupApp.save()
}

export const removeApplication = async (
  groupId: string,
  applicationId: string
): Promise<IGroupApplication | null> => {
  const groupApp = await GroupApplication.findOneAndUpdate(
    { group_id: groupId, application_id: applicationId, active: true },
    { active: false, updated_at: new Date() },
    { new: true }
  )
  if (!groupApp) {
    throw new Error('Application not found in the group.')
  }
  return groupApp
}