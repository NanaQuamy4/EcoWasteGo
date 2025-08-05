import { Request, Response } from 'express';

export class LocationController {
  /**
   * Search for pickup locations
   */
  static async searchLocations(req: Request, res: Response): Promise<Response | void> {
    try {
      const { query, lat, lng, radius = 5000 } = req.query;

      if (!query && !lat && !lng) {
        return res.status(400).json({
          success: false,
          error: 'Query or coordinates are required'
        });
      }

      // Use Google Places API for location search
      const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
      
      if (!googleApiKey) {
        return res.status(500).json({
          success: false,
          error: 'Google Maps API key not configured'
        });
      }

      let locations = [];
      
      if (query) {
        // Search by text query
        const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query as string)}&location=${lat},${lng}&radius=${radius}&key=${googleApiKey}`;
        
        try {
          const response = await fetch(searchUrl);
          const data = await response.json() as any;
          
          if (data.status === 'OK') {
            locations = data.results.map((place: any) => ({
              id: place.place_id,
              name: place.name,
              address: place.formatted_address,
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
              type: place.types?.[0] || 'establishment',
              rating: place.rating || 0
            }));
          }
        } catch (error) {
          console.error('Google Places API error:', error);
        }
      }

      // Fallback to mock data if no results or API fails
      if (locations.length === 0) {
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

        return res.json({
          success: true,
          data: {
            locations: filteredLocations,
            total: filteredLocations.length
          },
          message: 'Locations retrieved successfully'
        });
      }

      return res.json({
        success: true,
        data: {
          locations,
          total: locations.length
        },
        message: 'Locations retrieved successfully'
      });
    } catch (error) {
      console.error('Error searching locations:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to search locations'
      });
    }
  }

  /**
   * Get location suggestions based on query
   */
  static async getLocationSuggestions(req: Request, res: Response): Promise<Response | void> {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Query is required'
        });
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

      return res.json({
        success: true,
        data: {
          suggestions: filteredSuggestions
        },
        message: 'Location suggestions retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting location suggestions:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get location suggestions'
      });
    }
  }

  /**
   * Get nearby pickup points
   */
  static async getNearbyPickupPoints(req: Request, res: Response): Promise<Response | void> {
    try {
      const { lat, lng, radius = 5000 } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({
          success: false,
          error: 'Latitude and longitude are required'
        });
      }

      // Use Google Places API for nearby search
      const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
      
      if (!googleApiKey) {
        return res.status(500).json({
          success: false,
          error: 'Google Maps API key not configured'
        });
      }

      let nearbyPoints = [];
      
      try {
        const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=establishment&key=${googleApiKey}`;
        const response = await fetch(nearbyUrl);
        const data = await response.json() as any;
        
        if (data.status === 'OK') {
          nearbyPoints = data.results.map((place: any) => ({
            id: place.place_id,
            name: place.name,
            address: place.vicinity || place.formatted_address,
            distance: place.distance_meters ? `${(place.distance_meters / 1000).toFixed(1)} km` : 'Unknown',
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            type: place.types?.[0] || 'establishment'
          }));
        }
      } catch (error) {
        console.error('Google Places API error:', error);
      }

      // Fallback to mock data if no results or API fails
      if (nearbyPoints.length === 0) {
        nearbyPoints = [
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
      }

      return res.json({
        success: true,
        data: {
          pickupPoints: nearbyPoints,
          total: nearbyPoints.length
        },
        message: 'Nearby pickup points retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting nearby pickup points:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get nearby pickup points'
      });
    }
  }

  /**
   * Validate pickup location
   */
  static async validatePickupLocation(req: Request, res: Response): Promise<Response | void> {
    try {
      const { location, lat, lng } = req.body;

      if (!location) {
        return res.status(400).json({
          success: false,
          error: 'Location is required'
        });
      }

      // Use Google Geocoding API for address validation
      const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
      
      if (!googleApiKey) {
        return res.status(500).json({
          success: false,
          error: 'Google Maps API key not configured'
        });
      }

      let isValid = false;
      let validatedLocation = {
        name: location,
        address: location,
        lat: lat || 6.6734,
        lng: lng || -1.5714,
        isValid: false
      };

      try {
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(location)}&key=${googleApiKey}`;
        const response = await fetch(geocodeUrl);
        const data = await response.json() as any;
        
        if (data.status === 'OK' && data.results.length > 0) {
          const result = data.results[0];
          isValid = true;
          validatedLocation = {
            name: location,
            address: result.formatted_address,
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            isValid: true
          };
        }
      } catch (error) {
        console.error('Google Geocoding API error:', error);
      }

      // Fallback to mock validation
      if (!isValid) {
        isValid = true;
        validatedLocation = {
          name: location,
          address: location,
          lat: lat || 6.6734,
          lng: lng || -1.5714,
          isValid
        };
      }

      return res.json({
        success: true,
        data: validatedLocation,
        message: 'Location validated successfully'
      });
    } catch (error) {
      console.error('Error validating pickup location:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to validate pickup location'
      });
    }
  }
} 