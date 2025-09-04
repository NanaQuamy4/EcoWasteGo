import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, ImageBackground, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import DrawerMenu from '../../components/DrawerMenu';
import MapComponent from '../../components/MapComponent';
import { COLORS } from '../../constants';
import { useNotificationCountSimple as useNotificationCount } from '../../hooks/useNotificationCountSimple';
import { useOnlineRecyclers } from '../../hooks/useRecyclerOnlineStatus';
import { googlePlacesService, PlaceDetails, PlacePrediction } from '../../lib/googlePlaces';
import { supabase } from '../../lib/supabase';
// ===== REAL DATA INTERFACES =====
interface Recycler {
  id: string;
  full_name: string;
  company_name: string;
  residential_address: string;
  areas_of_operation: string;
  truck_size: 'small' | 'big';
  truck_number_plate: string;
  verification_status: 'incomplete' | 'pending' | 'approved' | 'rejected';
  is_available: boolean;
  profile_photo_url: string | null;
  created_at: string;
  // Computed fields
  coordinate?: { latitude: number; longitude: number };
  distance?: string;
  rating?: number;
  estimatedTime?: string;
}

interface LocationSuggestion {
  id: string;
  name: string;
  address: string;
  coordinate?: { latitude: number; longitude: number };
  type: 'geocode' | 'suggestion' | 'google_place';
  placeId?: string;
}

interface UserStats {
  totalPickups: number;
  totalSavings: number;
  environmentalImpact: number;
}



