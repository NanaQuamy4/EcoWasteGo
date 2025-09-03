import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, ImageBackground, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import DrawerMenu from '../../components/DrawerMenu';
import MapComponent from '../../components/MapComponent';
import { COLORS } from '../../constants';
import { useNotificationCount } from '../../hooks/useNotificationCount';
// Mock user data (replacing useAuth)

// ===== MOCK DATA FOR CUSTOMER HOME SCREEN =====
// This replaces the backend API calls with local mock data
// In a real app, this would come from a database or location service

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
    completedPickups: 150,
    estimatedTime: '15 mins'
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
    completedPickups: 89,
    estimatedTime: '25 mins'
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
    completedPickups: 320,
    estimatedTime: '10 mins'
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
    completedPickups: 210,
    estimatedTime: '20 mins'
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
    completedPickups: 95,
    estimatedTime: '8 mins'
  },
];

// Mock location suggestions for search
const mockLocationSuggestions = [
  'Gold Hostel, komfo anokye',
  'Atonsu unity oil',
  'Kumasi Central Market',
  'KNUST Campus',
  'Adum Business District',
  'Kejetia Market',
  'Manhyia Palace',
  'Kumasi Airport'
];

// Mock user stats and recent activity
const mockUserStats = {
  totalPickups: 12,
  totalPoints: 250,
  currentLevel: 'Bronze',
  nextLevel: 'Silver',
  pointsToNextLevel: 50,
  monthlySavings: '₵180',
  environmentalImpact: '24 kg CO2 saved'
};

const SUGGESTIONS = [
  'Gold Hostel, komfo anokye',
  'Atonsu unity oil',
];

