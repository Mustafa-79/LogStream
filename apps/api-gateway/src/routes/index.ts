import express, { Router, Request, Response } from 'express'
import createResponse from '../utils/responseHelper'

const router: Router = express.Router()

const defaultRoutes: { path: string; route: Router }[] = [
//   { path: '/user', route: userRoute }, -> How to import routes
]

defaultRoutes.forEach(({ path, route }) => {
  router.use(path, route)
})

// Health check route
router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json(createResponse(200, 'Server is healthy', { timestamp: new Date().toISOString() }))
})

export default router
