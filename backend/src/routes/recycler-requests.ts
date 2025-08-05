import express from 'express';
import { RecyclerRequestsController } from '../controllers/recyclerRequestsController';
import { authenticateRecycler } from '../middleware/auth';

const router = express.Router();

/**
 * @route GET /api/recycler-requests
 * @desc Get pickup requests for recycler
 * @access Private (Recycler)
 */
router.get('/', authenticateRecycler, RecyclerRequestsController.getRequests);

/**
 * @route POST /api/recycler-requests/:requestId/accept
 * @desc Accept a pickup request
 * @access Private (Recycler)
 */
router.post('/:requestId/accept', authenticateRecycler, RecyclerRequestsController.acceptRequest);

/**
 * @route POST /api/recycler-requests/:requestId/reject
 * @desc Reject a pickup request
 * @access Private (Recycler)
 */
router.post('/:requestId/reject', authenticateRecycler, RecyclerRequestsController.rejectRequest);

/**
 * @route POST /api/recycler-requests/:requestId/complete
 * @desc Complete a pickup request
 * @access Private (Recycler)
 */
router.post('/:requestId/complete', authenticateRecycler, RecyclerRequestsController.completeRequest);

/**
 * @route GET /api/recycler-requests/filter
 * @desc Get filtered requests (all, active, completed)
 * @access Private (Recycler)
 */
router.get('/filter', authenticateRecycler, RecyclerRequestsController.getFilteredRequests);

/**
 * @route GET /api/recycler-requests/stats
 * @desc Get recycler request statistics
 * @access Private (Recycler)
 */
router.get('/stats', authenticateRecycler, RecyclerRequestsController.getRequestStats);

export default router; 