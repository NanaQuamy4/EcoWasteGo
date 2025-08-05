import express from 'express';
import { LocationController } from '../controllers/locationController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route GET /api/locations/search
 * @desc Search for pickup locations
 * @access Public
 */
router.get('/search', LocationController.searchLocations);

/**
 * @route GET /api/locations/suggestions
 * @desc Get location suggestions based on query
 * @access Public
 */
router.get('/suggestions', LocationController.getLocationSuggestions);

/**
 * @route GET /api/locations/nearby
 * @desc Get nearby pickup points
 * @access Public
 */
router.get('/nearby', LocationController.getNearbyPickupPoints);

/**
 * @route POST /api/locations/validate
 * @desc Validate pickup location
 * @access Private
 */
router.post('/validate', authenticateToken, LocationController.validatePickupLocation);

export default router; 