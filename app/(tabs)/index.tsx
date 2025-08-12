import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, ImageBackground, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import DrawerMenu from '../../components/DrawerMenu';
import MapComponent from '../../components/MapComponent';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/apiService';
import { locationSearchService, LocationSuggestion } from '../../services/locationSearchService';

const SUGGESTIONS = [
  'Gold Hostel, komfo anokye',
  'Atonsu unity oil',
];

// Memoized suggestion item component
const SuggestionItem = React.memo(({ item, onPress }: { item: string; onPress: (text: string) => void }) => (
  <TouchableOpacity style={styles.suggestionItem} onPress={() => onPress(item)}>
    <Text style={styles.suggestionText}>{item}</Text>
  </TouchableOpacity>
));
SuggestionItem.displayName = 'SuggestionItem';

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
  const [nearbyRecyclers, setNearbyRecyclers] = useState<any[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  // Memoized filtered suggestions
  const filteredSuggestions = useMemo(() => {
    if (!search.trim()) return SUGGESTIONS;
    return SUGGESTIONS.filter(suggestion => 
      suggestion.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  // Memoized search handler
  const handleSearch = useCallback((text: string) => {
    setSearch(text);
    setShowSuggestions(text.length > 0);
    if (text.length > 0) {
      handleLocationSearch(text);
    } else {
      setLocationSuggestions([]);
    }
  }, []);

  // Memoized location search handler
  const handleLocationSearch = useCallback(async (query: string) => {
    if (query.length < 3) return;
    
    setIsSearching(true);
    try {
      const suggestions = await locationSearchService.searchLocations(query);
      setLocationSuggestions(suggestions);
    } catch (error) {
      console.error('Location search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Memoized suggestion selection handler
  const handleSuggestionSelect = useCallback((text: string) => {
    setSearch(text);
    setShowSuggestions(false);
    setLocationSuggestions([]);
  }, []);

  // Memoized location selection handler
  const handleLocationSelect = useCallback(async (suggestion: LocationSuggestion) => {
    setSelectedLocation(suggestion);
    setSearch(suggestion.address);
    setShowSuggestions(false);
    setLocationSuggestions([]);
    
          // Fetch nearby recyclers for the selected location
      try {
        const recyclers = await apiService.getRecyclers();
        setNearbyRecyclers(recyclers);
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
      const address = await locationSearchService.reverseGeocode(coordinate);
      const locationSuggestion: LocationSuggestion = {
        id: 'map-selected',
        name: address,
        address: address,
        coordinate: coordinate,
        type: 'geocode',
      };
      setSelectedLocation(locationSuggestion);
      setSearch(address);
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
        recycler.name,
        `🚛 ${recycler.truckType}\n⭐ Rating: ${recycler.rating}\n📍 Distance: ${recycler.distance}\n📊 Status: ${recycler.status}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Request Pickup', onPress: () => {
            router.push({
              pathname: '/customer-screens/CallRecyclerScreen' as any,
              params: { recyclerName: recycler.name }
            });
          }},
          { text: 'Track Truck', onPress: () => {
            router.push({
              pathname: '/customer-screens/TrackingScreen' as any,
              params: { recyclerId: recycler.id }
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
        const address = await locationSearchService.reverseGeocode({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (address) {
          setSearch(address);
          setSelectedLocation({
            id: 'current-location',
            name: address,
            address: address,
            coordinate: {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
            type: 'geocode',
          });
          
          const accuracy = location.coords.accuracy;
          let accuracyMessage = '';
          if (accuracy && accuracy <= 10) {
            accuracyMessage = 'High accuracy';
          } else if (accuracy && accuracy <= 50) {
            accuracyMessage = 'Good accuracy';
          } else {
            accuracyMessage = 'Low accuracy';
          }
          
          Alert.alert(
            'Location Detected',
            `${address}\n\nAccuracy: ${accuracyMessage}\nLatitude: ${location.coords.latitude.toFixed(4)}\nLongitude: ${location.coords.longitude.toFixed(4)}`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Use This Location', onPress: () => {
                                 // Fetch nearby recyclers for current location
                 apiService.getRecyclers().then(setNearbyRecyclers).catch(console.error);
              }}
            ]
          );
        }
      }
    } catch (error) {
      console.error('Location detection error:', error);
      Alert.alert('Error', 'Failed to detect your location. Please try again.');
    } finally {
      setIsDetectingLocation(false);
    }
  }, [getCurrentLocation]);

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
  const renderSuggestionItem = useCallback(({ item }: { item: string }) => (
    <SuggestionItem item={item} onPress={handleSuggestionSelect} />
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

  const renderRecyclerItem = useCallback(({ item }: { item: any }) => (
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

  // Mock nearby recyclers data with recycling trucks and facilities (around Ghana)
  const mockRecyclers = [
    {
      id: '1',
      name: 'Green Waste Solutions Truck',
      coordinate: { latitude: 6.6734, longitude: -1.5714 }, // Kumasi area
      rating: 4.5,
      distance: '0.5 km',
      type: 'recycler',
      status: 'Available',
      truckType: 'Recycling Truck',
    },
    {
      id: '2',
      name: 'Eco Collectors Mobile Unit',
      coordinate: { latitude: 6.6834, longitude: -1.5814 }, // Nearby Kumasi
      rating: 4.2,
      distance: '1.2 km',
      type: 'recycler',
      status: 'On Route',
      truckType: 'Mobile Collection Unit',
    },
    {
      id: '3',
      name: 'Recycle Pro Facility',
      coordinate: { latitude: 6.6634, longitude: -1.5614 }, // Kumasi area
      rating: 4.8,
      distance: '0.8 km',
      type: 'destination',
      status: 'Open',
      truckType: 'Recycling Center',
    },
    {
      id: '4',
      name: 'Waste Management Truck',
      coordinate: { latitude: 6.6934, longitude: -1.5914 }, // Nearby Kumasi
      rating: 4.6,
      distance: '1.5 km',
      type: 'recycler',
      status: 'Available',
      truckType: 'Waste Collection Truck',
    },
    {
      id: '5',
      name: 'EcoWaste Mobile Unit',
      coordinate: { latitude: 6.6534, longitude: -1.5514 }, // Kumasi area
      rating: 4.3,
      distance: '0.3 km',
      type: 'recycler',
      status: 'Nearby',
      truckType: 'Mobile Recycling Unit',
    },
  ];

  // Load available recyclers from backend
  const loadAvailableRecyclers = async () => {
    try {
      const recyclers = await apiService.getRecyclers();
      // Filter only available recyclers
      const availableRecyclers = recyclers.filter(recycler => recycler.is_available);
      
      // Transform to match the expected format
      const transformedRecyclers = availableRecyclers.map((recycler, index) => ({
        id: recycler.id,
        name: recycler.business_name || `Recycler ${index + 1}`,
        coordinate: { 
          latitude: 6.6734 + (Math.random() - 0.5) * 0.01, // Mock coordinates for now
          longitude: -1.5714 + (Math.random() - 0.5) * 0.01 
        },
        rating: recycler.rating || 4.0,
        distance: `${(Math.random() * 2 + 0.3).toFixed(1)} km`,
        type: 'recycler' as const,
        status: 'Available',
        truckType: recycler.vehicle_type || 'Recycling Truck',
      }));
      
      setNearbyRecyclers(transformedRecyclers);
    } catch (error) {
      console.error('Error loading recyclers:', error);
      // Fallback to mock data if API fails
      setNearbyRecyclers(mockRecyclers);
    }
  };

  useEffect(() => {
    // Try to load real recycler data first, fallback to mock data
    loadAvailableRecyclers();
    console.log('HomeScreen: Setting up recyclers');
    getCurrentLocation();
  }, []);

  return (
    <View style={styles.container}>
      <AppHeader
        onMenuPress={() => setDrawerOpen(true)}
        onNotificationPress={() => router.push('/customer-screens/CustomerNotificationScreen' as any)}
        notificationCount={3}
      />
      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} user={{
        name: user?.username || 'User',
        email: user?.email,
        phone: user?.phone,
        type: user?.role === 'recycler' ? 'recycler' : 'user',
        status: user?.role === 'recycler' ? 'recycler' : 'user'
      }} />
      
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
                  renderItem={renderLocationItem}
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
            markers={[
              // Test marker to ensure markers are working
              {
                id: 'test-marker',
                coordinate: { latitude: 6.6734, longitude: -1.5714 },
                title: 'Test Truck',
                description: 'Test marker to verify visibility',
                type: 'recycler' as const,
              },
              ...nearbyRecyclers.map(recycler => ({
                id: recycler.id,
                coordinate: recycler.coordinate,
                title: recycler.name,
                description: `${recycler.rating} ⭐ • ${recycler.distance} • ${recycler.status}`,
                type: recycler.type as 'recycler' | 'destination',
              }))
            ]}
            onMarkerPress={handleRecyclerPress}
            onMapPress={handleMapPress}
            style={{ flex: 1 }}
          />
          
          {/* Map Legend */}
          <View style={styles.mapLegend}>
            <Text style={styles.legendTitle}>Recycling Services</Text>
            <View style={styles.legendItem}>
              <View style={[styles.legendMarker, { backgroundColor: COLORS.orange }]}>
                <MaterialIcons name="local-shipping" size={12} color={COLORS.white} />
              </View>
              <Text style={styles.legendText}>Recycling Trucks</Text>
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
  suggestionAddress: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
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
});
