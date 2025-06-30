import Joi from 'joi'


export const userGroupValidation = {
  
  createUserGroup: {
    body: Joi.object({
      name:           Joi.string().trim().required().min(1).label('Group Name'),
      description:    Joi.string().allow('').required().label('Group Description'),
      members:        Joi.array().items(Joi.string()).optional().label('Group Members'),
      applications:   Joi.array().items(Joi.string()).optional().label('Group Applications'),
    }),
  },

  updateUserGroup: {
    params: Joi.object({
      id:             Joi.string().required().length(24).label('Group ID'),
    }),

    body: Joi.object({
      name:           Joi.string().trim().min(1).label('Group Name'),
      description:    Joi.string().min(1).label('Group Description'),
    }).or('name', 'description'),
  },

  deleteUserGroup: {
    params: Joi.object({
      id:             Joi.string().required().length(24).label('Group ID'),
    }),
  },

  addRemoveMember: {
    body: Joi.object({
      groupId:        Joi.string().required().label('Group ID'),
      userId:         Joi.string().required().label('User ID'),
    }),
  },

  addRemoveApplication: {
    body: Joi.object({
      groupId:        Joi.string().required().label('Group ID'),
      applicationId:  Joi.string().required().label('Application ID'),
    }),
  },

}

