import express, { Router, Request, Response } from 'express'
import createResponse from '../utils/responseHelper'
import applicationRoute from './applicationRoutes'

const router: Router = express.Router()

const defaultRoutes: { path: string; route: Router }[] = [
  { path: '/application', route: applicationRoute }
]

defaultRoutes.forEach(({ path, route }) => {
  router.use(path, route)
})

// Health check route
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json(createResponse(200, 'Server is healthy', { timestamp: new Date().toISOString() }))
})

export default router
