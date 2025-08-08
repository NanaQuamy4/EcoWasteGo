import express from 'express';
import googleMapsService from '../services/googleMapsService';

const router = express.Router();

/**
 * Search for locations using Google Places API
 */
router.get('/search', async (req, res) => {
  try {
    const { query, latitude, longitude } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        status: 'INVALID_REQUEST',
        message: 'Query parameter is required',
      });
    }

    const location = latitude && longitude ? {
      latitude: parseFloat(latitude as string),
      longitude: parseFloat(longitude as string),
    } : undefined;

    const predictions = await googleMapsService.searchPlaces(query, location);

    return res.json({
      status: 'OK',
      predictions,
    });
  } catch (error) {
    console.error('Location search error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Failed to search locations',
    });
  }
});

/**
 * Get location details by place ID
 */
router.get('/details/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;

    if (!placeId) {
      return res.status(400).json({
        status: 'INVALID_REQUEST',
        message: 'Place ID is required',
      });
    }

    const details = await googleMapsService.getPlaceDetails(placeId);

    if (!details) {
      return res.status(404).json({
        status: 'NOT_FOUND',
        message: 'Location not found',
      });
    }

    return res.json(details);
  } catch (error) {
    console.error('Location details error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Failed to get location details',
    });
  }
});

/**
 * Reverse geocode coordinates to get address
 */
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        status: 'INVALID_REQUEST',
        message: 'Latitude and longitude are required',
      });
    }

    const coordinate = {
      latitude: parseFloat(latitude as string),
      longitude: parseFloat(longitude as string),
    };

    const address = await googleMapsService.reverseGeocode(coordinate.latitude, coordinate.longitude);

    return res.json({
      status: 'OK',
      address,
    });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    return res.status(500).json({
      status: 'ERROR',
      message: 'Failed to reverse geocode',
    });
  }
});

export default router; 