import Joi, { ObjectSchema } from 'joi'
import { Request, Response, NextFunction, RequestHandler } from 'express'
import { StatusCodes } from 'http-status-codes'
import pick from '../utils/pick'
import ApiError from '../utils/ApiError'

type SchemaContainer = {
  params?: ObjectSchema
  query?: ObjectSchema
  body?: ObjectSchema
}

const validate = (schema: SchemaContainer): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validSchema = pick(schema, ['params', 'query', 'body'])
    
    // Cast keys to keyof SchemaContainer to satisfy pick typing
    const keys = Object.keys(validSchema) as Array<keyof SchemaContainer>
    const object = pick(req, keys)

    const { value, error } = Joi.compile(validSchema)
      .prefs({ errors: { label: 'key' }, abortEarly: false })
      .validate(object)

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ')
      return next(new ApiError(StatusCodes.BAD_REQUEST, errorMessage))
    }

    Object.assign(req, value)
    return next()
  }
}

export default validate
