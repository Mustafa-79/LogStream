import express, { Router, Request, Response } from 'express'
import createResponse from '../utils/responseHelper'
import authRoute from './authRoutes' // Adjust the import path as necessary
import applicationRoute from './applicationRoutes'
import logRoutes from './logRoutes'
import userGroupsRoute from './userGroups'
import userRoute from './userRoutes'

const router: Router = express.Router()

const defaultRoutes: { path: string; route: Router }[] = [
  { path: '/user', route: userRoute },
  { path: '/auth', route: authRoute },
  { path: '/application', route: applicationRoute },
  { path: '/user-groups', route: userGroupsRoute },
  { path: '/logs', route: logRoutes },
]

defaultRoutes.forEach(({ path, route }) => {
  router.use(path, route)
})

// Health check route
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json(createResponse(200, 'Server is healthy', { timestamp: new Date().toISOString() }))
})

export default router
