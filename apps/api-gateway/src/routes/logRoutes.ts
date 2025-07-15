import express from 'express';
import { authenticateJWT } from '../middlewares/auth';
import * as logController from '../controllers/logControllers';

const router = express.Router();

// Apply authentication to all log routes
router.use(authenticateJWT);

router.get('/', logController.getLogs);

router.get('/export', logController.exportLogs);

router.get('/stats', logController.getLogStats);

export default router;
