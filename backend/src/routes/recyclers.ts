import express from 'express';
import { RecyclersController } from '../controllers/recyclersController';
import { authenticateRecycler, authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route POST /api/recyclers/profile
 * @desc Create or update recycler profile
 * @access Private (Recycler only)
 */
router.post('/profile', authenticateRecycler, RecyclersController.createUpdateProfile);

/**
 * @route GET /api/recyclers/profile
 * @desc Get current recycler profile
 * @access Private (Recycler only)
 */
router.get('/profile', authenticateRecycler, RecyclersController.getProfile);

/**
 * @route GET /api/recyclers/search
 * @desc Search for recyclers by criteria
 * @access Public
 */
router.get('/search', RecyclersController.searchRecyclers);

/**
 * @route GET /api/recyclers/:id
 * @desc Get specific recycler profile
 * @access Public
 */
router.get('/:id', RecyclersController.getRecyclerProfile);

/**
 * @route GET /api/recyclers/:id/contact
 * @desc Get recycler contact information for calling
 * @access Public
 */
router.get('/:id/contact', RecyclersController.getRecyclerContact);

/**
 * @route GET /api/recyclers/:id/stats
 * @desc Get recycler statistics and performance data
 * @access Public
 */
router.get('/:id/stats', RecyclersController.getRecyclerStats);

/**
 * @route PUT /api/recyclers/availability
 * @desc Update recycler availability
 * @access Private (Recycler only)
 */
router.put('/availability', authenticateRecycler, RecyclersController.updateAvailability);

/**
 * @route POST /api/recyclers/reviews
 * @desc Add review for recycler
 * @access Private (Customer only)
 */
router.post('/reviews', authenticateToken, RecyclersController.addReview);

/**
 * @route GET /api/recyclers/:id/reviews
 * @desc Get reviews for a recycler
 * @access Public
 */
router.get('/:id/reviews', RecyclersController.getRecyclerReviews);

/**
 * @route GET /api/recyclers/stats
 * @desc Get recycler statistics
 * @access Private (Recycler only)
 */
router.get('/stats', authenticateRecycler, RecyclersController.getRecyclerStatistics);

export default router; 