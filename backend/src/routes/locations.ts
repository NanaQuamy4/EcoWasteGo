import express from 'express';
import { LocationController } from '../controllers/locationController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Search locations using Google Maps API
router.get('/search', LocationController.searchLocations);

// Get location suggestions
router.get('/suggestions', LocationController.getLocationSuggestions);

// Get directions between two points
router.post('/directions', authenticateToken, LocationController.getDirections);

// Find nearby pickup points
router.get('/nearby-pickup-points', LocationController.getNearbyPickupPoints);

// Validate location coordinates
router.post('/validate', authenticateToken, LocationController.validateLocation);

export default router; 