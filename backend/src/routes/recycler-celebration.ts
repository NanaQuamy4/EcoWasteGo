import express from 'express';
import { RecyclerCelebrationController } from '../controllers/recyclerCelebrationController';
import { authenticateRecycler } from '../middleware/auth';

const router = express.Router();

/**
 * @route POST /api/recycler-celebration/complete
 * @desc Mark pickup as completed and trigger celebration
 * @access Private (Recycler)
 */
router.post('/complete', authenticateRecycler, RecyclerCelebrationController.completePickup);

/**
 * @route GET /api/recycler-celebration/achievements
 * @desc Get recycler achievements and stats
 * @access Private (Recycler)
 */
router.get('/achievements', authenticateRecycler, RecyclerCelebrationController.getAchievements);

/**
 * @route POST /api/recycler-celebration/eco-impact
 * @desc Calculate and record eco impact for completed pickup
 * @access Private (Recycler)
 */
router.post('/eco-impact', authenticateRecycler, RecyclerCelebrationController.recordEcoImpact);

/**
 * @route GET /api/recycler-celebration/stats
 * @desc Get recycler performance statistics
 * @access Private (Recycler)
 */
router.get('/stats', authenticateRecycler, RecyclerCelebrationController.getStats);

export default router; 