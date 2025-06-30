import express from 'express';
import { authController } from '../controllers';

const router = express.Router();

router.post('/google', authController.authRoute);

export default router;