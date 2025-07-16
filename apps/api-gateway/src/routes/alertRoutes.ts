import express, { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth';
import { alertController } from '../controllers';

const router: Router = express.Router();

// Apply authentication to all alert routes
router.use(authenticateJWT);

router
  .route('/')
  .get(alertController.getAlerts);

router
  .route('/:id/resolve')
  .patch(alertController.resolveAlert);


export default router;
