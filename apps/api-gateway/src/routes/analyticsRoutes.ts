import express, { Router } from 'express';
import { authenticateJWT } from '../middlewares/auth'; 
import { getAnalytics } from '../controllers/analyticsController';

const router: Router = express.Router();

// Apply authentication to all analytics routes when needed
router.use(authenticateJWT);

/**
 * @route GET /analytics
 * @desc Get comprehensive analytics summary for the authenticated user (filtered by accessible applications)
 * @query {string} [logLevels] - Comma-separated list of log levels to filter by (info,warn,error,debug)
 * @query {string} [from] - Start date for filtering (ISO string)
 * @query {string} [to] - End date for filtering (ISO string)
 * @access Private (requires JWT)
 * @example GET /analytics?logLevels=ERROR,WARNING&from=2024-01-01&to=2024-01-31
 * 
 * Note: applicationIDs are automatically filtered based on user's group memberships
 */
router.get('/', getAnalytics);

export default router;