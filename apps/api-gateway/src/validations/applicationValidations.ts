import Joi from 'joi';

export const applicationValidation = {
  getAllApplications: {
    query: Joi.object({
      page: Joi.string()
        .pattern(/^\d+$/)
        .optional()
        .default('1')
        .label('Page Number'),
      limit: Joi.string()
        .pattern(/^\d+$/)
        .optional()
        .default('5')
        .label('Limit'),
      active: Joi.string()
        .valid('true', 'false')
        .optional()
        .label('Active Filter'),
      search: Joi.string()
        .min(1)
        .max(100)
        .optional()
        .label('Search Term'),
      sortBy: Joi.string()
        .valid('name', 'description', 'createdAt', 'updatedAt', 'active')
        .optional()
        .default('name')
        .label('Sort By Field'),
      sortOrder: Joi.string()
        .valid('asc', 'desc')
        .optional()
        .default('asc')
        .label('Sort Order'),
    }),
  },

  getApplicationNames: {
    query: Joi.object({
      active: Joi.string()
        .valid('true', 'false')
        .optional()
        .label('Active Filter'),
      sortBy: Joi.string()
        .valid('name', 'createdAt')
        .optional()
        .default('name')
        .label('Sort By Field'),
      sortOrder: Joi.string()
        .valid('asc', 'desc')
        .optional()
        .default('asc')
        .label('Sort Order'),
    }),
  },

  getApplications: {
    query: Joi.object({
      page: Joi.string()
        .pattern(/^\d+$/)
        .optional()
        .default('1')
        .label('Page Number'),
      limit: Joi.string()
        .pattern(/^\d+$/)
        .optional()
        .default('5')
        .label('Limit'),
      active: Joi.string()
        .valid('true', 'false')
        .optional()
        .label('Active Filter'),
      sortBy: Joi.string()
        .valid('name', 'description', 'createdAt', 'updatedAt', 'active')
        .optional()
        .default('name')
        .label('Sort By Field'),
      sortOrder: Joi.string()
        .valid('asc', 'desc')
        .optional()
        .default('asc')
        .label('Sort Order'),
    }),
  },

  createApplication: {
    body: Joi.object({
      name: Joi.string()
        .min(5)
        .max(20)
        .required()
        .label('Application Name'),
      description: Joi.string()
        .min(10)
        .max(100)
        .required()
        .label('Application Description'),
    }),
  },

  updateApplication: {
    params: Joi.object({
      id: Joi.string()
        .length(24)
        .required()
        .label('Application ID'), 
    }),
    body: Joi.object({
      name: Joi.string()
        .min(5)
        .max(20)
        .optional()
        .label('Application Name'),
      description: Joi.string()
        .min(10)
        .max(100)
        .optional()
        .label('Application Description'),
      active: Joi.boolean()
        .optional()
        .label('Application Active Status'),
    }).min(1),
  },

  deleteApplication: {
    params: Joi.object({
      id: Joi.string()
        .length(24)
        .required()
        .label('Application ID'), 
    }),
  },

  updateThresholdAndTimePeriod: {
    params: Joi.object({
      id: Joi.string()
        .length(24)
        .required()
        .label('Application ID'), 
    }),
    body: Joi.object({
      threshold: Joi.number()
        .greater(0)
        .required()
        .label('Threshold'),
      time_period: Joi.number()
        .greater(0)
        .required()
        .label('Time Period'),
    }),
  },
};