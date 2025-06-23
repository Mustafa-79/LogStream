import morgan from 'morgan'
import logger from './logger'
import { Request, Response } from 'express'

morgan.token('message', (_req: Request, res: Response): string => {
  return res.locals.errorMessage || ''
})

const getIpFormat = () => ':remote-addr -'

const successResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms`
const errorResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`

// Morgan stream for success logs
const successHandler = morgan(successResponseFormat, {
  skip: (_req: Request, res: Response): boolean => res.statusCode >= 400,
  stream: {
    write: (message: string) => logger.info(message.trim())
  }
})

// Morgan stream for error logs
const errorHandler = morgan(errorResponseFormat, {
  skip: (_req: Request, res: Response): boolean => res.statusCode < 400,
  stream: {
    write: (message: string) => logger.error(message.trim())
  }
})

export { successHandler, errorHandler }