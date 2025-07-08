import express, { Router } from 'express';
import { authenticateJWT, requireAdmin } from '../middlewares/auth';
import { userController } from '../controllers';

const router: Router = express.Router();

// Apply authentication to all user routes
router.use(authenticateJWT);

router
  .route('/')
  .get(
    requireAdmin,
    userController.getAllUsers
  )
  .post(
    requireAdmin, // Only admins can create users
    userController.createUser
  );

router
  .route('/search-directory')
  .get(
    requireAdmin, // Only admins can search directory
    userController.searchGoogleDirectory
  );

export default router;