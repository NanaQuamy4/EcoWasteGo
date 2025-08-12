import express from 'express';
import { WasteController } from '../controllers/wasteController';
import { authenticateCustomer, authenticateRecycler, authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route POST /api/waste/collections
 * @desc Create a new waste collection request
 * @access Private (Customer only)
 */
router.post('/collections', authenticateCustomer, WasteController.createCollection);

/**
 * @route GET /api/waste/collections
 * @desc Get waste collections for current user
 * @access Private
 */
router.get('/collections', authenticateToken, WasteController.getUserCollections);

/**
 * @route GET /api/waste/collections/:id
 * @desc Get specific waste collection details
 * @access Private
 */
router.get('/collections/:id', authenticateToken, WasteController.getCollectionDetails);

/**
 * @route PUT /api/waste/collections/:id/accept
 * @desc Accept a waste collection request (recycler only)
 * @access Private (Recycler only)
 */
router.put('/collections/:id/accept', authenticateRecycler, WasteController.acceptCollection);

/**
 * @route PUT /api/waste/collections/:id/start
 * @desc Start waste collection (recycler only)
 * @access Private (Recycler only)
 */
router.put('/collections/:id/start', authenticateRecycler, WasteController.startCollection);

/**
 * @route PUT /api/waste/collections/:id/complete
 * @desc Complete waste collection (recycler only)
 * @access Private (Recycler only)
 */
router.put('/collections/:id/complete', authenticateRecycler, WasteController.completeCollection);

/**
 * @route PUT /api/waste/collections/:id/cancel
 * @desc Cancel waste collection request
 * @access Private
 */
router.put('/collections/:id/cancel', authenticateToken, WasteController.cancelCollection);

/**
 * @route PUT /api/waste/status/:id
 * @desc Update waste collection status (generic status update)
 * @access Private
 */
router.put('/status/:id', authenticateToken, WasteController.updateStatus);

/**
 * @route GET /api/waste/available
 * @desc Get available waste collections for recyclers
 * @access Private (Recycler only)
 */
router.get('/available', authenticateRecycler, WasteController.getAvailableCollections);

/**
 * @route GET /api/waste/recyclers/available
 * @desc Get available recyclers excluding those who have rejected this customer's requests
 * @access Private (Customer only)
 */
router.get('/recyclers/available', authenticateCustomer, WasteController.getAvailableRecyclersExcludingRejected);

/**
 * @route GET /api/waste/recycler/requests
 * @desc Get waste collection requests for recyclers with customer information
 * @access Private (Recycler only)
 */
router.get('/recycler/requests', authenticateRecycler, WasteController.getRecyclerRequests);

export default router; 