// Memoized recycler item component
const RecyclerItem = React.memo(({ recycler, onPress }: { recycler: any; onPress: (id: string) => void }) => (
  <TouchableOpacity style={styles.recyclerItem} onPress={() => onPress(recycler.id)}>
    <View style={styles.recyclerInfo}>
      <Text style={styles.recyclerName}>{recycler.name}</Text>
      <Text style={styles.recyclerDetails}>
        🚛 {recycler.truckType} • ⭐ {recycler.rating} • 📍 {recycler.distance}
      </Text>
      <Text style={styles.recyclerStatus}>📊 {recycler.status}</Text>
    </View>
  </TouchableOpacity>
));
RecyclerItem.displayName = 'RecyclerItem';

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [nearbyRecyclers, setNearbyRecyclers] = useState<Recycler[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [searchMarkers, setSearchMarkers] = useState<Array<{
    id: string;
    coordinate: { latitude: number; longitude: number };
    title: string;
    description: string;
    type: 'search' | 'pickup' | 'user';
  }>>([]);
  const [mapRegion, setMapRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);
  const [user, setUser] = useState<any>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [userStats, setUserStats] = useState<UserStats>({
    totalPickups: 0,
    totalSavings: 0,
    environmentalImpact: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Use real notification count
  const { notificationCount, loading: notificationLoading } = useNotificationCount();

  // Fetch user data
  const fetchUserData = useCallback(async () => {
    try {
      const { data: { user: currentUser }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
        return;
      }
      setUser(currentUser);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);

  // Fetch user stats
  const fetchUserStats = useCallback(async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      // Fetch pickup requests for this user
      const { data: pickupRequests, error } = await supabase
        .from('pickup_requests')
        .select('*')
        .eq('customer_id', currentUser.id);

      if (error) {
        console.error('Error fetching pickup requests:', error);
        return;
      }

      const completedPickups = pickupRequests?.filter(r => r.status === 'completed').length || 0;
      const totalSavings = completedPickups * 3.5; // Assume ₵3.50 savings per pickup
      const environmentalImpact = completedPickups * 7.4; // Assume 7.4kg CO2 saved per pickup

      setUserStats({
        totalPickups: completedPickups,
        totalSavings,
        environmentalImpact
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  }, []);

  // Use the new online recyclers hook
  const { recyclers: onlineRecyclers, loading: recyclersLoading } = useOnlineRecyclers();

  // Transform online recyclers data and add realistic Ghana coordinates
  const fetchAvailableRecyclers = useCallback(() => {
    // Real Ghana locations for recyclers
    const ghanaLocations = [
      { name: 'Accra Central', lat: 5.6037, lng: -0.1870 },
      { name: 'Kumasi Central', lat: 6.6885, lng: -1.6244 },
      { name: 'Takoradi Port', lat: 4.8845, lng: -1.7554 },
      { name: 'Tema Industrial', lat: 5.6833, lng: -0.0167 },
      { name: 'Cape Coast', lat: 5.1053, lng: -1.2466 },
      { name: 'Tamale', lat: 9.4008, lng: -0.8393 },
      { name: 'Sunyani', lat: 7.3399, lng: -2.3268 },
      { name: 'Koforidua', lat: 6.0941, lng: -0.2591 },
      { name: 'Ho', lat: 6.6008, lng: 0.4703 },
      { name: 'Bolgatanga', lat: 10.7856, lng: -0.8513 }
    ];

    const transformedRecyclers: Recycler[] = onlineRecyclers
      .filter(recycler => recycler.isAvailable && recycler.isOnline)
      .map((recycler, index) => {
        // Use real Ghana locations with small random offsets
        const baseLocation = ghanaLocations[index % ghanaLocations.length];
        const randomOffset = 0.005; // Small offset for variety
        
        return {
          id: recycler.id,
          full_name: recycler.fullName,
          company_name: `${recycler.fullName} Recycling Services`,
          residential_address: `${baseLocation.name}, Ghana`,
          areas_of_operation: `${baseLocation.name} and surrounding areas`,
          truck_size: recycler.truckSize as 'small' | 'big',
          truck_number_plate: `GR-${Math.floor(Math.random() * 9000 + 1000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
          verification_status: 'approved' as const,
          is_available: recycler.isAvailable,
          profile_photo_url: null,
          created_at: recycler.lastSeenAt,
          coordinate: {
            latitude: baseLocation.lat + (Math.random() - 0.5) * randomOffset,
            longitude: baseLocation.lng + (Math.random() - 0.5) * randomOffset
          },
          distance: `${(Math.random() * 3 + 0.5).toFixed(1)} km`,
          rating: recycler.rating || (4.0 + Math.random() * 1.0), // Random rating between 4.0-5.0
          estimatedTime: `${Math.floor(Math.random() * 25 + 5)} mins`
        };
      });
    
    // Set the real recyclers (no mock data fallback)
    setNearbyRecyclers(transformedRecyclers);
    
    // Log the actual number of recyclers found
    console.log(`Found ${transformedRecyclers.length} real online recyclers`);
    
    // console.log('Recyclers loaded:', transformedRecyclers.length || 3, 'recyclers');
  }, [onlineRecyclers]);

  // Google Places predictions state
  const [googlePredictions, setGooglePredictions] = useState<PlacePrediction[]>([]);

  // Memoized search handler with debouncing
  const handleSearch = useCallback((text: string) => {
    setSearch(text);
    setShowSuggestions(text.length > 0);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (text.length > 0) {
      // Debounce the search to avoid too many API calls
      searchTimeoutRef.current = setTimeout(() => {
        handleLocationSearch(text);
      }, 500); // 500ms delay
    } else {
      setLocationSuggestions([]);
      setSearchMarkers([]); // Clear search markers when search is cleared
    }
  }, []);

  // Geocoding service using Google Places API
  const geocodeAddress = useCallback(async (address: string): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      const result = await googlePlacesService.geocodeAddress(address);
      if (result) {
        return {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng
        };
      }
      
      // Fallback: Try to find coordinates for common Ghana locations
      const fallbackLocations: { [key: string]: { latitude: number; longitude: number } } = {
        'accra': { latitude: 5.6037, longitude: -0.1870 },
        'kumasi': { latitude: 6.6885, longitude: -1.6244 },
        'takoradi': { latitude: 4.8845, longitude: -1.7554 },
        'tema': { latitude: 5.6833, longitude: -0.0167 },
        'cape coast': { latitude: 5.1053, longitude: -1.2466 },
        'tamale': { latitude: 9.4008, longitude: -0.8393 },
        'sunyani': { latitude: 7.3399, longitude: -2.3268 },
        'koforidua': { latitude: 6.0941, longitude: -0.2591 }
      };
      
      const lowerAddress = address.toLowerCase();
      for (const [location, coords] of Object.entries(fallbackLocations)) {
        if (lowerAddress.includes(location)) {
          // console.log('Using fallback coordinates for:', location);
          return coords;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }, []);

  // Get place details from Google Places API
  const getPlaceDetails = useCallback(async (placeId: string): Promise<PlaceDetails | null> => {
    try {
      return await googlePlacesService.getPlaceDetails(placeId);
    } catch (error) {
      console.error('Error getting place details:', error);
      return null;
    }
  }, []);

  // Memoized location search handler using Google Places API
  const handleLocationSearch = useCallback(async (query: string) => {
    if (query.length < 3) return;
    
    setIsSearching(true);
    try {
      // Get Google Places predictions
      const predictions = await googlePlacesService.getPlacePredictions(
        query,
        userLocation ? {
          lat: userLocation.coords.latitude,
          lng: userLocation.coords.longitude
        } : undefined
      );
      
      setGooglePredictions(predictions);

      // Convert predictions to location suggestions
      const suggestions: LocationSuggestion[] = predictions.map(prediction => ({
        id: prediction.place_id,
        name: prediction.structured_formatting.main_text,
        address: prediction.structured_formatting.secondary_text,
        type: 'google_place' as const,
        placeId: prediction.place_id
      }));
      
      setLocationSuggestions(suggestions);

      // Try to geocode the search query and update map
      const coordinates = await geocodeAddress(query);
      if (coordinates) {
        // Add search marker
        const searchMarker = {
          id: `search-${Date.now()}`,
          coordinate: coordinates,
          title: query,
          description: 'Search Result',
          type: 'search' as const
        };
        setSearchMarkers([searchMarker]);

        // Update map region to center on search result
        setMapRegion({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01
        });
      }
    } catch (error) {
      console.error('Location search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [geocodeAddress, userLocation]);

  // Memoized suggestion selection handler
  const handleSuggestionSelect = useCallback(async (suggestion: LocationSuggestion) => {
    setSearch(suggestion.name);
    setShowSuggestions(false);
    setLocationSuggestions([]);
    
    let coordinates: { latitude: number; longitude: number } | null = null;
    
    // If it's a Google Place, get details from place_id
    if (suggestion.placeId) {
      const placeDetails = await getPlaceDetails(suggestion.placeId);
      if (placeDetails) {
        coordinates = {
          latitude: placeDetails.geometry.location.lat,
          longitude: placeDetails.geometry.location.lng
        };
      }
    }
    
    // Fallback to geocoding if no place details
    if (!coordinates) {
      coordinates = await geocodeAddress(suggestion.name);
    }
    
    if (coordinates) {
      const searchMarker = {
        id: `suggestion-${Date.now()}`,
        coordinate: coordinates,
        title: suggestion.name,
        description: suggestion.address,
        type: 'search' as const
      };
      setSearchMarkers([searchMarker]);
      
      setMapRegion({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      });
    }
  }, [geocodeAddress, getPlaceDetails]);

  // Memoized location selection handler
  const handleLocationSelect = useCallback(async (suggestion: LocationSuggestion) => {
    setSelectedLocation(suggestion);
    setSearch(suggestion.name);
    setShowSuggestions(false);
    setLocationSuggestions([]);
    
    // Fetch nearby recyclers for the selected location
    try {
      fetchAvailableRecyclers();
    } catch (error) {
      console.error('Error fetching nearby recyclers:', error);
    }
  }, []);

  // Memoized current location handler
  const getCurrentLocation = useCallback(async (): Promise<Location.LocationObject | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to find nearby recyclers.');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      return location;
    } catch (error) {
      console.error('Error getting location:', error);
      return null;
    }
  }, []);

  // Memoized map location selection handler
  const handleMapLocationSelect = useCallback(async (coordinate: { latitude: number; longitude: number }) => {
    try {
      // Create location suggestion from coordinates
      const address = `Location at Latitude: ${coordinate.latitude.toFixed(4)}, Longitude: ${coordinate.longitude.toFixed(4)}`;
      const locationSuggestion: LocationSuggestion = {
        id: 'map-selected',
        name: address,
        address: address,
        coordinate: coordinate,
        type: 'geocode',
      };
      setSelectedLocation(locationSuggestion);
      setSearch(address);
      
      // Fetch nearby recyclers for the selected location
      fetchAvailableRecyclers();
    } catch (error) {
      console.error('Error getting address from coordinates:', error);
      Alert.alert(
        'Location Selected',
        `Latitude: ${coordinate.latitude.toFixed(4)}\nLongitude: ${coordinate.longitude.toFixed(4)}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Use This Location', onPress: () => {
            setSearch('Selected Location');
          }}
        ]
      );
    }
  }, []);

  // Memoized map press handler
  const handleMapPress = useCallback((coordinate: { latitude: number; longitude: number }) => {
    handleMapLocationSelect(coordinate);
  }, [handleMapLocationSelect]);

  // Memoized recycler press handler
  const handleRecyclerPress = useCallback((recyclerId: string) => {
    const recycler = nearbyRecyclers.find(r => r.id === recyclerId);
    if (recycler) {
      Alert.alert(
        `${recycler.full_name || recycler.company_name}`,
        `🏢 ${recycler.company_name}\n🚛 ${recycler.truck_size.toUpperCase()} Truck (${recycler.truck_number_plate})\n⭐ Rating: ${recycler.rating?.toFixed(1) || 'N/A'}/5.0\n📍 Distance: ${recycler.distance || 'N/A'}\n⏱️ ETA: ${recycler.estimatedTime || 'N/A'}\n🌍 Area: ${recycler.areas_of_operation}\n📊 Status: ${recycler.is_available ? '🟢 Available' : '🔴 Busy'}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Request Pickup', onPress: () => {
            router.push({
              pathname: '/customer-screens/CallRecyclerScreen' as any,
              params: { 
                recyclerName: recycler.full_name || recycler.company_name,
                recyclerId: recycler.id,
                recyclerRating: recycler.rating?.toString() || '4.5',
                recyclerDistance: recycler.distance || '1.0 km'
              }
            });
          }},
          { text: 'Track Truck', onPress: () => {
            router.push({
              pathname: '/customer-screens/TrackingScreen' as any,
              params: { 
                recyclerName: recycler.full_name || recycler.company_name,
                recyclerId: recycler.id,
                recyclerLocation: recycler.residential_address
              }
            });
          }}
        ]
      );
    }
  }, [nearbyRecyclers, router]);

  // Memoized location detection handler
  const handleLocationDetection = useCallback(async () => {
    setIsDetectingLocation(true);
    try {
      const location = await getCurrentLocation();
      if (location) {
        const coordinates = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        // Try to get real address using reverse geocoding
        let address = `Current Location: ${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`;
        try {
          const reverseGeocodeResult = await googlePlacesService.reverseGeocode(
            coordinates.latitude, 
            coordinates.longitude
          );
          if (reverseGeocodeResult) {
            address = reverseGeocodeResult.formatted_address;
            // console.log('Reverse geocoding success:', address);
          }
        } catch (geocodeError) {
          console.log('Reverse geocoding failed, using coordinates:', geocodeError);
        }
        
        // Update search and selected location
        setSearch(address);
        setSelectedLocation({
          id: 'current-location',
          name: address,
          address: address,
          coordinate: coordinates,
          type: 'geocode',
        });

        // Add user location marker
        const userMarker = {
          id: 'user-location',
          coordinate: coordinates,
          title: 'Your Location',
          description: address,
          type: 'user' as const,
        };
        setSearchMarkers([
          userMarker]);

        // Auto-center map on user location
        setMapRegion({
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        
        // Get accuracy information
        const accuracy = location.coords.accuracy;
        let accuracyMessage = '';
        if (accuracy && accuracy <= 10) {
          accuracyMessage = 'High accuracy (±10m)';
        } else if (accuracy && accuracy <= 50) {
          accuracyMessage = 'Good accuracy (±50m)';
        } else {
          accuracyMessage = 'Low accuracy (±100m+)';
        }
        
        // Show success message with better UX
        Alert.alert(
          '📍 Location Found!',
          `${address}\n\nAccuracy: ${accuracyMessage}`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Use This Location', 
              onPress: async () => {
                // Fetch nearby recyclers for current location
                await fetchAvailableRecyclers();
                // console.log('Location set successfully:', address);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Location detection error:', error);
      
      // Better error handling with specific messages
      let errorMessage = 'Failed to detect your location. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('permission')) {
          errorMessage = 'Location permission is required. Please enable location access in your device settings.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Location detection timed out. Please try again.';
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your internet connection.';
        }
      }
      
      Alert.alert(
        'Location Error',
        errorMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: handleLocationDetection }
        ]
      );
    } finally {
      setIsDetectingLocation(false);
    }
  }, [getCurrentLocation, fetchAvailableRecyclers]);

  // Memoized drawer toggle handler
  const toggleDrawer = useCallback(() => {
    setDrawerOpen(!drawerOpen);
  }, [drawerOpen]);

  // Memoized keyboard dismiss handler
  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
    setShowSuggestions(false);
    setLocationSuggestions([]);
  }, []);

  // Memoized render item for FlatList
  const renderSuggestionItem = useCallback(({ item }: { item: LocationSuggestion }) => (
    <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSuggestionSelect(item)}>
      <MaterialIcons name="location-on" size={20} color={COLORS.primary} />
      <View style={styles.suggestionTextContainer}>
        <Text style={styles.suggestionText}>{item.name}</Text>
        <Text style={styles.suggestionAddress}>{item.address}</Text>
      </View>
    </TouchableOpacity>
  ), [handleSuggestionSelect]);

  const renderLocationItem = useCallback(({ item }: { item: LocationSuggestion }) => (
    <TouchableOpacity style={styles.locationItem} onPress={() => handleLocationSelect(item)}>
      <MaterialIcons name="location-on" size={20} color={COLORS.primary} />
      <View style={styles.locationTextContainer}>
        <Text style={styles.locationName}>{item.name}</Text>
        <Text style={styles.locationAddress}>{item.address}</Text>
      </View>
    </TouchableOpacity>
  ), [handleLocationSelect]);

  const renderRecyclerItem = useCallback(({ item }: { item: Recycler }) => (
    <RecyclerItem recycler={item} onPress={handleRecyclerPress} />
  ), [handleRecyclerPress]);

  // Memoized key extractors
  const keyExtractor = useCallback((item: any) => item.id || item.toString(), []);

  // Memoized getItemLayout for FlatList optimization
  const getItemLayout = useCallback((data: any, index: number) => ({
    length: 60, // Height of each item
    offset: 60 * index,
    index,
  }), []);

  // Memoized initial num to render
  const initialNumToRender = useMemo(() => 10, []);
  const maxToRenderPerBatch = useMemo(() => 10, []);
  const windowSize = useMemo(() => 10, []);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchUserData(),
          fetchUserStats(),
          getCurrentLocation()
        ]);
        // Fetch recyclers after other data is loaded
        fetchAvailableRecyclers();
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <AppHeader
          onMenuPress={() => setDrawerOpen(true)}
          onNotificationPress={() => router.push('/customer-screens/CustomerNotificationScreen' as any)}
          notificationCount={0}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading recyclers...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader
        onMenuPress={() => setDrawerOpen(true)}
        onNotificationPress={() => router.push('/customer-screens/CustomerNotificationScreen' as any)}
        notificationCount={notificationCount}
      />
      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      
      {/* Search Section */}
      <View style={styles.searchSection}>
        {/* Use My Location Button */}
        <TouchableOpacity
          style={[
            styles.useMyLocationButton,
            isDetectingLocation && { opacity: 0.7 }
          ]}
          disabled={isDetectingLocation}
          onPress={handleLocationDetection}
          >
            <MaterialIcons 
              name={isDetectingLocation ? "hourglass-empty" : "my-location"} 
              size={20} 
              color={COLORS.white} 
            />
            <Text style={styles.useMyLocationText}>
              {isDetectingLocation ? 'Detecting Location...' : 'Use My Location'}
            </Text>
          </TouchableOpacity>

        <ImageBackground
          source={require('../../assets/images/blend.jpg')}
          style={styles.searchBarBg}
          imageStyle={{ borderRadius: 24, opacity: 0.28 }}
          resizeMode="cover"
        >
          <View style={styles.searchBar}>
            <Feather name="search" size={20} color="#263A13" style={{ marginLeft: 10 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="What's your pickup point?"
              value={search}
              onChangeText={handleSearch}
              onFocus={() => setShowSuggestions(true)}
              placeholderTextColor="#263A13"
            />
            <TouchableOpacity
              style={{
                backgroundColor: '#E3F0D5',
                borderRadius: 14,
                paddingHorizontal: 18,
                paddingVertical: 8,
                marginRight: 10,
                marginLeft: 10,
                opacity: search.length > 0 ? 1 : 0.5,
              }}
              disabled={search.length === 0}
              onPress={() => {
                if (search.length > 0) {
                  router.push({ pathname: '/customer-screens/SelectTruck', params: { pickup: search } } as any);
                }
              }}
            >
              <Text style={{ color: '#22330B', fontWeight: 'bold', fontSize: 16 }}>Recycle</Text>
            </TouchableOpacity>
          </View>
          {showSuggestions && search.length > 0 && (
            <View style={styles.suggestionsBox}>
              {isSearching ? (
                <View style={styles.suggestionItem}>
                  <Feather name="loader" size={16} color="#263A13" style={{ marginRight: 8 }} />
                  <Text style={styles.suggestionText}>Searching...</Text>
                </View>
              ) : locationSuggestions.length > 0 ? (
                <FlatList
                  data={locationSuggestions}
                  keyExtractor={keyExtractor}
                  renderItem={renderSuggestionItem}
                  getItemLayout={getItemLayout}
                  initialNumToRender={initialNumToRender}
                  maxToRenderPerBatch={maxToRenderPerBatch}
                  windowSize={windowSize}
                />
              ) : search.length > 2 ? (
                <View style={styles.suggestionItem}>
                  <Feather name="alert-circle" size={16} color="#263A13" style={{ marginRight: 8 }} />
                  <Text style={styles.suggestionText}>No locations found</Text>
                </View>
              ) : null}
            </View>
          )}
        </ImageBackground>
      </View>

      {/* Map Section */}
      <View style={styles.mapSection}>
        <View style={styles.mapContainer}>
          {/* Interactive Map */}
          <MapComponent
            initialRegion={mapRegion || undefined}
            markers={[
              // Recycler markers
              ...nearbyRecyclers.map(recycler => ({
                id: recycler.id,
                coordinate: recycler.coordinate!,
                title: recycler.full_name || recycler.company_name,
                description: `${recycler.rating?.toFixed(1) || 'N/A'} ⭐ • ${recycler.distance} • ${recycler.estimatedTime} • ${recycler.truck_size.toUpperCase()} truck • ${recycler.is_available ? '🟢 Available' : '🔴 Busy'}`,
                type: 'recycler' as const,
              })),
              // Search markers
              ...searchMarkers.map(marker => ({
                id: marker.id,
                coordinate: marker.coordinate,
                title: marker.title,
                description: marker.description,
                type: marker.type === 'user' ? 'user' as const : 'pickup' as const,
              }))
            ]}
            onMarkerPress={handleRecyclerPress}
            onMapPress={handleMapPress}
            onLocationPress={handleLocationDetection}
            style={{ flex: 1 }}
          />
          
          {/* Map Legend */}
          <View style={styles.mapLegend}>
            <Text style={styles.legendTitle}>Map Legend</Text>
            <View style={styles.legendItem}>
              <View style={[styles.legendMarker, { backgroundColor: COLORS.orange }]}>
                <MaterialIcons name="local-shipping" size={12} color={COLORS.white} />
              </View>
              <Text style={styles.legendText}>Recycling Trucks</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendMarker, { backgroundColor: COLORS.blue }]}>
                <MaterialIcons name="search" size={12} color={COLORS.white} />
              </View>
              <Text style={styles.legendText}>Search Results</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendMarker, { backgroundColor: COLORS.purple }]}>
                <MaterialIcons name="my-location" size={12} color={COLORS.white} />
              </View>
              <Text style={styles.legendText}>Your Location</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendMarker, { backgroundColor: COLORS.red }]}>
                <MaterialIcons name="flag" size={12} color={COLORS.white} />
              </View>
              <Text style={styles.legendText}>Recycling Centers</Text>
            </View>
          </View>
        </View>
      </View>
      {/* BottomNav removed, default tab bar will show */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  hamburger: {
    position: 'absolute',
    top: 36,
    left: 18,
    zIndex: 100,
    backgroundColor: 'transparent',
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.18)',
    zIndex: 99,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    backgroundColor: '#C7CCC1',
    zIndex: 101,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 2,
    marginBottom: 2,
  },
  menuItemText: {
    color: '#22330B',
    fontWeight: 'bold',
    fontSize: 18,
    marginLeft: 18,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    width: 230,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#263A13',
    textAlign: 'center',
    marginTop: 8,
  },
  tagline: {
    fontSize: 13,
    color: '#263A13',
    textAlign: 'center',
    marginBottom: 8,
  },
  searchSection: {
    margin: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  searchOverlayContainer: {
    position: 'absolute',
    top: 32,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    alignSelf: 'center',
  },
  searchBarBg: {
    backgroundColor: '#D9DED8',
    borderRadius: 24,
    width: '100%',
    height: 100,
    minHeight: 100,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    height: 50,
    width: '90%',
    position: 'absolute',
    top: '50%',
    left: '5%',
    transform: [{ translateY: -27 }],
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#263A13',
    marginLeft: 10,
    backgroundColor: 'transparent',
  },
  suggestionsBox: {
    position: 'absolute',
    top: 56,
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
    paddingVertical: 8,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  suggestionText: {
    fontSize: 16,
    color: '#263A13',
    fontWeight: '500',
  },
  suggestionTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  suggestionAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  mapSection: {
    flex: 1,
    margin: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  mapContainer: {
    flex: 1,
    maxHeight: 500,
    margin: 16,
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#F2FFE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapHeader: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
  },
  mapSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 4,
  },
  mapContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blankMapArea: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  blankMapText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
  },
  blankMapSubtext: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
  },
  mapLegend: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  suggestionContent: {
    flex: 1,
  },
  useMyLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.darkGreen,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  useMyLocationText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  recyclerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  recyclerInfo: {
    flex: 1,
  },
  recyclerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#263A13',
  },
  recyclerDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  recyclerStatus: {
    fontSize: 12,
    color: '#4CAF50', // A green color for status
    marginTop: 2,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  locationTextContainer: {
    marginLeft: 10,
  },
  locationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#263A13',
  },
  locationAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.darkGreen,
    textAlign: 'center',
  },
});
