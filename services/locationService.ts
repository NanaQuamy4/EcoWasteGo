import * as Location from 'expo-location';
import { apiService } from './apiService';

export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
}

export interface RecyclerLocation {
  id: string;
  name: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  rating: number;
  distance: string;
  phone?: string;
  isAvailable: boolean;
}

class LocationService {
  /**
   * Request location permissions with user-friendly messaging
   */
  async requestLocationPermission(): Promise<{ granted: boolean; message?: string }> {
    try {
      // Check if permission is already granted
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus === 'granted') {
        return { granted: true };
      }

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        return { granted: true };
      } else if (status === 'denied') {
        return { 
          granted: false, 
          message: 'Location permission was denied. Please enable location access in your device settings to use this feature.' 
        };
      } else if (status === 'restricted') {
        return { 
          granted: false, 
          message: 'Location access is restricted. This might be due to parental controls or device policies.' 
        };
      } else {
        return { 
          granted: false, 
          message: 'Location permission was not determined. Please try again.' 
        };
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return { 
        granted: false, 
        message: 'Failed to request location permission. Please check your device settings.' 
      };
    }
  }

  /**
   * Get current location with enhanced error handling
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      const permissionResult = await this.requestLocationPermission();
      
      if (!permissionResult.granted) {
        throw new Error(permissionResult.message || 'Location permission not granted');
      }

      // Check if location services are enabled
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        throw new Error('Location services are disabled. Please enable GPS in your device settings.');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      throw error; // Re-throw to let caller handle the error
    }
  }

  /**
   * Get address from coordinates (reverse geocoding)
   */
  async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string | null> {
    try {
      const response = await apiService.request(`/api/locations/reverse-geocode?lat=${latitude}&lng=${longitude}`);
      return (response.data as any)?.address || null;
    } catch (error) {
      console.error('Error getting address from coordinates:', error);
      return null;
    }
  }

  /**
   * Get coordinates from address (geocoding)
   */
  async getCoordinatesFromAddress(address: string): Promise<LocationData | null> {
    try {
      const response = await apiService.request(`/api/locations/geocode?address=${encodeURIComponent(address)}`);
      const data = response.data as any;
      if (data?.latitude && data?.longitude) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          address: address,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting coordinates from address:', error);
      return null;
    }
  }

  /**
   * Find nearby recyclers
   */
  async findNearbyRecyclers(latitude: number, longitude: number, radius: number = 5000): Promise<RecyclerLocation[]> {
    try {
      const response = await apiService.request(`/api/locations/nearby-recyclers?lat=${latitude}&lng=${longitude}&radius=${radius}`);
      return (response.data as RecyclerLocation[]) || [];
    } catch (error) {
      console.error('Error finding nearby recyclers:', error);
      // Return mock data for development
      return this.getMockRecyclers();
    }
  }

  /**
   * Calculate distance between two points
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get directions between two points
   */
  async getDirections(
    origin: LocationData,
    destination: LocationData
  ): Promise<{
    distance: string;
    duration: string;
    polyline: string;
  } | null> {
    try {
      const response = await apiService.request('/api/locations/directions', {
        method: 'POST',
        body: JSON.stringify({
          origin: { lat: origin.latitude, lng: origin.longitude },
          destination: { lat: destination.latitude, lng: destination.longitude },
        }),
      });
      return (response.data as any) || null;
    } catch (error) {
      console.error('Error getting directions:', error);
      return null;
    }
  }

  /**
   * Start location tracking
   */
  async startLocationTracking(
    onLocationUpdate: (location: LocationData) => void,
    interval: number = 5000
  ): Promise<() => void> {
    try {
      const permissionResult = await this.requestLocationPermission();
      if (!permissionResult.granted) {
        throw new Error(permissionResult.message || 'Location permission not granted');
      }

      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: interval,
          distanceInterval: 10, // Update every 10 meters
        },
        (location) => {
          onLocationUpdate({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );

      // Return cleanup function
      return () => {
        locationSubscription.remove();
      };
    } catch (error) {
      console.error('Error starting location tracking:', error);
      return () => {};
    }
  }

  /**
   * Validate coordinates
   */
  validateCoordinates(latitude: number, longitude: number): boolean {
    return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
  }

  /**
   * Mock recyclers for development
   */
  private getMockRecyclers(): RecyclerLocation[] {
    return [
      {
        id: '1',
        name: 'Green Waste Solutions',
        coordinate: { latitude: 6.6734, longitude: -1.5714 },
        rating: 4.5,
        distance: '0.5 km',
        phone: '+2330546732719',
        isAvailable: true,
      },
      {
        id: '2',
        name: 'Eco Collectors',
        coordinate: { latitude: 6.6834, longitude: -1.5814 },
        rating: 4.2,
        distance: '1.2 km',
        phone: '+2330546732718',
        isAvailable: true,
      },
      {
        id: '3',
        name: 'Recycle Pro',
        coordinate: { latitude: 6.6634, longitude: -1.5614 },
        rating: 4.8,
        distance: '0.8 km',
        phone: '+2330546732717',
        isAvailable: false,
      },
    ];
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export default new LocationService(); 