import Group, { IGroup } from '../models/Group.model'
import User, { IUser } from '../models/User.model'
import Application, { IApplication } from '../models/Application.model'
import ApiError from '../utils/ApiError'
import { StatusCodes } from 'http-status-codes'

export const getAllUserGroups = async (): Promise<Array<Omit<IGroup, keyof Document> & { members?: IUser[]; applications?: IApplication[] }>> => {

  const result = await Group.aggregate([
    { $match: { deleted: false } },
    
    { $sort: { name: 1 } },
    
    {
      $lookup: {
        from: 'users',
        localField: 'memberIDs',
        foreignField: '_id',
        as: 'members',
        pipeline: [
          { $sort: { username: 1 } } // Sort members by username
        ]
      }
    },
    
    {
      $lookup: {
        from: 'applications',
        localField: 'applicationIDs',
        foreignField: '_id',
        as: 'applications',
        pipeline: [
          { $sort: { name: 1 } } // Sort applications by name
        ]
      }
    }
  ])
  
  return result
}



// Create a user group and add members and applications as provided
export const createUserGroup = async (data: IGroup): Promise<IGroup> => {
  const members = data.memberIDs || []
  const applications = data.applicationIDs || []

  // Validate provided members exist
  if (members && Array.isArray(members) && members.length > 0) {
    const foundUsers = await User.find({ _id: { $in: members } })
    if (foundUsers.length !== members.length) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'One or more provided member IDs do not exist.')
    }
  }

  // Validate provided applications exist
  if (applications && Array.isArray(applications) && applications.length > 0) {
    const foundApps = await Application.find({ _id: { $in: applications } })
    if (foundApps.length !== applications.length) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'One or more provided application IDs do not exist.')
    }
  }

  // Create the group with provided data
  const groupData: Partial<IGroup> = {
    name: data.name,
    description: data.description,
    memberIDs: members,
    applicationIDs: applications,
    active: data.active ?? true,
    deleted: data.deleted ?? false,
  }

  const group = new Group(groupData)
  const savedGroup = await group.save()
  return savedGroup
}













// Update a user group by ID
// Only updates fields that are provided in the data object
// Also handles updating members and applications arrays
export const updateUserGroup = async (id: string, data: Partial<IGroup>): Promise<IGroup | null> => {

  const members = data.memberIDs || undefined
  const applications = data.applicationIDs || undefined

  // Check if group exists
  const group = await Group.findOne({ _id: id, deleted: false })
  if (!group) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Group not found.')
  }

  // Validate provided members exist
  if (members && Array.isArray(members) && members.length > 0) {
    const foundUsers = await User.find({ _id: { $in: members } })
    if (foundUsers.length !== members.length) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'One or more provided member IDs do not exist.')
    }
  }

  // Validate provided applications exist
  if (applications && Array.isArray(applications) && applications.length > 0) {
    const foundApps = await Application.find({ _id: { $in: applications } })
    if (foundApps.length !== applications.length) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'One or more provided application IDs do not exist.')
    }
  }

  // Update group with new data
  const updated = await Group.findOneAndUpdate(
    { _id: id, deleted: false },
    data,
    { new: true }
  )

  return updated
}

// Delete a user group by ID
// Marks the group as deleted and inactive, but does not remove it from the database
// Returns the deleted group object
export const deleteUserGroup = async (id: string): Promise<IGroup | null> => {
  const group = await Group.findById(id)
  if (!group) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Group not found.')
  }
  if (group.deleted) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Group is already deleted.')
  }
  const deleted = await Group.findOneAndUpdate(
    { _id: id },
    { deleted: true, active: false },
    { new: true }
  )
  return deleted
}


export const restoreUserGroup = async (id: string): Promise<IGroup | null> => {
  const group = await Group.findById(id)
  if (!group) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Group not found.')
  }
  if (!group.deleted) {     
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Group is not deleted.')
  }
  const restored = await Group.findOneAndUpdate(
    { _id: id },
    { deleted: false, active: true },
    { new: true }
  )
  return restored
}








