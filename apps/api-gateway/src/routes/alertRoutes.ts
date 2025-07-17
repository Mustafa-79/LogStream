import express, { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth';
import validate from '../middlewares/validate';
import { alertController } from '../controllers';
import { alertValidation } from '../validations/alert.validation';

const router: Router = express.Router();

// Apply authentication to all alert routes
router.use(authenticateJWT);

router
  .route('/')
  .get(alertController.getAlerts);

router
  .route('/:id/resolve')
  .patch(
    validate(alertValidation.resolveAlert),
    alertController.resolveAlert
  );

export default router;
