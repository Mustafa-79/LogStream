import express, { Router } from 'express';
import validate from '../middlewares/validate';
import { applicationController } from '../controllers';
import { applicationValidation } from '../validations/applicationValidations';

const router: Router = express.Router();

router
  .route('/')
  .get(
    applicationController.getAllApplications
  );

router
  .route('/')
  .post(
    validate(applicationValidation.createApplication),
    applicationController.createApplication
  );

router
  .route('/:id')
  .put(
    validate(applicationValidation.updateApplication),
    applicationController.updateApplication
  );

router
  .route('/:id')
  .delete(
    validate(applicationValidation.deleteApplication),
    applicationController.deleteApplication
  );

router
  .route('/:id/threshold-time')
  .put(
    validate(applicationValidation.updateThresholdAndTimePeriod),
    applicationController.updateThresholdAndTimePeriod
  );

export default router;
