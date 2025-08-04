import express, { Router } from 'express';
import validate from '../middlewares/validate';
import { authenticateJWT } from '../middlewares/auth';
import {
  starMessage,
  unstarMessage,
  getStarredMessages
} from '../controllers/starredMessageController';
import { starredMessageValidation } from '../validations/starredMessage.validation';

const router: Router = express.Router();

router.use(authenticateJWT);

// Star a message
router
  .route('/')
  .post(
    validate(starredMessageValidation.starMessage),
    starMessage
  )
  .get(
    validate(starredMessageValidation.getStarredMessages),
    getStarredMessages
  );

// Unstar a message by its ID
router
  .route('/:id')
  .delete(
    validate(starredMessageValidation.unstarMessage),
    unstarMessage
  );

export default router;
