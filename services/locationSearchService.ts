import { apiService } from './apiService';

export interface LocationSuggestion {
  id: string;
  name: string;
  address: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  type: 'establishment' | 'geocode' | 'route' | 'street_address';
}

export interface SearchResult {
  predictions: LocationSuggestion[];
  status: string;
}

class LocationSearchService {
  private searchTimeout: number | null = null;

  /**
   * Search for locations based on user input
   */
  async searchLocations(query: string, location?: { latitude: number; longitude: number }): Promise<LocationSuggestion[]> {
    try {
      if (!query.trim()) return [];

      // Cancel previous search if new one is initiated
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      // Debounce the search to avoid too many API calls
      return new Promise((resolve) => {
        this.searchTimeout = setTimeout(async () => {
          try {
            const params = new URLSearchParams({
              query,
              ...(location?.latitude && { latitude: location.latitude.toString() }),
              ...(location?.longitude && { longitude: location.longitude.toString() }),
            });

            const response = await apiService.request<SearchResult>(`/api/locations/search?${params}`, {
              method: 'GET',
            });

            if (response.success && response.data) {
              resolve(response.data.predictions || []);
            } else {
              console.warn('Location search failed:', response);
              resolve([]);
            }
          } catch (error) {
            console.error('Error searching locations:', error);
            // Fallback to mock data if API fails
            resolve(this.getMockSuggestions(query));
          }
        }, 300); // 300ms debounce
      });
    } catch (error) {
      console.error('Location search error:', error);
      return this.getMockSuggestions(query);
    }
  }

  /**
   * Get location details by place ID
   */
  async getLocationDetails(placeId: string): Promise<LocationSuggestion | null> {
    try {
      const response = await apiService.request<LocationSuggestion>(`/api/locations/details/${placeId}`, {
        method: 'GET',
      });

      return response.success && response.data ? response.data : null;
    } catch (error) {
      console.error('Error getting location details:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(coordinate: { latitude: number; longitude: number }): Promise<string> {
    try {
      const params = new URLSearchParams({
        latitude: coordinate.latitude.toString(),
        longitude: coordinate.longitude.toString(),
      });

      const response = await apiService.request<{ address: string }>(`/api/locations/reverse-geocode?${params}`, {
        method: 'GET',
      });

      return response.success && response.data ? response.data.address : 'Unknown Location';
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return 'Unknown Location';
    }
  }

  /**
   * Mock suggestions for development/testing
   */
  private getMockSuggestions(query: string): LocationSuggestion[] {
    const mockLocations = [
      {
        id: '1',
        name: 'Gold Hostel, Komfo Anokye',
        address: 'Komfo Anokye Teaching Hospital, Kumasi, Ghana',
        coordinate: { latitude: 6.6734, longitude: -1.5714 },
        type: 'establishment' as const,
      },
      {
        id: '2',
        name: 'Atonsu Unity Oil',
        address: 'Atonsu, Kumasi, Ghana',
        coordinate: { latitude: 6.6834, longitude: -1.5814 },
        type: 'establishment' as const,
      },
      {
        id: '3',
        name: 'Kumasi Central Market',
        address: 'Central Market, Kumasi, Ghana',
        coordinate: { latitude: 6.6634, longitude: -1.5614 },
        type: 'establishment' as const,
      },
      {
        id: '4',
        name: 'KNUST Campus',
        address: 'Kwame Nkrumah University of Science and Technology, Kumasi',
        coordinate: { latitude: 6.6934, longitude: -1.5914 },
        type: 'establishment' as const,
      },
      {
        id: '5',
        name: 'Kejetia Market',
        address: 'Kejetia Market, Kumasi, Ghana',
        coordinate: { latitude: 6.6534, longitude: -1.5514 },
        type: 'establishment' as const,
      },
      {
        id: '6',
        name: 'Kumasi Airport',
        address: 'Kumasi Airport, Kumasi, Ghana',
        coordinate: { latitude: 6.7034, longitude: -1.6014 },
        type: 'establishment' as const,
      },
      {
        id: '7',
        name: 'Adum Shopping District',
        address: 'Adum, Kumasi, Ghana',
        coordinate: { latitude: 6.6434, longitude: -1.5414 },
        type: 'establishment' as const,
      },
      {
        id: '8',
        name: 'Manhyia Palace',
        address: 'Manhyia Palace, Kumasi, Ghana',
        coordinate: { latitude: 6.7134, longitude: -1.6114 },
        type: 'establishment' as const,
      },
    ];

    const filtered = mockLocations.filter(location =>
      location.name.toLowerCase().includes(query.toLowerCase()) ||
      location.address.toLowerCase().includes(query.toLowerCase())
    );

    return filtered.slice(0, 5); // Limit to 5 suggestions
  }
}

export const locationSearchService = new LocationSearchService(); 