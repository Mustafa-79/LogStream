import Joi from 'joi';

export const logValidation = {
    getLogs: {
        query: Joi.object({
            since: Joi.string()
                .isoDate()
                .optional()
                .label('Since Date'),
            page: Joi.string()
                .pattern(/^\d+$/)
                .optional()
                .default('1')
                .label('Page Number'),
            limit: Joi.string()
                .pattern(/^\d+$/)
                .optional()
                .default('25')
                .label('Limit'),
            applications: Joi.string()
                .pattern(/^[a-zA-Z0-9_,-\s]+$/)
                .optional()
                .label('Applications Filter'),
            logLevels: Joi.string()
                .pattern(/^[a-zA-Z,-\s]+$/)
                .optional()
                .label('Log Levels Filter'),
            fromDate: Joi.string()
                .isoDate()
                .optional()
                .label('From Date'),
            toDate: Joi.string()
                .isoDate()
                .optional()
                .label('To Date'),
            search: Joi.string()
                .min(1)
                .max(200)
                .optional()
                .label('Search Term'),
            sortBy: Joi.string()
                .valid('timestamp', 'level', 'application', 'message', 'createdAt', 'default')
                .optional()
                .default('timestamp')
                .label('Sort By Field'),
            sortOrder: Joi.string()
                .valid('asc', 'desc', 'default')
                .optional()
                .default('desc')
                .label('Sort Order'),
        }).custom((value, helpers) => {
            if (value.fromDate && value.toDate) {
                const fromDate = new Date(value.fromDate);
                const toDate = new Date(value.toDate);

                if (fromDate > toDate) {
                    return helpers.error('custom.dateRange');
                }
            }
            return value;
        }).messages({
            'custom.dateRange': 'fromDate cannot be later than toDate'
        }),
    },

    getLogStats: {
    },

    exportLogs: {
        query: Joi.object({
            since: Joi.string()
                .isoDate()
                .optional()
                .label('Since Date'),
            applications: Joi.string()
                .pattern(/^[a-zA-Z0-9_,-\s]+$/)
                .optional()
                .label('Applications Filter'),
            logLevels: Joi.string()
                .pattern(/^[a-zA-Z,-\s]+$/)
                .optional()
                .label('Log Levels Filter'),
            fromDate: Joi.string()
                .isoDate()
                .optional()
                .label('From Date'),
            toDate: Joi.string()
                .isoDate()
                .optional()
                .label('To Date'),
            format: Joi.string()
                .valid('csv', 'json', 'CSV', 'JSON')
                .optional()
                .default('csv')
                .label('Export Format'),
        }).custom((value, helpers) => {
            if (value.fromDate && value.toDate) {
                const fromDate = new Date(value.fromDate);
                const toDate = new Date(value.toDate);

                if (fromDate > toDate) {
                    return helpers.error('custom.dateRange');
                }
            }

            return value;
        }).messages({
            'custom.dateRange': 'fromDate cannot be later than toDate',
        }),
    },
};