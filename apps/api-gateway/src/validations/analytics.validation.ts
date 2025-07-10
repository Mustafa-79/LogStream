import Joi from 'joi';

const validLogLevels = ['DEBUG', 'INFO', 'ERROR', 'WARNING'];

export const analyticsValidation = {
  getAnalytics: {
    query: Joi.object({
      // applicationIDs: comma-separated list of 24-char hex MongoDB ObjectIDs
      applicationIDs: Joi.string()
        .optional()
        .pattern(/^[a-fA-F0-9]{24}(,[a-fA-F0-9]{24})*$/)
        .label('Application IDs'),

      // logLevels: comma-separated list of log levels
      logLevels: Joi.string()
        .optional()
        .label('Log Levels')
        .custom((value, helpers) => {
          const levels = value
            .split(',')
            .map((level: string) => level.trim().toUpperCase());

          for (const level of levels) {
            if (!validLogLevels.includes(level)) {
              return helpers.error('any.invalid', { message: `Invalid log level: ${level}` });
            }
          }

          return value;
        }, 'Log Level Validation'),

      // ISO 8601 formatted date strings
      from: Joi.string()
        .isoDate()
        .optional()
        .label('From Date'),

      to: Joi.string()
        .isoDate()
        .optional()
        .label('To Date'),
    }).custom((value, helpers) => {
      const { from, to } = value;
      const now = new Date();

      if (to) {
        const toDate = new Date(to);

        if (toDate > now) {
          return helpers.error('any.invalid', { message: '"To Date" must not be in the future' });
        }

        if (from) {
          const fromDate = new Date(from);
          if (toDate < fromDate) {
            return helpers.error('any.invalid', { message: '"To Date" must not be before "From Date"' });
          }
        }
      }

      return value;
    }, 'Date Range Validation'),
  },
};
