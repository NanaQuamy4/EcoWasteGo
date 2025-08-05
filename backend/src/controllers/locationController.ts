import { Request, Response } from 'express';
import googleMapsService from '../services/googleMapsService';

export class LocationController {
  /**
   * Search for locations using Google Maps API
   */
  static async searchLocations(req: Request, res: Response): Promise<Response | void> {
    try {
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Query parameter is required'
        });
      }

      // Use Google Maps Geocoding API
      const coordinates = await googleMapsService.geocodeAddress(query);
      
      if (!coordinates) {
        return res.status(404).json({
          success: false,
          message: 'Location not found'
        });
      }

      // Get nearby places for additional context
      const nearbyPlaces = await googleMapsService.searchNearbyPlaces(coordinates, 2000);

      return res.json({
        success: true,
        data: {
          query,
          coordinates,
          nearbyPlaces: nearbyPlaces.slice(0, 5), // Limit to 5 nearby places
          formattedAddress: await googleMapsService.reverseGeocode(coordinates.lat, coordinates.lng)
        }
      });
    } catch (error) {
      console.error('Location search error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error searching for location'
      });
    }
  }

  /**
   * Get location suggestions based on partial input
   */
  static async getLocationSuggestions(req: Request, res: Response): Promise<Response | void> {
    try {
      const { input } = req.query;

      if (!input || typeof input !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Input parameter is required'
        });
      }

      // For now, we'll use geocoding with partial input
      // In a production app, you might want to use Google Places Autocomplete API
      const coordinates = await googleMapsService.geocodeAddress(input);
      
      if (!coordinates) {
        return res.status(404).json({
          success: false,
          message: 'No suggestions found'
        });
      }

      const address = await googleMapsService.reverseGeocode(coordinates.lat, coordinates.lng);
      const nearbyPlaces = await googleMapsService.searchNearbyPlaces(coordinates, 1000);

      const suggestions = [
        {
          id: 'geocoded',
          name: address || input,
          coordinates,
          type: 'geocoded'
        },
        ...nearbyPlaces.slice(0, 4).map(place => ({
          id: place.id,
          name: place.name,
          coordinates: place.location,
          type: 'nearby'
        }))
      ];

      return res.json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      console.error('Location suggestions error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error getting location suggestions'
      });
    }
  }

  /**
   * Get directions between two points
   */
  static async getDirections(req: Request, res: Response): Promise<Response | void> {
    try {
      const { origin, destination } = req.body;

      if (!origin || !destination) {
        return res.status(400).json({
          success: false,
          message: 'Origin and destination are required'
        });
      }

      // Validate coordinates
      if (!googleMapsService.validateCoordinates(origin.lat, origin.lng) ||
          !googleMapsService.validateCoordinates(destination.lat, destination.lng)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coordinates provided'
        });
      }

      const directions = await googleMapsService.getDirections(origin, destination);

      if (!directions) {
        return res.status(404).json({
          success: false,
          message: 'Could not find route between points'
        });
      }

      return res.json({
        success: true,
        data: directions
      });
    } catch (error) {
      console.error('Directions error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error getting directions'
      });
    }
  }

  /**
   * Find nearby pickup points
   */
  static async getNearbyPickupPoints(req: Request, res: Response): Promise<Response | void> {
    try {
      const { lat, lng, radius = 5000 } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      const searchRadius = parseInt(radius as string);

      if (!googleMapsService.validateCoordinates(latitude, longitude)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coordinates provided'
        });
      }

      // Search for recycling centers, waste management facilities, etc.
      const pickupPoints = await googleMapsService.searchNearbyPlaces(
        { lat: latitude, lng: longitude },
        searchRadius,
        'establishment'
      );

      // Filter for relevant places (you can customize this based on your needs)
      const relevantPlaces = pickupPoints.filter(place => 
        place.types.some(type => 
          ['recycling_center', 'waste_management', 'establishment'].includes(type)
        )
      );

      return res.json({
        success: true,
        data: {
          location: { lat: latitude, lng: longitude },
          radius: searchRadius,
          pickupPoints: relevantPlaces,
          totalFound: relevantPlaces.length
        }
      });
    } catch (error) {
      console.error('Nearby pickup points error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error finding nearby pickup points'
      });
    }
  }

  /**
   * Validate location coordinates
   */
  static async validateLocation(req: Request, res: Response): Promise<Response | void> {
    try {
      const { lat, lng } = req.body;

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }

      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      const isValid = googleMapsService.validateCoordinates(latitude, longitude);
      const address = isValid ? await googleMapsService.reverseGeocode(latitude, longitude) : null;

      return res.json({
        success: true,
        data: {
          isValid,
          coordinates: { lat: latitude, lng: longitude },
          address,
          validatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Location validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error validating location'
      });
    }
  }
} 