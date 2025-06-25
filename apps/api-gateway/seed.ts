import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config()

// Import models
import Group from './src/models/Group.model'
import User from './src/models/User.model'
import Application from './src/models/Application.model'
import Group_User from './src/models/Group-User.model'
import Group_Application from './src/models/Group-Application.model'

import config from './src/config/config'


const flushDatabase = async () => {
  console.log('Flushing database...')
  await Group.deleteMany({})
  await User.deleteMany({})
  await Application.deleteMany({})
  await Group_User.deleteMany({})
  await Group_Application.deleteMany({})
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

  // Force-feed Application data
  const applications = await Application.insertMany([
    {
      // _id: new mongoose.Types.ObjectId('685a8328b93040684ee3bdd1'),
      name: "Test App 1",
      description: "Testing create application pt2",
    },
    {
      // _id: new mongoose.Types.ObjectId('685a846d78c060b88efa791b'),
      name: "Test App 2",
      description: "Testing create application pt1",
    },
    {
      // _id: new mongoose.Types.ObjectId('685a847278c060b88efa791d'),
      name: "Test App 3",
      description: "Testing create application pt1",
    }
  ])
  console.log('Applications created:', applications)

  // Add Users to Groups (Group_User)
  // Assume: alice and bob are admins, charlie is editor
  const adminGroup = groups[0]
  const editorGroup = groups[1]
  const alice = users.find((user) => user.username === 'alice')
  const bob = users.find((user) => user.username === 'bob')
  const charlie = users.find((user) => user.username === 'charlie')

  const Group_UsersData = [
    { group_id: adminGroup._id, user_id: alice?._id },
    { group_id: adminGroup._id, user_id: bob?._id },
    { group_id: editorGroup._id, user_id: charlie?._id },
  ]
  const Group_Users = await Group_User.insertMany(Group_UsersData)
  console.log('Groups-User relations created:', Group_Users)

  // Add Applications to Groups (Group_Application)
  // For this example, assume:
  // - Admins have access to Test App 1 and Test App 2
  // - Editors have access to Test App 3
  const groupApplicationsData = [
    { group_id: adminGroup._id, application_id: applications[0]._id },
    { group_id: adminGroup._id, application_id: applications[1]._id },
    { group_id: editorGroup._id, application_id: applications[2]._id },
  ]
  const groupApplications = await Group_Application.insertMany(groupApplicationsData)
  console.log('Group-Applications relations created:', groupApplications)

  console.log('Dummy data population complete.')
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