import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

// Import models
import Group from './src/models/Group.model'
import User from './src/models/User.model'
import Application from './src/models/Application.model'
import { Log } from './src/models/Log.model'

import config from './src/config/config'


const flushDatabase = async () => {
  console.log('Flushing database...')
  await Group.deleteMany({})
  await User.deleteMany({})
  await Application.deleteMany({})
  await Log.deleteMany({})
  console.log('Database flushed.')
}

const populateDummyData = async () => {
  console.log('Populating dummy data...')

  // Create Users
  const users = await User.insertMany([
    { username: 'alice_admin', email: 'alice@example.com', active: true },
    { username: 'bob_dev', email: 'bob@example.com', active: true },
    { username: 'charlie_qa', email: 'charlie@example.com', active: true },
    { username: 'diana_ops', email: 'diana@example.com', active: true },
    { username: 'eve_support', email: 'eve@example.com', active: false },
  ])
  console.log('Users created:', users.length)

  // Create Applications
  const applications = await Application.insertMany([
    {
      name: "E-Commerce API",
      description: "Main e-commerce backend API service",
      threshold: 50,
      timePeriod: 10,
      active: true,
    },
    {
      name: "Payment Service",
      description: "Payment processing microservice",
      threshold: 25,
      timePeriod: 5,
      active: true,
    },
    {
      name: "User Management",
      description: "User authentication and management service",
      threshold: 30,
      timePeriod: 15,
      active: true,
    },
    {
      name: "Analytics Dashboard",
      description: "Business analytics and reporting dashboard",
      threshold: 100,
      timePeriod: 30,
      active: true,
    },
    {
      name: "Legacy System",
      description: "Legacy system being phased out",
      threshold: 10,
      timePeriod: 5,
      active: false,
    }
  ])
  console.log('Applications created:', applications.length)

  // Create Groups with member and application assignments
  const groups = await Group.insertMany([
    { 
      name: 'Administrators',
      description: 'System administrators with full access to all applications',
      memberIDs: [users[0]._id, users[3]._id], // alice_admin, diana_ops
      applicationIDs: applications.map(app => app._id), // Access to all apps
      active: true,
    },
    { 
      name: 'Developers',
      description: 'Development team with access to core services',
      memberIDs: [users[1]._id, users[2]._id], // bob_dev, charlie_qa
      applicationIDs: [applications[0]._id, applications[1]._id, applications[2]._id], // E-Commerce, Payment, User Management
      active: true,
    },
    { 
      name: 'Analytics Team',
      description: 'Business analysts and data scientists',
      memberIDs: [users[2]._id], // charlie_qa
      applicationIDs: [applications[3]._id], // Analytics Dashboard
      active: true,
    },
    { 
      name: 'Support Team',
      description: 'Customer support and maintenance team',
      memberIDs: [users[4]._id], // eve_support
      applicationIDs: [applications[0]._id, applications[2]._id], // E-Commerce, User Management
      active: true,
    },
    { 
      name: 'Legacy Maintainers',
      description: 'Team maintaining legacy systems',
      memberIDs: [],
      applicationIDs: [applications[4]._id], // Legacy System
      active: false,
    }
  ])
  console.log('Groups created:', groups.length)

  // Generate sample log entries
  const logLevels = ['INFO', 'WARNING', 'ERROR', 'DEBUG'] as const
  const sampleMessages = [
    'User login successful',
    'Database connection established',
    'Payment processed successfully',
    'Invalid authentication token',
    'Server response time exceeded threshold',
    'Cache miss for user data',
    'API rate limit exceeded',
    'Database query executed',
    'File upload completed',
    'Memory usage warning',
    'Service health check passed',
    'Configuration loaded',
    'Session expired',
    'Data validation failed',
    'Backup completed successfully'
  ]

  const logs: Array<{
    message: string;
    logLevel: 'INFO' | 'WARNING' | 'ERROR' | 'DEBUG';
    traceId: string;
    sourceApp: mongoose.Types.ObjectId;
    date: Date;
  }> = []
  const now = new Date()
  
  // Generate logs for each application
  for (const app of applications.slice(0, 4)) { // Only for active applications
    for (let i = 0; i < 20; i++) { // 20 logs per application
      const randomHoursAgo = Math.floor(Math.random() * 72) // Within last 3 days
      const logDate = new Date(now.getTime() - (randomHoursAgo * 60 * 60 * 1000))
      
      logs.push({
        message: sampleMessages[Math.floor(Math.random() * sampleMessages.length)],
        logLevel: logLevels[Math.floor(Math.random() * logLevels.length)],
        traceId: `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sourceApp: app._id as mongoose.Types.ObjectId,
        date: logDate,
      })
    }
  }

  // Add some specific error scenarios for demonstration
  const errorLogs = [
    {
      message: 'Database connection timeout',
      logLevel: 'ERROR' as const,
      traceId: `trace-${Date.now()}-error-001`,
      sourceApp: applications[0]._id as mongoose.Types.ObjectId, // E-Commerce API
      date: new Date(now.getTime() - (2 * 60 * 60 * 1000)), // 2 hours ago
    },
    {
      message: 'Payment gateway returned error 500',
      logLevel: 'ERROR' as const, 
      traceId: `trace-${Date.now()}-error-002`,
      sourceApp: applications[1]._id as mongoose.Types.ObjectId, // Payment Service
      date: new Date(now.getTime() - (1 * 60 * 60 * 1000)), // 1 hour ago
    },
    {
      message: 'High memory usage detected: 95%',
      logLevel: 'WARNING' as const,
      traceId: `trace-${Date.now()}-warn-001`,
      sourceApp: applications[2]._id as mongoose.Types.ObjectId, // User Management
      date: new Date(now.getTime() - (30 * 60 * 1000)), // 30 minutes ago
    }
  ]

  logs.push(...errorLogs)
  
  const createdLogs = await Log.insertMany(logs)
  console.log('Log entries created:', createdLogs.length)

  console.log('Dummy data population complete.')
  console.log('Summary:')
  console.log(`- ${users.length} users created`)
  console.log(`- ${applications.length} applications created`)
  console.log(`- ${groups.length} groups created`)
  console.log(`- ${createdLogs.length} log entries created`)
}

const main = async () => {
  try {
    await mongoose.connect(config.mongoose)
    console.log(`Connected to MongoDB at ${config.mongoose}`)

    await flushDatabase()
    await populateDummyData()
  } catch (error) {
    console.error('Error seeding data:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

main()