import { Router } from 'express'
import { authenticateJWT } from '../middlewares/auth'
import * as settingsController from '../controllers/settingsController'


const router = Router()

// Apply authentication to all user group routes
router.use(authenticateJWT);

router.get('/user-applications', settingsController.getUserApplications)



export default router




