import dotenv from 'dotenv'
import path from 'path'
import Joi from 'joi'

dotenv.config({ path: path.join(__dirname, '../../.env') })

interface EnvVars {
  PORT: number
  MONGODB_URL: string
  JWT_SECRET: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  BACKEND_URL: string
  FRONTEND_URL: string
}

// Define Joi schema for validation
const envVarsSchema = Joi.object<EnvVars>()
  .keys({
    PORT: Joi.number().default(3000),
    MONGODB_URL: Joi.string().required().description('Mongo DB URL'),
    JWT_SECRET: Joi.string().required().description('JWT Secret for token signing'),
    GOOGLE_CLIENT_ID: Joi.string().required().description('Google OAuth Client ID'),
    GOOGLE_CLIENT_SECRET: Joi.string().required().description('Google OAuth Client Secret'),
    BACKEND_URL: Joi.string().required().description('Backend URL'),
    FRONTEND_URL: Joi.string().required().description('Frontend URL'),
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
  jwtSecret: envVars.JWT_SECRET,
  google: {
    clientId: envVars.GOOGLE_CLIENT_ID,
    clientSecret: envVars.GOOGLE_CLIENT_SECRET
  },
  backendUrl: envVars.BACKEND_URL,
  frontendUrl: envVars.FRONTEND_URL
}

export default config