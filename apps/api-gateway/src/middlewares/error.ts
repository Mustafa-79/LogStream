import { Request, Response, NextFunction } from 'express'
import mongoose from 'mongoose'
import { StatusCodes, getReasonPhrase } from 'http-status-codes'
import logger from '../config/logger'
import ApiError from '../utils/ApiError'

// Extend Error with optional statusCode (message is already required in Error)
interface CustomError extends Error {
  statusCode?: number
  stack?: string
}

const errorConverter = (
  err: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction
): void => {
  let error: ApiError

  if (err instanceof ApiError) {
    error = err
  } else {
    const e = err as CustomError
    const isMongooseError = e instanceof mongoose.Error

    const statusCode =
      e.statusCode ??
      (isMongooseError ? StatusCodes.BAD_REQUEST : StatusCodes.INTERNAL_SERVER_ERROR)

    const message = e.message || getReasonPhrase(statusCode)

    error = new ApiError(statusCode, message, false, e.stack)
  }

  next(error)
}

const errorHandler = (
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
  const message = err.message || getReasonPhrase(statusCode)

  res.locals.errorMessage = message

  const response = {
    code: statusCode,
    message,
    stack: err.stack
  }

  logger.error(err)

  res.status(statusCode).send(response)
}

export { errorConverter, errorHandler }