import dotenv from 'dotenv'
import path from 'path'
import Joi from 'joi'

dotenv.config({ path: path.join(__dirname, '../../.env') })

interface EnvVars {
  PORT: number
  MONGODB_URL: string
  JWT_SECRET: string
}

// Define Joi schema for validation
const envVarsSchema = Joi.object<EnvVars>()
  .keys({
    PORT: Joi.number().default(3000),
    MONGODB_URL: Joi.string().required().description('Mongo DB URL'),
    JWT_SECRET: Joi.string().required().description('JWT Secret for token signing'),
  })
  .unknown()

// Validate process.env
const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env)

if (error) {
  throw new Error(`Config validation error: ${error.message}`)
}

// Export strongly typed config
const config = {
  port: envVars.PORT,
  mongoose: envVars.MONGODB_URL,
  jwtSecret: envVars.JWT_SECRET
}

export default config