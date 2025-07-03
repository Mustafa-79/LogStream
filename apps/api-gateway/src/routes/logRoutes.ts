import express from 'express';
import { authenticateJWT } from '../middlewares/auth';
import * as logController from '../controllers/logControllers';

const router = express.Router();

// Apply authentication to all log routes
router.use(authenticateJWT);

router.get('/new', logController.getNewLogs);

export default router;
