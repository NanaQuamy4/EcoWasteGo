import express from 'express';
import { RewardsController } from '../controllers/rewardsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route GET /api/rewards
 * @desc Get rewards for current user
 * @access Private
 */
router.get('/', authenticateToken, RewardsController.getRewards);

/**
 * @route GET /api/rewards/available
 * @desc Get available rewards that user can claim
 * @access Private
 */
router.get('/available', authenticateToken, RewardsController.getAvailableRewards);

/**
 * @route POST /api/rewards/claim
 * @desc Claim a reward
 * @access Private
 */
router.post('/claim', authenticateToken, RewardsController.claimReward);

/**
 * @route GET /api/rewards/leaderboard
 * @desc Get rewards leaderboard
 * @access Public
 */
router.get('/leaderboard', RewardsController.getLeaderboard);

/**
 * @route GET /api/rewards/stats
 * @desc Get user rewards statistics
 * @access Private
 */
router.get('/stats', authenticateToken, RewardsController.getRewardsStats);

export default router; 