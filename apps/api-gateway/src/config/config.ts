import dotenv from 'dotenv'
import path from 'path'
import Joi from 'joi'
import config from 'config'

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') })

interface ConfigInterface {
  port: number
  mongoose: string
  jwtSecret: string
  google: {
    clientId: string
    clientSecret: string
    adminImpersonationEmail: string
    workspaceDomain: string
    adminScopes: string
    clientEmail: string
    privateKey: string
  }
  backendUrl: string
  frontendUrl: string
  smtp: {
    host: string
    port: number
    secure: boolean
    user: string
    pass: string
  }
  nodeEnv: string
}

// Helper function to get environment variable value
const getEnvValue = (configPath: string): string => {
  const value = config.get(configPath)
  if (typeof value === 'string' && process.env[value]) {
    return process.env[value] as string
  }
  return value as string
}

// Helper function to parse boolean values
const parseBool = (value: string): boolean => {
  if (typeof value === 'boolean') return value
  return value === 'true'
}

// Helper function to parse number values
const parseNumber = (value: string): number => {
  if (typeof value === 'number') return value
  return parseInt(value, 10)
}

// Define Joi schema for validation
const configSchema = Joi.object({
  port: Joi.number().default(3000),
  mongoose: Joi.string().required().description('MongoDB URL'),
  jwtSecret: Joi.string().required().description('JWT Secret for token signing'),
  google: Joi.object({
    clientId: Joi.string().required().description('Google OAuth Client ID'),
    clientSecret: Joi.string().required().description('Google OAuth Client Secret'),
    adminImpersonationEmail: Joi.string().required().description('Google Admin Impersonation Email'),
    workspaceDomain: Joi.string().required().description('Google Workspace Domain'),
    adminScopes: Joi.string().required().description('Google Admin Scopes'),
    clientEmail: Joi.string().required().description('Google Service Account Client Email'),
    privateKey: Joi.string().required().description('Google Service Account Private Key')
  }).required(),
  backendUrl: Joi.string().required().description('Backend URL'),
  frontendUrl: Joi.string().required().description('Frontend URL'),
  smtp: Joi.object({
    host: Joi.string().default('smtp.gmail.com').description('SMTP host for email service'),
    port: Joi.number().default(587).description('SMTP port for email service'),
    secure: Joi.boolean().default(false).description('SMTP secure connection flag'),
    user: Joi.string().required().description('SMTP user for email service'),
    pass: Joi.string().required().description('SMTP password for email service')
  }).required()
}).unknown()

// Create configuration object from config library
const appConfig: ConfigInterface = {
  port: parseNumber(getEnvValue('server.port')),
  mongoose: getEnvValue('database.mongodb.url'),
  jwtSecret: getEnvValue('auth.jwt.secret'),
  google: {
    clientId: getEnvValue('auth.google.clientId'),
    clientSecret: getEnvValue('auth.google.clientSecret'),
    adminImpersonationEmail: getEnvValue('auth.google.adminImpersonationEmail'),
    workspaceDomain: getEnvValue('auth.google.workspaceDomain'),
    adminScopes: getEnvValue('auth.google.adminScopes'),
    clientEmail: getEnvValue('auth.google.clientEmail'),
    privateKey: getEnvValue('auth.google.privateKey')
  },
  backendUrl: getEnvValue('urls.backend'),
  frontendUrl: getEnvValue('urls.frontend'),
  smtp: {
    host: getEnvValue('smtp.host'),
    port: parseNumber(getEnvValue('smtp.port')),
    secure: parseBool(getEnvValue('smtp.secure')),
    user: getEnvValue('smtp.user'),
    pass: getEnvValue('smtp.pass')
  },
  nodeEnv: process.env.NODE_ENV || 'production' // Read directly from environment variable
}

// Validate configuration
const { error } = configSchema.validate(appConfig)

console.log('Environment set to:', appConfig.nodeEnv)

if (error) {
  throw new Error(`Config validation error: ${error.message}`)
}

export default appConfig