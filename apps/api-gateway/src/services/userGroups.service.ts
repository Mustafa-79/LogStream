import Group, { IGroup } from '../models/Group.model'
import GroupUser, { IGroupUser } from '../models/GroupUser.model'
import GroupApplication, { IGroupApplication } from '../models/GroupApplication.model'
import User, { IUser } from '../models/User.model'
import Application, { IApplication } from '../models/Application.model'

// Get all user groups with their members and applications
export const getAllUserGroups = async (): Promise<Array<Omit<IGroup, keyof Document> & { members?: IUser[]; applications?: IApplication[] }>> => {
  const groups = await Group.find({ deleted: false }).lean()
  const result = await Promise.all(
    groups.map(async (group) => {
      const groupUsers = await GroupUser.find({ groupId: group._id, active: true })
      const members = await User.find({ _id: { $in: groupUsers.map((ug) => ug.userId) } }).lean()
      const groupApps = await GroupApplication.find({ groupId: group._id, active: true })
      const applications = await Application.find({ _id: { $in: groupApps.map((ga) => ga.applicationId) } }).lean()
      return {
        ...group,
        members,
        applications,
      }
    })
  )
  return result
}

interface CreateUserGroupInput extends Partial<IGroup> {
  members?: string[]
  applications?: string[]
}

// Create a user group and add members and applications as provided
export const createUserGroup = async (data: CreateUserGroupInput): Promise<IGroup> => {
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
        const exists = await GroupUser.findOne({ groupId: group._id, userId: userId, active: true })
        if (!exists) {
          await new GroupUser({ groupId: group._id, userId: userId }).save()
        }
      })
    )
  }

  // Create group application entries if provided
  if (applications && Array.isArray(applications) && applications.length > 0) {
    await Promise.all(
      applications.map(async (applicationId) => {
        const exists = await GroupApplication.findOne({ groupId: group._id, applicationId: applicationId, active: true })
        if (!exists) {
          await new GroupApplication({ groupId: group._id, applicationId: applicationId }).save()
        }
      })
    )
  }

  // Return the created group with populated members and applications
  return group
}

// Update a user group by ID
// Only updates fields that are provided in the data object
export const updateUserGroup = async (id: string, data: Partial<IGroup>): Promise<IGroup | null> => {
  const updated = await Group.findOneAndUpdate(
    { _id: id, deleted: false },
    data,
    { new: true }
  )
  if (!updated) {
    throw new Error('Group not found.')
  }
  return updated
}

// Delete a user group by ID
// Marks the group as deleted and inactive, but does not remove it from the database
// Returns the deleted group object
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
    { deleted: true, active: false },
    { new: true }
  )
  return deleted
}
















export const addMember = async (groupId: string, userId: string): Promise<IGroupUser> => {
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
  const exists = await GroupUser.findOne({ groupId: groupId, userId: userId, active: true })
  if (exists) {
    throw new Error('Member already exists in the group.')
  }
  const membership = new GroupUser({ groupId: groupId, userId: userId })
  return await membership.save()
}

export const removeMember = async (groupId: string, userId: string): Promise<IGroupUser | null> => {
  const membership = await GroupUser.findOneAndUpdate(
    { groupId: groupId, userId: userId, active: true },
    { active: false },
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
  const exists = await GroupApplication.findOne({ groupId: groupId, applicationId: applicationId, active: true })
  if (exists) {
    throw new Error('Application already added to the group.')
  }
  const groupApp = new GroupApplication({ groupId: groupId, applicationId: applicationId })
  return await groupApp.save()
}

export const removeApplication = async (
  groupId: string,
  applicationId: string
): Promise<IGroupApplication | null> => {
  const groupApp = await GroupApplication.findOneAndUpdate(
    { groupId: groupId, applicationId: applicationId, active: true },
    { active: false },
    { new: true }
  )
  if (!groupApp) {
    throw new Error('Application not found in the group.')
  }
  return groupApp
}