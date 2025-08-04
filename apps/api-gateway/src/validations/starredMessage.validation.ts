import Joi from 'joi';

const starMessage = {
  body: Joi.object().keys({
    messageContent: Joi.string()
      .required()
      .trim()
      .max(10000)
      .messages({
        'string.base': 'Message content must be a string',
        'string.empty': 'Message content cannot be empty',
        'string.max': 'Message content cannot exceed 10000 characters',
        'any.required': 'Message content is required'
      })
  })
};

const unstarMessage = {
  params: Joi.object().keys({
    id: Joi.string()
      .required()
      .trim()
      .messages({
        'string.base': 'ID must be a string',
        'string.empty': 'ID cannot be empty',
        'any.required': 'ID is required'
      })
  })
};

const getStarredMessages = {
  query: Joi.object().keys({
    page: Joi.number()
      .integer()
      .min(1)
      .optional()
      .default(1)
      .messages({
        'number.base': 'Page must be a number',
        'number.integer': 'Page must be an integer',
        'number.min': 'Page must be at least 1'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .optional()
      .default(20)
      .messages({
        'number.base': 'Limit must be a number',
        'number.integer': 'Limit must be an integer',
        'number.min': 'Limit must be at least 1',
        'number.max': 'Limit cannot exceed 100'
      }),
    sortBy: Joi.string()
      .valid('createdAt', 'messageContent')
      .optional()
      .default('createdAt')
      .messages({
        'string.base': 'Sort by must be a string',
        'any.only': 'Sort by must be one of: createdAt, messageContent'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .optional()
      .default('desc')
      .messages({
        'string.base': 'Sort order must be a string',
        'any.only': 'Sort order must be either "asc" or "desc"'
      })
  })
};

export const starredMessageValidation = {
  starMessage,
  unstarMessage,
  getStarredMessages
};
