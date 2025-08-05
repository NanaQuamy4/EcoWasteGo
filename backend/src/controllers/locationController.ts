import { Request, Response } from 'express';

export class LocationController {
  /**
   * Search for pickup locations
   */
  static async searchLocations(req: Request, res: Response): Promise<void> {
    try {
      const { query, lat, lng, radius = 5000 } = req.query;

      if (!query && !lat && !lng) {
        res.status(400).json({
          success: false,
          error: 'Query or coordinates are required'
        });
        return;
      }

      // TODO: When Google API key is ready, replace with actual Google Places API call
      // const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
      // const response = await fetch(
      //   `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&location=${lat},${lng}&radius=${radius}&key=${googleApiKey}`
      // );

      // For now, return mock data based on the suggestions from HomeScreen
      const mockLocations = [
        {
          id: '1',
          name: 'Gold Hostel, Komfo Anokye',
          address: 'Komfo Anokye Teaching Hospital, Kumasi',
          lat: 6.6734,
          lng: -1.5714,
          type: 'hostel',
          rating: 4.2
        },
        {
          id: '2',
          name: 'Atonsu Unity Oil',
          address: 'Atonsu, Kumasi',
          lat: 6.6750,
          lng: -1.5730,
          type: 'gas_station',
          rating: 4.0
        },
        {
          id: '3',
          name: 'KNUST Campus',
          address: 'Kwame Nkrumah University of Science and Technology, Kumasi',
          lat: 6.6728,
          lng: -1.5693,
          type: 'university',
          rating: 4.5
        },
        {
          id: '4',
          name: 'Kumasi Central Market',
          address: 'Central Market, Kumasi',
          lat: 6.6745,
          lng: -1.5720,
          type: 'market',
          rating: 4.1
        }
      ];

      // Filter locations based on query if provided
      const filteredLocations = query 
        ? mockLocations.filter(location => 
            location.name.toLowerCase().includes((query as string).toLowerCase()) ||
            location.address.toLowerCase().includes((query as string).toLowerCase())
          )
        : mockLocations;

      res.json({
        success: true,
        data: {
          locations: filteredLocations,
          total: filteredLocations.length
        },
        message: 'Locations retrieved successfully'
      });
    } catch (error) {
      console.error('Error searching locations:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search locations'
      });
    }
  }

  /**
   * Get location suggestions based on query
   */
  static async getLocationSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.query;

      if (!query) {
        res.status(400).json({
          success: false,
          error: 'Query is required'
        });
        return;
      }

      // Mock suggestions based on HomeScreen suggestions
      const allSuggestions = [
        'Gold Hostel, Komfo Anokye',
        'Atonsu Unity Oil',
        'KNUST Campus',
        'Kumasi Central Market',
        'Kejetia Market',
        'Adum Shopping Center',
        'Kumasi Airport',
        'Prempeh Assembly Hall'
      ];

      const filteredSuggestions = allSuggestions.filter(suggestion =>
        suggestion.toLowerCase().includes((query as string).toLowerCase())
      );

      res.json({
        success: true,
        data: {
          suggestions: filteredSuggestions
        },
        message: 'Location suggestions retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting location suggestions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get location suggestions'
      });
    }
  }

  /**
   * Get nearby pickup points
   */
  static async getNearbyPickupPoints(req: Request, res: Response): Promise<void> {
    try {
      const { lat, lng, radius = 5000 } = req.query;

      if (!lat || !lng) {
        res.status(400).json({
          success: false,
          error: 'Latitude and longitude are required'
        });
        return;
      }

      // TODO: When Google API key is ready, replace with actual Google Places API call
      // const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
      // const response = await fetch(
      //   `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=establishment&key=${googleApiKey}`
      // );

      // Mock nearby pickup points
      const nearbyPoints = [
        {
          id: '1',
          name: 'Gold Hostel, Komfo Anokye',
          address: 'Komfo Anokye Teaching Hospital, Kumasi',
          distance: '0.5 km',
          lat: parseFloat(lat as string) + 0.001,
          lng: parseFloat(lng as string) + 0.001,
          type: 'hostel'
        },
        {
          id: '2',
          name: 'Atonsu Unity Oil',
          address: 'Atonsu, Kumasi',
          distance: '1.2 km',
          lat: parseFloat(lat as string) + 0.002,
          lng: parseFloat(lng as string) + 0.002,
          type: 'gas_station'
        }
      ];

      res.json({
        success: true,
        data: {
          pickupPoints: nearbyPoints,
          total: nearbyPoints.length
        },
        message: 'Nearby pickup points retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting nearby pickup points:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get nearby pickup points'
      });
    }
  }

  /**
   * Validate pickup location
   */
  static async validatePickupLocation(req: Request, res: Response): Promise<void> {
    try {
      const { location, lat, lng } = req.body;

      if (!location) {
        res.status(400).json({
          success: false,
          error: 'Location is required'
        });
        return;
      }

      // TODO: When Google API key is ready, validate with Google Geocoding API
      // const googleApiKey = process.env.GOOGLE_PLACES_API_KEY;
      // const response = await fetch(
      //   `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${googleApiKey}`
      // );

      // Mock validation - always return valid for now
      const isValid = true;
      const validatedLocation = {
        name: location,
        address: location,
        lat: lat || 6.6734,
        lng: lng || -1.5714,
        isValid
      };

      res.json({
        success: true,
        data: validatedLocation,
        message: 'Location validated successfully'
      });
    } catch (error) {
      console.error('Error validating pickup location:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to validate pickup location'
      });
    }
  }
} 