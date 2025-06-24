import Joi from 'joi';

export const applicationValidation = {
  createApplication: {
    body: Joi.object({
      name: Joi.string().required().label('Application Name'),
      description: Joi.string().required().label('Application Description'),
    }),
  },
  updateApplication: {
    params: Joi.object({
      id: Joi.string().required().length(24).label('Application ID'), 
    }),
    body: Joi.object({
      name: Joi.string().optional().label('Application Name'),
      description: Joi.string().optional().label('Application Description'),
    }).min(1),
  },
  deleteApplication: {
    params: Joi.object({
      id: Joi.string().required().length(24).label('Application ID'), 
    }),
  },
  updateThresholdAndTimePeriod: {
    body: Joi.object({
      threshold: Joi.number().required().label('Threshold'),
      time_period: Joi.number().required().label('Time Period'),
    }),
  },
};