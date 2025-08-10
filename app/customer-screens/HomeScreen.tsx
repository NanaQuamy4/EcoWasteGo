import { Feather, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, ImageBackground, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import DrawerMenu from '../../components/DrawerMenu';
import MapComponent from '../../components/MapComponent';
import { COLORS } from '../../constants';
import { useAuth } from '../../contexts/AuthContext';
import { locationSearchService, LocationSuggestion } from '../../services/locationSearchService';

const SUGGESTIONS = [
  'Gold Hostel, komfo anokye',
  'Atonsu unity oil',
];

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [nearbyRecyclers, setNearbyRecyclers] = useState<any[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

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

  useEffect(() => {
    setNearbyRecyclers(mockRecyclers);
    console.log('HomeScreen: Setting up recyclers', mockRecyclers);
    console.log('HomeScreen: Recyclers count:', mockRecyclers.length);
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation(location);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const handleSearchChange = async (text: string) => {
    setSearch(text);
    setShowSuggestions(true);
    
    if (text.length > 2) {
      setIsSearching(true);
      try {
        const suggestions = await locationSearchService.searchLocations(
          text,
          userLocation ? {
            latitude: userLocation.coords.latitude,
            longitude: userLocation.coords.longitude,
          } : undefined
        );
        setLocationSuggestions(suggestions);
      } catch (error) {
        console.error('Search error:', error);
        setLocationSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setLocationSuggestions([]);
    }
  };

  const filteredSuggestions = SUGGESTIONS.filter(s =>
    s.toLowerCase().includes(search.toLowerCase())
  );

  const handleSuggestionPress = (suggestion: LocationSuggestion) => {
    setSearch(suggestion.name);
    setSelectedLocation(suggestion);
    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const handleMapLocationSelect = async (coordinate: { latitude: number; longitude: number }) => {
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
  };

  const handleMapPress = (coordinate: { latitude: number; longitude: number }) => {
    handleMapLocationSelect(coordinate);
  };

  const handleRecyclerPress = (recyclerId: string) => {
    const recycler = nearbyRecyclers.find(r => r.id === recyclerId);
    if (recycler) {
      Alert.alert(
        recycler.name,
        `🚛 ${recycler.truckType}\n⭐ Rating: ${recycler.rating}\n📍 Distance: ${recycler.distance}\n📊 Status: ${recycler.status}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Request Pickup', onPress: () => {
            router.push({
              pathname: '/customer-screens/CallRecyclerScreen',
              params: { recyclerName: recycler.name }
            } as any);
          }},
          { text: 'Track Truck', onPress: () => {
            // Navigate to tracking screen
            router.push({
              pathname: '/customer-screens/TrackingScreen',
              params: { recyclerId: recycler.id }
            } as any);
          }}
        ]
      );
    }
  };

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
              onChangeText={handleSearchChange}
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
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSuggestionPress(item)}>
                      <Feather name="map-pin" size={16} color="#263A13" style={{ marginRight: 8 }} />
                      <View style={styles.suggestionContent}>
                        <Text style={styles.suggestionText}>{item.name}</Text>
                        <Text style={styles.suggestionAddress}>{item.address}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
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
  suggestionContent: {
    flex: 1,
  },
  suggestionAddress: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
});