export default function HomeScreen() {
  // ===== LOCAL STATE MANAGEMENT =====
  // These state variables manage the UI state and data
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Use real notification count
  const { notificationCount } = useNotificationCount();
  const [nearbyRecyclers, setNearbyRecyclers] = useState<any[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const user = { id: "user_001", username: "User", email: "user@example.com", phone: "+233 24 123 4567", role: "customer", verification_status: "verified", created_at: "2024-01-15T10:30:00Z", profile_image: null, company_name: "Green Team Recycling" };
  const router = useRouter();

  // ===== INITIALIZATION EFFECT =====
  // This effect runs when the component first loads
  useEffect(() => {
    loadMockData();
    getCurrentLocation();
  }, []);

  // ===== MOCK DATA LOADING FUNCTION =====
  // This replaces the backend API call to fetch nearby recyclers
  // It loads data from our mock data arrays
  const loadMockData = async () => {
    try {
      console.log('HomeScreen: Loading mock data...');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Load mock recyclers
      setNearbyRecyclers([...mockRecyclers]);
      
      // Load mock location suggestions
      setLocationSuggestions([...mockLocationSuggestions]);
      
      console.log('HomeScreen: Mock data loaded successfully');
    } catch (error) {
      console.error('HomeScreen: Error loading mock data:', error);
      // Fallback to default mock data
      setNearbyRecyclers(mockRecyclers);
      setLocationSuggestions(mockLocationSuggestions);
    }
  };

  // ===== LOCATION HANDLERS =====
  // These functions handle location-related functionality
  
  // Get current user location
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to find nearby recyclers.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
      console.log('HomeScreen: Current location obtained:', location);
    } catch (error) {
      console.error('HomeScreen: Error getting location:', error);
      Alert.alert('Location Error', 'Unable to get your current location.');
    }
  };

  // Handle location search
  const handleLocationSearch = (searchText: string) => {
    setSearch(searchText);
    
    if (searchText.trim() === '') {
      setShowSuggestions(false);
      setLocationSuggestions([]);
      return;
    }

    // Filter mock location suggestions based on search text
    const filteredSuggestions = mockLocationSuggestions.filter(suggestion =>
      suggestion.toLowerCase().includes(searchText.toLowerCase())
    );
    
    setLocationSuggestions(filteredSuggestions);
    setShowSuggestions(filteredSuggestions.length > 0);
  };

  // Handle location selection
  const handleLocationSelect = (suggestion: string) => {
    setSearch(suggestion);
    setShowSuggestions(false);
    setSelectedLocation({ name: suggestion, coordinate: userLocation?.coords });
    
    // In a real app, you would geocode the address to get coordinates
    console.log('HomeScreen: Location selected:', suggestion);
  };

  // ===== RECYCLER INTERACTION HANDLERS =====
  // These functions handle interactions with recyclers
  
  // View recycler details
  const handleRecyclerPress = (recycler: any) => {
    console.log('HomeScreen: Recycler pressed:', recycler);
    
    // Navigate to recycler details screen
    router.push({
      pathname: '/customer-screens/RecyclerProfileDetails',
      params: { recyclerId: recycler.id }
    });
  };

  // Request pickup from recycler
  const handleRequestPickup = (recycler: any) => {
    console.log('HomeScreen: Requesting pickup from:', recycler);
    
    // Navigate to pickup request screen
    router.push({
      pathname: '/customer-screens/SelectTruck',
      params: { 
        recyclerId: recycler.id,
        recyclerName: recycler.name,
        recyclerRating: recycler.rating.toString(),
        recyclerDistance: recycler.distance
      }
    });
  };

  // ===== UI RENDER FUNCTIONS =====
  // These functions render different parts of the UI
  
  // Render recycler item
  const renderRecyclerItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.recyclerCard}
      onPress={() => handleRecyclerPress(item)}
    >
      <View style={styles.recyclerHeader}>
        <View style={styles.recyclerInfo}>
          <Text style={styles.recyclerName}>{item.name}</Text>
          <Text style={styles.recyclerType}>{item.truckType}</Text>
        </View>
        <View style={styles.recyclerStatus}>
          <View style={[styles.statusDot, { backgroundColor: item.status === 'Available' ? COLORS.green : COLORS.orange }]} />
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <View style={styles.recyclerDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="star" size={16} color={COLORS.orange} />
          <Text style={styles.detailText}>{item.rating} • {item.completedPickups} pickups</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="location-on" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>{item.distance} • {item.estimatedTime}</Text>
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.requestButton}
        onPress={() => handleRequestPickup(item)}
      >
        <Text style={styles.requestButtonText}>Request Pickup</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Render location suggestion item
  const renderLocationSuggestion = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleLocationSelect(item)}
    >
      <MaterialIcons name="location-on" size={20} color={COLORS.gray} />
      <Text style={styles.suggestionText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeader
        onMenuPress={() => setDrawerOpen(true)}
        onNotificationPress={() => router.push('/customer-screens/CustomerNotificationScreen' as any)}
        notificationCount={notificationCount}
      />
      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      
      {/* Use My Location Button */}
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <TouchableOpacity
          style={styles.useLocationButton}
          onPress={getCurrentLocation}
        >
          <MaterialIcons name="my-location" size={20} color={COLORS.white} style={{ marginRight: 8 }} />
          <Text style={styles.useLocationText}>Use My Location</Text>
        </TouchableOpacity>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <ImageBackground
          source={require('../../assets/images/blend.jpg')}
          style={styles.searchBarBg}
          imageStyle={{ borderRadius: 24, opacity: 0.28 }}
          resizeMode="cover"
        >
          <View style={styles.searchBar}>
            <Feather name="search" size={20} color="#263A13" style={{ marginLeft: 10 }} />
            <TextInput
              style={[
                styles.searchInput,
                selectedLocation && selectedLocation.id === 'map-selected' && styles.searchInputMapSelected
              ]}
              placeholder="What's your pickup point?"
              value={search}
              onChangeText={handleLocationSearch}
              onFocus={() => setShowSuggestions(true)}
              placeholderTextColor="#263A13"
            />
            {selectedLocation && selectedLocation.id === 'map-selected' && (
              <View style={styles.mapSelectedIndicator}>
                <MaterialIcons name="my-location" size={16} color={COLORS.primary} />
                <Text style={styles.mapSelectedText}>Map Selected</Text>
                <TouchableOpacity
                  style={styles.clearSelectionButton}
                  onPress={() => {
                    setSelectedLocation(null);
                    setSearch('');
                    setShowSuggestions(false);
                  }}
                >
                  <MaterialIcons name="close" size={14} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            )}
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
                  // Prepare parameters for SelectTruck screen
                  const params: any = { pickup: search };
                  
                  // Add coordinates if we have a selected location with coordinates
                  if (selectedLocation && selectedLocation.coordinate) {
                    params.latitude = selectedLocation.coordinate.latitude.toString();
                    params.longitude = selectedLocation.coordinate.longitude.toString();
                    console.log('Navigating to SelectTruck with location:', {
                      pickup: search,
                      latitude: selectedLocation.coordinate.latitude,
                      longitude: selectedLocation.coordinate.longitude
                    });
                  } else if (userLocation) {
                    // Fallback to user's current location if no specific location selected
                    params.latitude = userLocation.coords.latitude.toString();
                    params.longitude = userLocation.coords.longitude.toString();
                    console.log('Navigating to SelectTruck with user location:', {
                      pickup: search,
                      latitude: userLocation.coords.latitude,
                      longitude: userLocation.coords.longitude
                    });
                  } else {
                    console.log('Navigating to SelectTruck without coordinates:', { pickup: search });
                  }
                  
                  router.push({ 
                    pathname: '/customer-screens/SelectTruck', 
                    params: params 
                  } as any);
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
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={renderLocationSuggestion}
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
              })),
              // Show selected location marker if exists
              ...(selectedLocation && selectedLocation.coordinate ? [{
                id: 'selected-location',
                coordinate: selectedLocation.coordinate,
                title: 'Selected Location',
                description: 'Your pickup point',
                type: 'pickup' as const,
              }] : [])
            ]}
            onMarkerPress={handleRecyclerPress}
            onMapPress={() => {
              // This onMapPress is for the map component itself, not for location selection
              // If you want to select a location on map press, you'd call handleMapLocationSelect
            }}
            style={{ flex: 1 }}
          />
          
          {/* Map Instructions */}
          <View style={styles.mapInstructions}>
            <Text style={styles.mapInstructionsText}>
              💡 Tap anywhere on the map to select your pickup location
            </Text>
          </View>
          
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
            
            {/* Refresh Button */}
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={loadMockData}
            >
              <MaterialIcons name="refresh" size={16} color={COLORS.darkGreen} />
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  searchSection: {
    margin: 16,
    marginTop: 20,
    marginBottom: 8,
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
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.lightGreen,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  refreshText: {
    marginLeft: 6,
    fontSize: 12,
    color: COLORS.darkGreen,
    fontWeight: '600',
  },
  recyclerCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  recyclerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recyclerInfo: {
    flex: 1,
  },
  recyclerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 2,
  },
  recyclerType: {
    fontSize: 14,
    color: COLORS.gray,
  },
  recyclerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.darkGreen,
  },
  recyclerDetails: {
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 5,
  },
  requestButton: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  useLocationButton: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  useLocationText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  searchInputMapSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: '#f0f8ff',
  },
  mapSelectedIndicator: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -8 }],
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  mapSelectedText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: 4,
  },
  mapInstructions: {
    position: 'absolute',
    bottom: 20,
    left: 20,
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
  mapInstructionsText: {
    fontSize: 14,
    color: COLORS.darkGreen,
    textAlign: 'center',
    fontWeight: '600',
  },
  clearSelectionButton: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
});
