import Joi from 'joi'


export const userGroupValidation = {
  
  createUserGroup: {
    body: Joi.object({
      name:           Joi.string().trim().required().min(5).max(20).label('Group Name'),
      description:    Joi.string().trim().required().min(10).max(100).label('Group Description'),
      members:        Joi.array().items(Joi.string().length(24)).optional().label('Group Member IDs'),
      applications:   Joi.array().items(Joi.string().length(24)).optional().label('Group Application IDs'),
      active:         Joi.boolean().required().label('Group Active Status'),
    }),
  },

  updateUserGroup: {
    params: Joi.object({
      id:             Joi.string().required().length(24).label('Group ID'),
    }),

    body: Joi.object({
      name:           Joi.string().trim().min(5).max(20).label('Group Name'),
      description:    Joi.string().trim().min(10).max(100).label('Group Description'),
      members:        Joi.array().items(Joi.string().length(24)).optional().label('Group Member IDs'),
      applications:   Joi.array().items(Joi.string().length(24)).optional().label('Group Application IDs'),
      active:         Joi.boolean().optional().label('Group Active Status'),
    }).or('name', 'description', 'members', 'applications', 'active'),
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

