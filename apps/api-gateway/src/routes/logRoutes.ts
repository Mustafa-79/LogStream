import express from 'express';
import * as logController from '../controllers/logControllers';

const router = express.Router();

router.get('/new', logController.getNewLogs);

export default router;
