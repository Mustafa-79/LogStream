import Joi from 'joi'

export const createUserGroupSchema = Joi.object({
  name: Joi.string().trim().required(),
  description: Joi.string().allow('').optional(),
  members: Joi.array().items(Joi.string()).optional(),
  applications: Joi.array().items(Joi.string()).optional(),
})

export const updateUserGroupSchema = Joi.object({
  name: Joi.string().trim().min(1),
  description: Joi.string().min(1),
}).or('name', 'description')

export const addRemoveMemberSchema = Joi.object({
  groupId: Joi.string().required(),
  userId: Joi.string().required(),
})

export const addRemoveApplicationSchema = Joi.object({
  groupId: Joi.string().required(),
  applicationId: Joi.string().required(),
})