import express from 'express';
import { PerformanceController } from '../controllers/performanceController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Performance monitoring middleware
const performanceMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`PERFORMANCE: ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

// Apply performance monitoring to all routes
router.use(performanceMiddleware);

/**
 * @route GET /api/performance/metrics
 * @desc Get comprehensive performance metrics
 * @access Private (Admin)
 */
router.get('/metrics', authenticateToken, PerformanceController.getPerformanceMetrics);

/**
 * @route GET /api/performance/slow-queries
 * @desc Get slow query analysis
 * @access Private (Admin)
 */
router.get('/slow-queries', authenticateToken, PerformanceController.getSlowQueries);

/**
 * @route GET /api/performance/index-usage
 * @desc Get index usage statistics
 * @access Private (Admin)
 */
router.get('/index-usage', authenticateToken, PerformanceController.getIndexUsage);

/**
 * @route GET /api/performance/table-stats
 * @desc Get table statistics and sizes
 * @access Private (Admin)
 */
router.get('/table-stats', authenticateToken, PerformanceController.getTableStats);

/**
 * @route GET /api/performance/cache-hit-ratio
 * @desc Get cache hit ratio
 * @access Private (Admin)
 */
router.get('/cache-hit-ratio', authenticateToken, PerformanceController.getCacheHitRatio);

/**
 * @route GET /api/performance/pool-status
 * @desc Get connection pool status
 * @access Private (Admin)
 */
router.get('/pool-status', authenticateToken, PerformanceController.getConnectionPoolStatus);

/**
 * @route POST /api/performance/optimize
 * @desc Optimize database performance
 * @access Private (Admin)
 */
router.post('/optimize', authenticateToken, PerformanceController.optimizeDatabase);

/**
 * @route GET /api/performance/dashboard
 * @desc Get real-time performance dashboard data
 * @access Private (Admin)
 */
router.get('/dashboard', authenticateToken, PerformanceController.getDashboardData);

export default router; 