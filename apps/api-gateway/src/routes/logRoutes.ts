import express from 'express';
import validate from '../middlewares/validate';
import { authenticateJWT } from '../middlewares/auth';
import * as logController from '../controllers/logControllers';
import { logValidation } from '../validations/logs.validations';

const router = express.Router();

router.use(authenticateJWT);

router.get(
  '/',
  validate(logValidation.getLogs),
  logController.getLogs
);

router.get(
  '/export',
  validate(logValidation.exportLogs),
  logController.exportLogs
);

router.get(
  '/stats',
  validate(logValidation.getLogStats),
  logController.getLogStats
);

export default router;