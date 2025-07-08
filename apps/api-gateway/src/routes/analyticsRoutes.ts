import express, { Router } from 'express';
// import { authenticateJWT } from '../middlewares/auth'; // Uncomment when authentication is needed
import { getAnalytics } from '../controllers/analyticsController';

const router: Router = express.Router();

// Apply authentication to all analytics routes when needed
// router.use(authenticateJWT);

/**
 * @route GET /analytics
 * @desc Get comprehensive analytics summary with all chart data
 * @query {string} [applicationIDs] - Comma-separated list of application IDs to filter by
 * @query {string} [logLevels] - Comma-separated list of log levels to filter by (info,warn,error,debug)
 * @query {string} [from] - Start date for filtering (ISO string)
 * @query {string} [to] - End date for filtering (ISO string)
 * @access Private (requires JWT)
 * @example GET /analytics?applicationIDs=app1,app2&logLevels=error,warn&from=2024-01-01&to=2024-01-31
 */
router.get('/', getAnalytics);

export default router;