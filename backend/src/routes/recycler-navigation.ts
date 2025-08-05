import express from 'express';
import { RecyclerNavigationController } from '../controllers/recyclerNavigationController';
import { authenticateRecycler } from '../middleware/auth';

const router = express.Router();

/**
 * @route POST /api/recycler-navigation/start
 * @desc Start navigation to pickup location
 * @access Private (Recycler)
 */
router.post('/start', authenticateRecycler, RecyclerNavigationController.startNavigation);

/**
 * @route PUT /api/recycler-navigation/update-location
 * @desc Update recycler's current location during navigation
 * @access Private (Recycler)
 */
router.put('/update-location', authenticateRecycler, RecyclerNavigationController.updateLocation);

/**
 * @route POST /api/recycler-navigation/arrive
 * @desc Mark arrival at pickup location
 * @access Private (Recycler)
 */
router.post('/arrive', authenticateRecycler, RecyclerNavigationController.markArrival);

/**
 * @route GET /api/recycler-navigation/route/:pickupId
 * @desc Get route information for pickup
 * @access Private (Recycler)
 */
router.get('/route/:pickupId', authenticateRecycler, RecyclerNavigationController.getRouteInfo);

/**
 * @route POST /api/recycler-navigation/cancel
 * @desc Cancel navigation
 * @access Private (Recycler)
 */
router.post('/cancel', authenticateRecycler, RecyclerNavigationController.cancelNavigation);

export default router; 