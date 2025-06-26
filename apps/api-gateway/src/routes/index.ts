import express, { Router, Request, Response } from 'express'
import createResponse from '../utils/responseHelper'
import applicationRoute from './applicationRoutes'
import logRoutes from './logRoutes'
import userGroupsRoute from './userGroups'


const router: Router = express.Router()

const defaultRoutes: { path: string; route: Router }[] = [
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

// router.post('/ingest', async (req: Request, res: Response) => {
//   // You can add validation and MongoDB storage here
//   console.log('Received log:', req.body)
//   res.status(200).json({ message: 'Log received' })
// })

export default router
