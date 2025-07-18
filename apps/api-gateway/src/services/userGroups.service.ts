import Group, { IGroup } from '../models/Group.model'
import User, { IUser } from '../models/User.model'
import Application, { IApplication } from '../models/Application.model'
import ApiError from '../utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { Types, PipelineStage } from 'mongoose'

export interface GetUserGroupsOptions {
  page?: number
  search?: string
  status?: 'active' | 'inactive' | 'all'
  applicationIds?: string[]
}

export interface PaginatedUserGroupsResponse {
  groups: Array<Omit<IGroup, keyof Document> & { members?: IUser[]; applications?: IApplication[] }>
  pagination: {
    currentPage: number
    totalPages: number
    totalGroups: number
    groupsPerPage: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id: string): boolean => {
  return Types.ObjectId.isValid(id)
}

// Helper function to validate array of ObjectIds
const validateObjectIds = (ids: string[]): boolean => {
  return ids.every(id => isValidObjectId(id))
}

export const getAllUserGroups = async (options: GetUserGroupsOptions = {}): Promise<PaginatedUserGroupsResponse> => {
  const {
    page = 1,
    search = '',
    status = 'all',
    applicationIds = []
  } = options

  // Fixed limit to 4 groups per page
  const limit = 4

  // Validate ObjectIds
  if (applicationIds.length > 0 && !validateObjectIds(applicationIds)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'One or more application IDs are invalid.')
  }

  // Build aggregation pipeline
  const pipeline: PipelineStage[] = []

  // Build match conditions first to filter early
  const matchConditions: Record<string, unknown> = { deleted: false }

  // Add status filter
  if (status === 'active') {
    matchConditions.active = true
  } else if (status === 'inactive') {
    matchConditions.active = false
  }

  // Add search filter (only for group name)
  if (search && search.trim() !== '') {
    matchConditions.name = { $regex: search.trim(), $options: 'i' }
  }

  // Add application filter - match groups that have ALL specified applications
  if (applicationIds.length > 0) {
    matchConditions.applicationIDs = { $all: applicationIds.map(id => new Types.ObjectId(id)) }
  }

  // Match early to reduce documents in pipeline
  pipeline.push({ $match: matchConditions })

  // Then lookup members and applications
  pipeline.push(
    {
      $lookup: {
        from: 'users',
        localField: 'memberIDs',
        foreignField: '_id',
        as: 'members',
        pipeline: [{ $sort: { username: 1 } }]
      }
    },
    {
      $lookup: {
        from: 'applications',
        localField: 'applicationIDs',
        foreignField: '_id',
        as: 'applications',
        pipeline: [
          { $match: { deleted: false } },
          { $sort: { name: 1 } }
        ]
      }
    }
  )

  // Always sort by name alphabetically
  pipeline.push({ $sort: { name: 1 } })

  // Use facet to get count and data in single query
  const skip = (page - 1) * limit
  pipeline.push({
    $facet: {
      data: [{ $skip: skip }, { $limit: limit }],
      count: [{ $count: 'total' }]
    }
  })

  const [result] = await Group.aggregate(pipeline)
  const totalGroups = result.count[0]?.total || 0
  const totalPages = Math.ceil(totalGroups / limit)

