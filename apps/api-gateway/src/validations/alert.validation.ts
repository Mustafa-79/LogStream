import Joi from 'joi';

export const alertValidation = {
  // PATCH /:id/resolve - Resolve a specific alert
  resolveAlert: {
    params: Joi.object({
      id: Joi.string()
        .length(24)
        .required()
        .label('Alert ID'),
    }),
  },
};
