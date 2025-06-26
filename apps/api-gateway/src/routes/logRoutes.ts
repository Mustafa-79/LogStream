import express from 'express';
import * as logController from '../controllers/logControllers';

const router = express.Router();

router.get('/', logController.getAllLogs);

export default router;
