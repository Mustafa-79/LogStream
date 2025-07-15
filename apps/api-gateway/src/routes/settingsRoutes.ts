import { Router } from 'express'
import { authenticateJWT } from '../middlewares/auth'
import * as settingsController from '../controllers/settingsController'


const router = Router()

// Apply authentication to all user group routes
router.use(authenticateJWT);

router.get('/user-applications', settingsController.getUserApplications);

router.get('/drp', settingsController.getDRP);
router.put('/drp', settingsController.updateDRP);

router.post('/', settingsController.saveSettings);



export default router




