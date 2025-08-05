import { Client } from '@googlemaps/google-maps-services-js';

export class GoogleMapsService {
  private client: Client;

  constructor() {
    this.client = new Client({});
  }

  /**
   * Geocode an address to get coordinates
   */
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const response = await this.client.geocode({
        params: {
          address,
          key: process.env.GOOGLE_MAPS_API_KEY!,
        },
      });

      if (response.data.results.length > 0) {
        const location = response.data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
        };
      }
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    try {
      const response = await this.client.reverseGeocode({
        params: {
          latlng: { lat, lng },
          key: process.env.GOOGLE_MAPS_API_KEY!,
        },
      });

      if (response.data.results.length > 0) {
        return response.data.results[0].formatted_address;
      }
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  /**
   * Get directions between two points
   */
  async getDirections(
    origin: { lat: number; lng: number },
    destination: { lat: number; lng: number }
  ): Promise<{
    distance: string;
    duration: string;
    polyline: string;
    steps: any[];
  } | null> {
    try {
      const response = await this.client.directions({
        params: {
          origin: `${origin.lat},${origin.lng}`,
          destination: `${destination.lat},${destination.lng}`,
          key: process.env.GOOGLE_MAPS_API_KEY!,
        },
      });

      if (response.data.routes.length > 0) {
        const route = response.data.routes[0];
        const leg = route.legs[0];
        
        return {
          distance: leg.distance.text,
          duration: leg.duration.text,
          polyline: route.overview_polyline.points,
          steps: leg.steps,
        };
      }
      return null;
    } catch (error) {
      console.error('Directions error:', error);
      return null;
    }
  }

  /**
   * Search for nearby places
   */
  async searchNearbyPlaces(
    location: { lat: number; lng: number },
    radius: number = 5000,
    type?: string
  ): Promise<any[]> {
    try {
      const response = await this.client.placesNearby({
        params: {
          location: `${location.lat},${location.lng}`,
          radius,
          type,
          key: process.env.GOOGLE_MAPS_API_KEY!,
        },
      });

      return response.data.results.map(place => ({
        id: place.place_id,
        name: place.name,
        address: place.vicinity,
        location: place.geometry?.location,
        rating: place.rating,
        types: place.types,
      }));
    } catch (error) {
      console.error('Nearby places search error:', error);
      return [];
    }
  }

  /**
   * Get place details
   */
  async getPlaceDetails(placeId: string): Promise<any | null> {
    try {
      const response = await this.client.placeDetails({
        params: {
          place_id: placeId,
          fields: ['name', 'formatted_address', 'geometry', 'phone_number', 'website', 'opening_hours'],
          key: process.env.GOOGLE_MAPS_API_KEY!,
        },
      });

      return response.data.result;
    } catch (error) {
      console.error('Place details error:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Find nearest recycler to a location
   */
  async findNearestRecycler(
    location: { lat: number; lng: number },
    recyclers: Array<{ id: string; location: { lat: number; lng: number } }>
  ): Promise<{ id: string; distance: number } | null> {
    if (recyclers.length === 0) return null;

    let nearest = null;
    let minDistance = Infinity;

    for (const recycler of recyclers) {
      const distance = this.calculateDistance(location, recycler.location);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = { id: recycler.id, distance };
      }
    }

    return nearest;
  }

  /**
   * Validate if coordinates are within a reasonable range
   */
  validateCoordinates(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export default new GoogleMapsService(); 