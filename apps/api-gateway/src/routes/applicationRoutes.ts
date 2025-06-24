import express, { Router } from 'express';
import validate from '../middlewares/validate';
import { applicationController } from '../controllers';
import { applicationValidation } from '../validations/applicationValidations';

const router: Router = express.Router();

router
  .route('/')
  .post(
    validate(applicationValidation.createApplication),
    applicationController.createApplication
  );

export default router;
