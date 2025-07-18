import Joi from 'joi'


export const userGroupValidation = {

  getUserGroups: {
    query: Joi.object({
      page:             Joi.number().integer().min(1).default(1).label('Page Number'),
      search:           Joi.string().trim().allow('').max(100).label('Search Term'),
      status:           Joi.string().valid('active', 'inactive', 'all').default('all').label('Status Filter'),
      applicationIds:   Joi.string().allow('').pattern(/^[a-fA-F0-9,]*$/).label('Application IDs (comma-separated)'),
    }),
  },
  
  createUserGroup: {
    body: Joi.object({
      name:           Joi.string().trim().required().min(5).max(20).label('Group Name'),
      description:    Joi.string().trim().required().min(10).max(100).label('Group Description'),
      memberIDs:      Joi.array().items(Joi.string().length(24).hex()).optional().label('Group Member IDs'),
      applicationIDs: Joi.array().items(Joi.string().length(24).hex()).optional().label('Group Application IDs'),
      active:         Joi.boolean().required().label('Group Active Status'),
    }),
  },

  updateUserGroup: {
    params: Joi.object({
      id:             Joi.string().required().length(24).hex().label('Group ID'),
    }),

    body: Joi.object({
      name:           Joi.string().trim().min(5).max(20).label('Group Name'),
      description:    Joi.string().trim().min(10).max(100).label('Group Description'),
      memberIDs:      Joi.array().items(Joi.string().length(24).hex()).optional().unique().label('Group Member IDs'),
      applicationIDs: Joi.array().items(Joi.string().length(24).hex()).optional().unique().label('Group Application IDs'),
      active:         Joi.boolean().optional().label('Group Active Status'),
    }).or('name', 'description', 'memberIDs', 'applicationIDs', 'active'),
  },

  deleteUserGroup: {
    params: Joi.object({
      id:             Joi.string().required().length(24).hex().label('Group ID'),
    }),
  },

  restoreUserGroup: {
    params: Joi.object({
      id:             Joi.string().required().length(24).hex().label('Group ID'),
    }),
  },

  addUserToGroup: {
    params: Joi.object({
      id:             Joi.string().required().length(24).hex().label('Group ID'),
    }),
    body: Joi.object({
      userId:         Joi.string().required().length(24).hex().label('User ID'),
    }),
  },

  removeUserFromGroup: {
    params: Joi.object({
      id:             Joi.string().required().length(24).hex().label('Group ID'),
    }),
    body: Joi.object({
      userId:         Joi.string().required().length(24).hex().label('User ID'),
    }),
  },

}

