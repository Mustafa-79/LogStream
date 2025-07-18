import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import logger, { FIXED_TRACE_ID } from '../config/logger';
import ApiError from '../utils/ApiError';

interface CustomError extends Error {
  statusCode?: number;
  stack?: string;
}

const errorConverter = (
  err: unknown,
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  let error: ApiError;
  const traceId = FIXED_TRACE_ID;

  if (err instanceof ApiError) {
    error = err;
  } else {
    const e = err as CustomError;
    const isMongooseError = e instanceof mongoose.Error;

    const statusCode =
      e.statusCode ??
      (isMongooseError ? StatusCodes.BAD_REQUEST : StatusCodes.INTERNAL_SERVER_ERROR);

    const message = e.message || getReasonPhrase(statusCode);

    error = new ApiError(statusCode, message, false, e.stack);
    
    // Log the conversion with trace ID
    logger.debug(`Error converted: ${message} (${e.constructor.name})`, traceId);
  }

  next(error);
};

const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || getReasonPhrase(statusCode);
  const traceId = FIXED_TRACE_ID;

  res.locals.errorMessage = message;

  const response = {
    code: statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  // Log error with trace ID and request details
  logger.error(`API Error: ${message} - ${req.method} ${req.originalUrl}`, traceId, {
    statusCode,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    stack: err.stack
  });

  res.status(statusCode).send(response);
};

export { errorConverter, errorHandler };