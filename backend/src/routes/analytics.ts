import express from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { authenticateRecycler } from '../middleware/auth';

const router = express.Router();

/**
 * @route GET /api/analytics
 * @desc Get complete analytics data for authenticated recycler
 * @access Private (Recycler only)
 * @query period - week, month, or year (default: week)
 */
router.get('/', authenticateRecycler, AnalyticsController.getAnalytics);

/**
 * @route GET /api/analytics/performance
 * @desc Get performance data only for authenticated recycler
 * @access Private (Recycler only)
 * @query period - week, month, or year (default: week)
 */
router.get('/performance', authenticateRecycler, AnalyticsController.getPerformance);

/**
 * @route GET /api/analytics/environmental-impact
 * @desc Get environmental impact data only for authenticated recycler
 * @access Private (Recycler only)
 * @query period - week, month, or year (default: week)
 */
router.get('/environmental-impact', authenticateRecycler, AnalyticsController.getEnvironmentalImpact);

/**
 * @route GET /api/analytics/summary
 * @desc Get analytics summary (high-level metrics) for authenticated recycler
 * @access Private (Recycler only)
 * @query period - week, month, or year (default: week)
 */
router.get('/summary', authenticateRecycler, AnalyticsController.getAnalyticsSummary);

/**
 * @route GET /api/analytics/user-stats
 * @desc Get earnings statistics and user stats for authenticated recycler
 * @access Private (Recycler only)
 */
router.get('/user-stats', authenticateRecycler, AnalyticsController.getUserStats);

export default router; 