import Joi from 'joi'

export const createUserGroupSchema = Joi.object({
  name: Joi.string().trim().required(),
  description: Joi.string().allow('').optional(),
})

export const updateUserGroupSchema = Joi.object({
  description: Joi.string().allow('').optional(),
})

export const addRemoveMemberSchema = Joi.object({
  groupId: Joi.string().required(),
  userId: Joi.string().required(),
})

export const addRemoveApplicationSchema = Joi.object({
  groupId: Joi.string().required(),
  applicationId: Joi.string().required(),
})