  return {
    groups: result.data,
    pagination: {
      currentPage: page,
      totalPages,
      totalGroups,
      groupsPerPage: limit,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }
}



// Create a user group and add members and applications as provided
export const createUserGroup = async (data: IGroup): Promise<IGroup> => {
  const members = data.memberIDs || []
  const applications = data.applicationIDs || []

  // Validate provided member ObjectIds
  if (members.length > 0 && !validateObjectIds(members.map(id => id.toString()))) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'One or more member IDs have invalid format.');
  }

  // Validate provided application ObjectIds
  if (applications.length > 0 && !validateObjectIds(applications.map(id => id.toString()))) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'One or more application IDs have invalid format.');
  }

  // Check if a group with the same name already exists (not deleted), case-insensitive
  const existingGroup = await Group.findOne({ 
    name: { $regex: `^${data.name}$`, $options: 'i' }, 
    deleted: false 
  }).lean()
  if (existingGroup) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'A group with this name already exists.')
  }

  // Validate members and applications in parallel
  const validationPromises = []
  
  if (members && Array.isArray(members) && members.length > 0) {
    validationPromises.push(
      User.find({ _id: { $in: members }, active: true }).lean()
        .then(foundUsers => {
          if (foundUsers.length !== members.length) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'One or more provided member IDs do not exist or are inactive.')
          }
        })
    )
  }

  if (applications && Array.isArray(applications) && applications.length > 0) {
    validationPromises.push(
      Application.find({ _id: { $in: applications }, deleted: false }).lean()
        .then(foundApps => {
          if (foundApps.length !== applications.length) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'One or more provided application IDs do not exist or are deleted.')
          }
        })
    )
  }

  await Promise.all(validationPromises)

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
  // Validate ObjectId
  if (!isValidObjectId(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid group ID format.');
  }

  const members = data.memberIDs || undefined
  const applications = data.applicationIDs || undefined

  // Check if group exists
  const group = await Group.findOne({ _id: id, deleted: false }).lean()
  if (!group) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Group not found or has been deleted.')
  }

  // Check name uniqueness and validate members/applications in parallel
  const validationPromises = []

  // Check if another group with the same name exists (not deleted), case-insensitive
  if (data.name) {
    validationPromises.push(
      Group.findOne({
        name: { $regex: `^${data.name}$`, $options: 'i' },
        _id: { $ne: id },
        deleted: false
      }).lean().then(existingGroup => {
        if (existingGroup) {
          throw new ApiError(StatusCodes.BAD_REQUEST, 'A group with this name already exists.')
        }
      })
    )
  }

  // Validate provided members exist and are active
  if (members && Array.isArray(members) && members.length > 0) {
    // Validate ObjectId format
    if (!validateObjectIds(members.map(id => id.toString()))) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'One or more member IDs have invalid format.');
    }
    
    validationPromises.push(
      User.find({ _id: { $in: members }, active: true }).lean()
        .then(foundUsers => {
          if (foundUsers.length !== members.length) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'One or more provided member IDs do not exist or are inactive.')
          }
        })
    )
  }

  // Validate provided applications exist and are not deleted
  if (applications && Array.isArray(applications) && applications.length > 0) {
    // Validate ObjectId format
    if (!validateObjectIds(applications.map(id => id.toString()))) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'One or more application IDs have invalid format.');
    }
    
    validationPromises.push(
      Application.find({ _id: { $in: applications }, deleted: false }).lean()
        .then(foundApps => {
          if (foundApps.length !== applications.length) {
            throw new ApiError(StatusCodes.BAD_REQUEST, 'One or more provided application IDs do not exist or are deleted.')
          }
        })
    )
  }

  await Promise.all(validationPromises)

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
  // Validate ObjectId
  if (!isValidObjectId(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid group ID format.');
  }

  // Find and update in single query with validation
  const deleted = await Group.findOneAndUpdate(
    { _id: id, deleted: false },
    { deleted: true, active: false },
    { new: true }
  )
  
  if (!deleted) {
    // Check if group exists but is already deleted
    const group = await Group.findById(id).lean()
    if (!group) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Group not found.')
    }
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Group is already deleted.')
  }
  
  return deleted
}


export const restoreUserGroup = async (id: string): Promise<IGroup | null> => {
  // Validate ObjectId
  if (!isValidObjectId(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid group ID format.');
  }

  const group = await Group.findById(id).lean()
  if (!group) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Group not found.')
  }
  if (!group.deleted) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Group is not deleted.')
  }
  
  // Check for name conflicts before restoring
  const existingGroup = await Group.findOne({ 
    name: { $regex: `^${group.name}$`, $options: 'i' }, 
    _id: { $ne: id },
    deleted: false 
  }).lean()
  if (existingGroup) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Cannot restore: A group with this name already exists.')
  }

  const restored = await Group.findOneAndUpdate(
    { _id: id },
    { deleted: false, active: true },
    { new: true }
  )
  return restored
}

export const addUserToGroup = async (groupId: string, userId: string): Promise<IGroup | null> => {
  // Validate ObjectIds
  if (!isValidObjectId(groupId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid group ID format.');
  }
  
  if (!isValidObjectId(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid user ID format.');
  }

  // Check group and user existence in parallel
  const [group, user] = await Promise.all([
    Group.findOne({ _id: groupId, deleted: false }).lean(),
    User.findById(userId).lean()
  ])

  if (!group) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Group not found or has been deleted.');
  }

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.');
  }

  // Check if user is already in the group
  const memberIdStrings = group.memberIDs.map(id => id.toString());
  if (memberIdStrings.includes(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User is already a member of this group.');
  }

  // Add user to group
  const updatedGroup = await Group.findByIdAndUpdate(
    groupId,
    { $push: { memberIDs: userId } },
    { new: true }
  );

  return updatedGroup;
};

export const removeUserFromGroup = async (groupId: string, userId: string): Promise<IGroup | null> => {
  // Validate ObjectIds
  if (!isValidObjectId(groupId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid group ID format.');
  }
  
  if (!isValidObjectId(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid user ID format.');
  }

  // Check group and user existence in parallel
  const [group, user] = await Promise.all([
    Group.findOne({ _id: groupId, deleted: false }).lean(),
    User.findById(userId).lean()
  ])

  if (!group) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Group not found or has been deleted.');
  }

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found.');
  }

  // Check if user is in the group
  const memberIdStrings = group.memberIDs.map(id => id.toString());
  if (!memberIdStrings.includes(userId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'User is not a member of this group.');
  }

  // Remove user from group
  const updatedGroup = await Group.findByIdAndUpdate(
    groupId,
    { $pull: { memberIDs: userId } },
    { new: true }
  );

  return updatedGroup;
};








