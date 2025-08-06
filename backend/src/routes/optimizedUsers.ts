import express from 'express';
import { OptimizedUsersController } from '../controllers/optimizedUsersController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Performance monitoring middleware
const performanceMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

// Apply performance monitoring to all routes
router.use(performanceMiddleware);

/**
 * @route GET /api/optimized-users/profile
 * @desc Get current user profile with caching
 * @access Private
 */
router.get('/profile', authenticateToken, OptimizedUsersController.getUserProfile);

/**
 * @route PUT /api/optimized-users/profile
 * @desc Update current user profile with cache invalidation
 * @access Private
 */
router.put('/profile', authenticateToken, OptimizedUsersController.updateUserProfile);

/**
 * @route GET /api/optimized-users/recyclers
 * @desc Get all recyclers with optimized pagination and caching
 * @access Public
 */
router.get('/recyclers', OptimizedUsersController.getRecyclers);

/**
 * @route GET /api/optimized-users/recyclers/:id
 * @desc Get specific recycler details with caching
 * @access Public
 */
router.get('/recyclers/:id', OptimizedUsersController.getRecyclerDetails);

/**
 * @route GET /api/optimized-users/stats
 * @desc Get user statistics with optimized analytics
 * @access Private
 */
router.get('/stats', authenticateToken, OptimizedUsersController.getUserStats);

/**
 * @route GET /api/optimized-users/performance
 * @desc Get database performance statistics
 * @access Private (Admin)
 */
router.get('/performance', authenticateToken, OptimizedUsersController.getPerformanceStats);

/**
 * @route POST /api/optimized-users/cache/clear
 * @desc Clear cache for specific patterns
 * @access Private (Admin)
 */
router.post('/cache/clear', authenticateToken, OptimizedUsersController.clearCache);

/**
 * @route DELETE /api/optimized-users/account
 * @desc Delete current user account with cache cleanup
 * @access Private
 */
router.delete('/account', authenticateToken, OptimizedUsersController.deleteAccount);

export default router; 