import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

// Import models
import Group from './src/models/Group.model'
import User from './src/models/User.model'
import Application from './src/models/Application.model'
import UserGroup from './src/models/Group-User.model'
import GroupApplication from './src/models/Group-Application.model'

// Use your MongoDB connection string or default to a local database
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/logstream'

const flushDatabase = async () => {
  console.log('Flushing database...')
  await Group.deleteMany({})
  await User.deleteMany({})
  await Application.deleteMany({})
  await UserGroup.deleteMany({})
  await GroupApplication.deleteMany({})
  console.log('Database flushed.')
}

const populateDummyData = async () => {
  console.log('Populating dummy data...')

  // Create Users
  const users = await User.insertMany([
    { username: 'alice', email: 'alice@example.com' },
    { username: 'bob', email: 'bob@example.com' },
    { username: 'charlie', email: 'charlie@example.com' },
  ])
  console.log('Users created:', users)

  // Create Groups
  const groups = await Group.insertMany([
    { name: 'Admins', description: 'Administrators group' },
    { name: 'Editors', description: 'Editors group' },
  ])
  console.log('Groups created:', groups)

  // Create Applications
  const applications = await Application.insertMany([
    { name: 'App One', description: 'First application', threshold: 100, time_period: 30 },
    { name: 'App Two', description: 'Second application', threshold: 200, time_period: 60 },
  ])
  console.log('Applications created:', applications)

  // Add Users to Groups (UserGroup)
  // Assume: alice and bob are admins, charlie is editor
  const adminGroup = groups[0]
  const editorGroup = groups[1]
  const alice = users.find((user) => user.username === 'alice')
  const bob = users.find((user) => user.username === 'bob')
  const charlie = users.find((user) => user.username === 'charlie')

  const userGroupsData = [
    { group_id: adminGroup._id, user_id: alice?._id },
    { group_id: adminGroup._id, user_id: bob?._id },
    { group_id: editorGroup._id, user_id: charlie?._id },
  ]
  const userGroups = await UserGroup.insertMany(userGroupsData)
  console.log('User-Groups relations created:', userGroups)

  // Add Applications to Groups (GroupApplication)
  // Assume: Admins have access to both apps, Editors have access to App One only.
  const groupApplicationsData = [
    { group_id: adminGroup._id, application_id: applications[0]._id },
    { group_id: adminGroup._id, application_id: applications[1]._id },
    { group_id: editorGroup._id, application_id: applications[0]._id },
  ]
  const groupApplications = await GroupApplication.insertMany(groupApplicationsData)
  console.log('Group-Applications relations created:', groupApplications)

  console.log('Dummy data population complete.')
}

const main = async () => {
  try {
    await mongoose.connect(MONGO_URI)
    console.log(`Connected to MongoDB at ${MONGO_URI}`)

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