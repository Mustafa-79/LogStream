import express, { Router } from 'express';
import { userController } from '../controllers';

const router: Router = express.Router();

router
  .route('/')
  .get(
    userController.getAllUsers
  );

export default router;