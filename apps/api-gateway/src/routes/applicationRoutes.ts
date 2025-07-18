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
    validate(applicationValidation.getAllApplications),
    applicationController.getAllApplications
  );

router
  .route('/names')
  .get(
    validate(applicationValidation.getApplicationNames),
    applicationController.getApplicationNames
  );

router
  .route('/all')
  .get(
    validate(applicationValidation.getApplications),
    applicationController.getApplications
  );

router
  .route('/')
  .post(
    requireAdmin, 
    validate(applicationValidation.createApplication),
    applicationController.createApplication
  );

router
  .route('/:id')
  .put(
    requireAdmin,
    validate(applicationValidation.updateApplication),
    applicationController.updateApplication
  );

router
  .route('/:id')
  .delete(
    requireAdmin,
    validate(applicationValidation.deleteApplication),
    applicationController.deleteApplication
  );

router
  .route('/:id/threshold-time')
  .put(
    requireAdmin,
    validate(applicationValidation.updateThresholdAndTimePeriod),
    applicationController.updateThresholdAndTimePeriod
  );

export default router;
