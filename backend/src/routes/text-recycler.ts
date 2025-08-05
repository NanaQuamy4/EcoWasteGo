import express from 'express';
import { TextRecyclerController } from '../controllers/textRecyclerController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route GET /api/text-recycler/:pickupId
 * @desc Get chat messages for a specific pickup
 * @access Private
 */
router.get('/:pickupId', authenticateToken, TextRecyclerController.getMessages);

/**
 * @route POST /api/text-recycler/:pickupId/send
 * @desc Send a message to recycler
 * @access Private
 */
router.post('/:pickupId/send', authenticateToken, TextRecyclerController.sendMessage);

/**
 * @route GET /api/text-recycler/:pickupId/recycler-info
 * @desc Get recycler information for the pickup
 * @access Private
 */
router.get('/:pickupId/recycler-info', authenticateToken, TextRecyclerController.getRecyclerInfo);

/**
 * @route GET /api/text-recycler/suggestions
 * @desc Get message suggestions
 * @access Private
 */
router.get('/suggestions', authenticateToken, TextRecyclerController.getMessageSuggestions);

export default router; 