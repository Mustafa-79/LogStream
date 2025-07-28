import express, { Router } from 'express';
import validate from '../middlewares/validate';
import { authenticateJWT } from '../middlewares/auth';
import { executeNaturalLanguageQuery} from '../controllers/mcpController';
import { mcpValidation } from '../validations/mcpValidation';

const router: Router = express.Router();

router.use(authenticateJWT);

router
  .route('/')
  .post(
    validate(mcpValidation.naturalLanguageQuery),
    executeNaturalLanguageQuery
  );

export default router;