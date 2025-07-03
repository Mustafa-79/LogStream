import express, { Router } from 'express';
import { authenticateJWT, requireAdmin } from '../middlewares/auth';
import { userController } from '../controllers';

const router: Router = express.Router();

// Apply authentication to all user routes
router.use(authenticateJWT);

router
  .route('/')
  .get(
    requireAdmin, // Only admins can view all users
    userController.getAllUsers
  );

export default router;