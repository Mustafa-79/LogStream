import Joi from 'joi'


export const userGroupValidation = {
  
  createUserGroup: {
    body: Joi.object({
      name:           Joi.string().trim().required().min(1).label('Group Name'),
      description:    Joi.string().allow('').required().label('Group Description'),
      members:        Joi.array().items(Joi.string().length(24)).optional().label('Group Member IDs'),
      applications:   Joi.array().items(Joi.string().length(24)).optional().label('Group Application IDs'),
    }),
  },

  updateUserGroup: {
    params: Joi.object({
      id:             Joi.string().required().length(24).label('Group ID'),
    }),

    body: Joi.object({
      name:           Joi.string().trim().min(1).label('Group Name'),
      description:    Joi.string().allow('').label('Group Description'),
      members:        Joi.array().items(Joi.string().length(24)).optional().label('Group Member IDs'),
      applications:   Joi.array().items(Joi.string().length(24)).optional().label('Group Application IDs'),
    }).or('name', 'description', 'members', 'applications'),
  },

  deleteUserGroup: {
    params: Joi.object({
      id:             Joi.string().required().length(24).label('Group ID'),
    }),
  },

  restoreUserGroup: {
    params: Joi.object({
      id:             Joi.string().required().length(24).label('Group ID'),
    }),
  },

}

