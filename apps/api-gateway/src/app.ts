import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import httpStatus from 'http-status'
import mongoSanitize from 'express-mongo-sanitize'
import { successHandler, errorHandler } from './config/morgan'
import ApiError from './utils/ApiError'
import { errorConverter, errorHandler as errorMiddleware } from './middlewares/error'
import routes from './routes'

const app = express()

app.use(successHandler)
app.use(errorHandler)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(mongoSanitize())
app.use(cors())

app.use('/api', routes)

// Handle 404
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'))
})

// Error handlers
app.use(errorConverter)
app.use(errorMiddleware)

export default app
