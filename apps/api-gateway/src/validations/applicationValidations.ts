import Joi from 'joi';

export const applicationValidation = {
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