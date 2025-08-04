import express from 'express';
import { HistoryController } from '../controllers/historyController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route GET /api/history
 * @desc Get user's waste collection history
 * @access Private
 */
router.get('/', authenticateToken, HistoryController.getHistory);

/**
 * @route GET /api/history/:id
 * @desc Get specific collection details for history
 * @access Private
 */
router.get('/:id', authenticateToken, HistoryController.getCollectionDetails);

/**
 * @route GET /api/history/stats
 * @desc Get history statistics
 * @access Private
 */
router.get('/stats', authenticateToken, HistoryController.getHistoryStats);

/**
 * @route GET /api/history/export
 * @desc Export history data (CSV format)
 * @access Private
 */
router.get('/export', authenticateToken, HistoryController.exportHistory);

/**
 * @route GET /api/history/filter
 * @desc Get filtered history based on criteria
 * @access Private
 */
router.get('/filter', authenticateToken, HistoryController.getFilteredHistory);

export default router; 