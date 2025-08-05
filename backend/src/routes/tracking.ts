import express from 'express';
import { TrackingController } from '../controllers/trackingController';
import { authenticateRecycler, authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route POST /api/tracking/start
 * @desc Start location tracking for a pickup
 * @access Private (Recycler)
 */
router.post('/start', authenticateRecycler, TrackingController.startTracking);

/**
 * @route PUT /api/tracking/update
 * @desc Update recycler's current location
 * @access Private (Recycler)
 */
router.put('/update', authenticateRecycler, TrackingController.updateLocation);

/**
 * @route GET /api/tracking/:pickupId
 * @desc Get real-time tracking data for a pickup
 * @access Private (Customer/Recycler)
 */
router.get('/:pickupId', authenticateToken, TrackingController.getTrackingData);

/**
 * @route GET /api/tracking/:pickupId/eta
 * @desc Get estimated arrival time
 * @access Private (Customer/Recycler)
 */
router.get('/:pickupId/eta', authenticateToken, TrackingController.getETA);

/**
 * @route POST /api/tracking/:pickupId/route
 * @desc Get optimized route to pickup location
 * @access Private (Recycler)
 */
router.post('/:pickupId/route', authenticateRecycler, TrackingController.getRoute);

/**
 * @route PUT /api/tracking/:pickupId/status
 * @desc Update tracking status (en_route, arrived, etc.)
 * @access Private (Recycler)
 */
router.put('/:pickupId/status', authenticateRecycler, TrackingController.updateStatus);

/**
 * @route POST /api/tracking/:pickupId/stop
 * @desc Stop location tracking
 * @access Private (Recycler)
 */
router.post('/:pickupId/stop', authenticateRecycler, TrackingController.stopTracking);

export default router; 