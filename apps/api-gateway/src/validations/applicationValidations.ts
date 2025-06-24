import Joi from 'joi';

export const applicationValidation = {
  createApplication: {
    body: Joi.object({
      name: Joi.string().required().label('Application Name'),
      description: Joi.string().required().label('Application Description'),
    }),
  },
};