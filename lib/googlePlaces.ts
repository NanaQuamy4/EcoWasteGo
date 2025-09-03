// Google Places API service for location search and geocoding
// You'll need to add your Google Places API key to your environment variables

interface PlacePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  types: string[];
}

interface GeocodeResult {
  place_id: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

class GooglePlacesService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api';

  constructor() {
    // You'll need to set this in your environment variables
    this.apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('Google Places API key not found. Please set EXPO_PUBLIC_GOOGLE_PLACES_API_KEY in your environment variables.');
    } else {
      console.log('Google Places API key loaded successfully:', this.apiKey.substring(0, 10) + '...');
    }
  }

  // Get place predictions (autocomplete suggestions)
  async getPlacePredictions(input: string, location?: { lat: number; lng: number }): Promise<PlacePrediction[]> {
    if (!this.apiKey || input.length < 3) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        input,
        key: this.apiKey,
        types: 'establishment|geocode',
        language: 'en',
        components: 'country:gh', // Restrict to Ghana
      });

      // Add location bias if provided
      if (location) {
        params.append('location', `${location.lat},${location.lng}`);
        params.append('radius', '50000'); // 50km radius
      }

      const response = await fetch(`${this.baseUrl}/place/autocomplete/json?${params}`);
      const data = await response.json();

      if (data.status === 'OK') {
        console.log('Google Places API success:', data.predictions?.length || 0, 'predictions found');
        return data.predictions || [];
      } else {
        console.error('Google Places API error:', data.status, data.error_message);
        return [];
      }
    } catch (error) {
      console.error('Error fetching place predictions:', error);
      return [];
    }
  }

  // Get place details by place_id
  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const params = new URLSearchParams({
        place_id: placeId,
        key: this.apiKey,
        fields: 'place_id,name,formatted_address,geometry,types',
      });

      const response = await fetch(`${this.baseUrl}/place/details/json?${params}`);
      const data = await response.json();

      if (data.status === 'OK') {
        return data.result;
      } else {
        console.error('Google Places Details API error:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }
  }

  // Geocode an address to get coordinates
  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const params = new URLSearchParams({
        address,
        key: this.apiKey,
        region: 'gh', // Restrict to Ghana
      });

      const response = await fetch(`${this.baseUrl}/geocode/json?${params}`);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        console.log('Google Geocoding API success:', data.results[0].formatted_address);
        return data.results[0];
      } else {
        console.error('Google Geocoding API error:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
      return null;
    }
  }

  // Reverse geocode coordinates to get address
  async reverseGeocode(lat: number, lng: number): Promise<GeocodeResult | null> {
    if (!this.apiKey) {
      return null;
    }

    try {
      const params = new URLSearchParams({
        latlng: `${lat},${lng}`,
        key: this.apiKey,
        language: 'en',
      });

      const response = await fetch(`${this.baseUrl}/geocode/json?${params}`);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        return data.results[0];
      } else {
        console.error('Google Reverse Geocoding API error:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }
}

// Export singleton instance
export const googlePlacesService = new GooglePlacesService();

// Export types for use in components
export type { GeocodeResult, PlaceDetails, PlacePrediction };

