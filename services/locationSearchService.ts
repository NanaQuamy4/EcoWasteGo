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

            const response = await apiService.request<any>(`/api/locations/search?${params}`, {
              method: 'GET',
            });

            console.log('API Response:', response);

            // Handle both API response formats
            if (response.success && response.data && response.data.predictions) {
              // New format: { success: true, data: { predictions: [...] } }
              resolve(response.data.predictions);
            } else if (response.status === 'OK' && response.predictions) {
              // Backend format: { status: 'OK', predictions: [...] }
              resolve(response.predictions);
            } else if (response.data && Array.isArray(response.data)) {
              // Direct array format
              resolve(response.data);
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

      const response = await apiService.request<any>(`/api/locations/reverse-geocode?${params}`, {
        method: 'GET',
      });

      console.log('Reverse geocoding response:', response);

      // Handle both response formats
      if (response.success && response.data && response.data.address) {
        return response.data.address;
      } else if (response.status === 'OK' && response.address) {
        return response.address;
      } else {
        return 'Unknown Location';
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return 'Unknown Location';
    }
  }

  /**
   * Mock suggestions for development/testing with more Ghana locations
   */
  private getMockSuggestions(query: string): LocationSuggestion[] {
    const mockLocations = [
      // Kumasi locations
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
      // Accra locations
      {
        id: '9',
        name: 'Accra Mall',
        address: 'Accra Mall, East Legon, Accra, Ghana',
        coordinate: { latitude: 5.6037, longitude: -0.1870 },
        type: 'establishment' as const,
      },
      {
        id: '10',
        name: 'Makola Market',
        address: 'Makola Market, Accra Central, Ghana',
        coordinate: { latitude: 5.5560, longitude: -0.1969 },
        type: 'establishment' as const,
      },
      {
        id: '11',
        name: 'University of Ghana',
        address: 'University of Ghana, Legon, Accra',
        coordinate: { latitude: 5.6515, longitude: -0.1870 },
        type: 'establishment' as const,
      },
      {
        id: '12',
        name: 'Kotoka International Airport',
        address: 'Kotoka International Airport, Accra, Ghana',
        coordinate: { latitude: 5.6052, longitude: -0.1668 },
        type: 'establishment' as const,
      },
      // More towns and cities
      {
        id: '13',
        name: 'Cape Coast Castle',
        address: 'Cape Coast Castle, Cape Coast, Ghana',
        coordinate: { latitude: 5.1053, longitude: -1.2466 },
        type: 'establishment' as const,
      },
      {
        id: '14',
        name: 'Takoradi Market Circle',
        address: 'Market Circle, Takoradi, Ghana',
        coordinate: { latitude: 4.8845, longitude: -1.7554 },
        type: 'establishment' as const,
      },
      {
        id: '15',
        name: 'Tamale Central Market',
        address: 'Central Market, Tamale, Ghana',
        coordinate: { latitude: 9.4034, longitude: -0.8424 },
        type: 'establishment' as const,
      },
      {
        id: '16',
        name: 'Ho Municipal Assembly',
        address: 'Ho Municipal Assembly, Ho, Ghana',
        coordinate: { latitude: 6.6116, longitude: 0.4693 },
        type: 'establishment' as const,
      },
      {
        id: '17',
        name: 'Sunyani Central Market',
        address: 'Central Market, Sunyani, Ghana',
        coordinate: { latitude: 7.3394, longitude: -2.3265 },
        type: 'establishment' as const,
      },
      {
        id: '18',
        name: 'Koforidua Jackson Park',
        address: 'Jackson Park, Koforidua, Ghana',
        coordinate: { latitude: 6.0940, longitude: -0.2638 },
        type: 'establishment' as const,
      },
    ];

    const filtered = mockLocations.filter(location =>
      location.name.toLowerCase().includes(query.toLowerCase()) ||
      location.address.toLowerCase().includes(query.toLowerCase())
    );

    console.log(`Mock search for "${query}" found ${filtered.length} results`);
    return filtered.slice(0, 8); // Increased to 8 suggestions
  }
}

export const locationSearchService = new LocationSearchService(); 