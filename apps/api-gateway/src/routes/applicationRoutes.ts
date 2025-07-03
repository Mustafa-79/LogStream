import express, { Router } from 'express';
import validate from '../middlewares/validate';
import { authenticateJWT, requireAdmin } from '../middlewares/auth';
import { applicationController } from '../controllers';
import { applicationValidation } from '../validations/applicationValidations';

const router: Router = express.Router();

// Apply authentication to all application routes
router.use(authenticateJWT);

router
  .route('/')
  .get(
    applicationController.getAllApplications
  );

router
  .route('/')
  .post(
    requireAdmin, // Only admins can create applications
    validate(applicationValidation.createApplication),
    applicationController.createApplication
  );

router
  .route('/:id')
  .put(
    requireAdmin, // Only admins can update applications
    validate(applicationValidation.updateApplication),
    applicationController.updateApplication
  );

router
  .route('/:id')
  .delete(
    requireAdmin, // Only admins can delete applications
    validate(applicationValidation.deleteApplication),
    applicationController.deleteApplication
  );

router
  .route('/:id/threshold-time')
  .put(
    requireAdmin, // Only admins can update thresholds
    validate(applicationValidation.updateThresholdAndTimePeriod),
    applicationController.updateThresholdAndTimePeriod
  );

export default router;
