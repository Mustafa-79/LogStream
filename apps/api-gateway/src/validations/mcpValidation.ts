import Joi from 'joi';

const naturalLanguageQuery = {
  body: Joi.object().keys({
    query: Joi.string()
      .required()
      .min(1)
      .max(1000)
      .trim()
      .messages({
        'string.base': 'Query must be a string',
        'string.empty': 'Query cannot be empty',
        'string.min': 'Query must have at least 1 character',
        'string.max': 'Query cannot exceed 1000 characters',
        'any.required': 'Query is required'
      }),
    conversationHistory: Joi.array()
      .items(Joi.object())
      .optional()
      .messages({
        'array.base': 'Conversation history must be an array'
      })
  })
};

export const mcpValidation = {
  naturalLanguageQuery
};