import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { COLORS, DIMENSIONS } from '../../constants';
import { RecyclerProfile } from '../../constants/api';
import { apiService } from '../../services/apiService';
import { locationSearchService } from '../../services/locationSearchService';

interface RecyclerData {
  id: string;
  business_name?: string;
  vehicle_type?: string;
  rating: number;
  total_collections: number;
  is_available: boolean;
  service_areas?: string[];
  city?: string;
  state?: string;
  address?: string;
  profile_image?: string;
  distance?: number;
  eta?: string;
  rate?: string;
}

export default function SelectTruckScreen() {
  const params = useLocalSearchParams();
  const pickup = params.pickup as string;
  const latitude = params.latitude as string;
  const longitude = params.longitude as string;
  const requestId = params.requestId as string; // New parameter for rejected requests
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'Big Truck' | 'Small Truck'>('all');
  const [recyclers, setRecyclers] = useState<RecyclerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerLocation, setCustomerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isRetryRequest, setIsRetryRequest] = useState(false);

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate ETA based on distance and traffic conditions
  const calculateETA = (distance: number): string => {
    // More realistic ETA calculation considering:
    // - City traffic: 20-40 km/h average
    // - Distance-based time adjustments
    // - Traffic light delays
    
    let avgSpeed = 25; // km/h - conservative city speed
    
    // Adjust speed based on distance (longer distances might use highways)
    if (distance > 5) {
      avgSpeed = 35; // km/h for longer distances
    } else if (distance < 1) {
      avgSpeed = 15; // km/h for very short distances (more traffic lights)
    }
    
    // Add traffic delay factor (20% extra time for city conditions)
    const trafficDelay = 1.2;
    const timeInHours = (distance / avgSpeed) * trafficDelay;
    const timeInMinutes = Math.round(timeInHours * 60);
    
    if (timeInMinutes < 1) return 'Less than 1 min';
    if (timeInMinutes < 60) return `${timeInMinutes} mins`;
    
    const hours = Math.floor(timeInMinutes / 60);
    const minutes = timeInMinutes % 60;
    
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  // Get customer's current location from passed coordinates or pickup address
  const getCustomerLocation = async () => {
    try {
      // If coordinates are passed directly, use them
      if (latitude && longitude) {
        setCustomerLocation({
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        });
      } else if (pickup && pickup !== 'Unknown Location') {
        // Fallback: Try to get coordinates from the pickup address
        const location = await locationSearchService.searchLocations(pickup);
        if (location.length > 0) {
          setCustomerLocation(location[0].coordinate);
        }
      }
    } catch (error) {
      console.error('Error getting customer location:', error);
    }
  };

  // Fetch available recyclers
  const fetchRecyclers = async () => {
    try {
      setLoading(true);
      
      let recyclersData: RecyclerProfile[] = [];
      
      // Use the new API method that excludes rejected recyclers
      try {
        recyclersData = await apiService.getAvailableRecyclersExcludingRejected(pickup);
      } catch (error) {
        console.warn('Failed to fetch recyclers excluding rejected ones, falling back to all recyclers:', error);
        // Fallback to regular recycler fetch if the new method fails
        if (pickup && pickup !== 'Unknown Location') {
          try {
            recyclersData = await apiService.searchRecyclersByLocation(pickup);
          } catch (fallbackError) {
            console.warn('Location-based search failed, falling back to all recyclers:', fallbackError);
            recyclersData = await apiService.getRecyclers();
          }
        } else {
          recyclersData = await apiService.getRecyclers();
        }
      }
      
      // Filter only available recyclers
      const availableRecyclers = recyclersData.filter(recycler => recycler.is_available);
      
      // If we have customer location, calculate distances and ETA
      if (customerLocation) {
        const recyclersWithDistance = availableRecyclers.map((recycler, index) => {
          // Generate realistic recycler positions around the customer
          // In a real app, these would come from the recycler's actual location
          const angle = (index * 137.5) % 360; // Golden angle for better distribution
          const radius = 0.3 + (index % 5) * 0.4; // 0.3 to 2.3 km radius for more realistic city distances
          
          const recyclerLat = customerLocation.latitude + (radius * Math.cos(angle * Math.PI / 180)) / 111;
          const recyclerLon = customerLocation.longitude + (radius * Math.sin(angle * Math.PI / 180)) / (111 * Math.cos(customerLocation.latitude * Math.PI / 180));
          
          const distance = calculateDistance(
            customerLocation.latitude,
            customerLocation.longitude,
            recyclerLat,
            recyclerLon
          );
          
          const eta = calculateETA(distance);
          
          // Generate realistic rates based on distance and vehicle type
          let baseRate = 1.0;
          if (recycler.vehicle_type === 'Big Truck') {
            baseRate = 0.8; // Big trucks are more efficient, cheaper per kg
          } else if (recycler.vehicle_type === 'Small Truck') {
            baseRate = 1.2; // Small trucks are more expensive per kg
          }
          
          const distanceMultiplier = 1 + (distance * 0.08); // 8% increase per km
          const rate = baseRate * distanceMultiplier;
          
          return {
            ...recycler,
            distance: Math.round(distance * 10) / 10, // Round to 1 decimal place
            eta,
            rate: `GHS ${rate.toFixed(2)}/kg`
          };
        });
        
        // Sort by distance (closest first)
        recyclersWithDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        
        setRecyclers(recyclersWithDistance);
      } else {
        // If no location, just show recyclers without distance
        const recyclersWithMockData = availableRecyclers.map((recycler, index) => ({
          ...recycler,
          distance: undefined,
          eta: 'Unknown',
          rate: `GHS ${(1.0 + (index * 0.05)).toFixed(2)}/kg` // Slight variation based on index
        }));
        
        setRecyclers(recyclersWithMockData);
      }
    } catch (error) {
      console.error('Error fetching recyclers:', error);
      Alert.alert(
        'Error',
        'Failed to load recyclers. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCustomerLocation();
  }, [pickup, latitude, longitude]);

  useEffect(() => {
    if (customerLocation !== null) {
      fetchRecyclers();
    }
  }, [customerLocation]);

  // Check if this is a retry request (coming from rejection)
  useEffect(() => {
    if (requestId) {
      setIsRetryRequest(true);
    }
  }, [requestId]);

  const filteredRecyclers = recyclers.filter(recycler => {
    if (selectedFilter === 'all') return true;
    return recycler.vehicle_type === selectedFilter;
  });

  const handleFilterPress = (filter: 'all' | 'Big Truck' | 'Small Truck') => {
    setSelectedFilter(filter);
  };

  const handleTruckPress = (recycler: RecyclerData) => {
    const params: any = {
      recyclerId: recycler.id,
      pickup: pickup,
      distance: recycler.distance?.toString() || '',
      eta: recycler.eta || '',
      rate: recycler.rate || ''
    };

    // If this is a retry request, pass the requestId
    if (requestId) {
      params.requestId = requestId;
      params.isRetry = 'true';
    }

    router.push({
      pathname: '/customer-screens/RecyclerProfileDetails' as any,
      params: params
    });
  };

  const handleRefresh = () => {
    fetchRecyclers();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Finding available recyclers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header and Logo */}
      <View>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Image
              source={require('../../assets/images/logo landscape.png')}
              style={styles.headerLogo}
            />
          </View>
        </View>

        {/* Banner with Filter Buttons */}
        <View style={styles.bannerBg}>
          <Image
            source={require('../../assets/images/blend.jpg')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.filterContainerOverlay}>
            {['all', 'Big Truck', 'Small Truck'].map(filter => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  selectedFilter === filter && styles.filterButtonActive
                ]}
                onPress={() => handleFilterPress(filter as any)}
              >
                {filter !== 'all' && (
                  <Image
                    source={
                      filter === 'Big Truck'
                        ? require('../../assets/images/truck.png')
                        : require('../../assets/images/small truck.png')
                    }
                    style={styles.filterIcon}
                  />
                )}
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedFilter === filter && styles.filterButtonTextActive
                  ]}
                >
                  {filter === 'all' ? 'All' : filter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Pickup Point */}
        <View style={styles.pickupSection}>
          <Text style={styles.pickupLabel}>Pickup Point:</Text>
          <Text style={styles.pickupLocation}>{pickup}</Text>
          {customerLocation && (
            <Text style={styles.coordinatesText}>
              📍 {customerLocation.latitude.toFixed(6)}, {customerLocation.longitude.toFixed(6)}
            </Text>
          )}
          <TouchableOpacity 
            style={styles.changeLocationButton}
            onPress={() => router.back()}
          >
            <Text style={styles.changeLocationText}>📍 Change Location</Text>
          </TouchableOpacity>
        </View>

        {/* Results Summary */}
        <View style={styles.resultsSummary}>
          <View style={styles.resultsLeft}>
            <Text style={styles.resultsText}>
              {filteredRecyclers.length} recycler{filteredRecyclers.length !== 1 ? 's' : ''} available
            </Text>
            {customerLocation && (
              <Text style={styles.sortingInfo}>
                📍 Sorted by distance (closest first)
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Helpful Instructions */}
        {customerLocation && filteredRecyclers.length > 0 && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              💡 <Text style={styles.instructionsBold}>Tip:</Text> Choose the recycler closest to you for faster service and lower costs!
            </Text>
          </View>
        )}
      </View>

      {/* Pickups Banner */}
      <View style={styles.pickupsBanner}>
        <TouchableOpacity style={styles.pickupsButton}>
          <Text style={styles.pickupsButtonText}>Pickups</Text>
        </TouchableOpacity>
      </View>

      {/* Retry Request Banner */}
      {isRetryRequest && (
        <View style={styles.retryBanner}>
          <Text style={styles.retryBannerText}>
            🔄 Retry Request - Previous recycler excluded from options
          </Text>
          <Text style={styles.retryBannerSubtext}>
            Select a new recycler for your pickup request
          </Text>
        </View>
      )}

      {/* Scrollable Recyclers */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={{ paddingBottom: 32 }}>
        {filteredRecyclers.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>No recyclers available in this area</Text>
            <Text style={styles.noResultsSubtext}>Try changing your location or filters</Text>
          </View>
        ) : (
          filteredRecyclers.map((recycler, index) => (
            <View key={recycler.id} style={[
              styles.truckCard,
              ...(index === 0 && recycler.distance ? [styles.closestTruckCard] : [])
            ]}>
              {/* Closest Recycler Badge */}
              {index === 0 && recycler.distance && (
                <View style={styles.closestBadge}>
                  <Text style={styles.closestBadgeText}>🚀 Closest</Text>
                </View>
              )}
              
              <View style={styles.truckRow}>
                <Image 
                  source={
                    recycler.vehicle_type === 'Small Truck' 
                      ? require('../../assets/images/small truck.png')
                      : require('../../assets/images/truck.png')
                  } 
                  style={styles.truckImage} 
                />
                <View style={styles.truckDetails}>
                  <Text style={styles.truckName}>
                    {recycler.business_name || `Recycler ${index + 1}`}
                  </Text>
                  <Text style={styles.truckType}>
                    {recycler.vehicle_type || 'Recycling Truck'}
                  </Text>
                  
                  {/* Distance and ETA - Moved to top for better visibility */}
                  {recycler.distance && (
                    <View style={styles.distanceContainer}>
                      <View style={styles.distanceRow}>
                        <Text style={styles.distanceLabel}>📍 Distance:</Text>
                        <Text style={styles.distanceValue}>
                          {recycler.distance} km
                        </Text>
                      </View>
                      <View style={styles.etaRow}>
                        <Text style={styles.etaLabel}>⏱️ ETA:</Text>
                        <Text style={styles.etaValue}>
                          {recycler.eta}
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  <Text style={styles.truckCapacity}>Rate: {recycler.rate}</Text>
                  
                  <View style={styles.ratingContainer}>
                    <Text style={styles.ratingText}>Rating: {recycler.rating.toFixed(1)}</Text>
                    <Text style={styles.ratingStars}>
                      {'★'.repeat(Math.floor(recycler.rating))}
                    </Text>
                  </View>
                  
                  <Text style={styles.collectionsText}>
                    📦 {recycler.total_collections} past collections
                  </Text>
                </View>
              </View>
              
              <View style={styles.truckActions}>
                <View style={styles.priceContainer}>
                  <Text style={styles.priceText}>{recycler.rate}</Text>
                  {recycler.distance && (
                    <Text style={styles.distanceSmall}>{recycler.distance} km</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => handleTruckPress(recycler)}
                >
                  <Text style={styles.selectButtonText}>Select</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollArea: {
    flex: 1,
  },
  header: {
    backgroundColor: '#E3F0D5',
    paddingTop: 5, // Reduced even further to push header up more
    marginTop: 35, // Increased margin top even more
    marginBottom: 35, // Increased margin bottom even more
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 32, // Increased from 24
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', // Center the logo horizontally
    width: '100%', // Take full width for proper centering
  },
  headerLogo: {
    width: 200, // Increased to 200 as requested
    height: 80, // Set to 80 as requested
    resizeMode: 'contain',
  },
  bannerBg: {
    position: 'relative',
    height: 120,
    marginBottom: 10,
    marginTop: -10, // Reduced further to prevent covering the logo
    borderRadius: 15, // Added rounded corners
    overflow: 'hidden', // Ensures the image respects the rounded corners
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  filterContainerOverlay: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    transform: [{ translateY: -20 }],
  },
  pickupText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: DIMENSIONS.borderRadius,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontWeight: 'bold',
    color: COLORS.gray,
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  filterIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    resizeMode: 'contain',
  },
  truckCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: DIMENSIONS.padding,
    marginBottom: 12,
    padding: 16,
    borderRadius: DIMENSIONS.cardBorderRadius,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative', // Added for badge positioning
  },
  closestTruckCard: {
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderRadius: DIMENSIONS.cardBorderRadius + 2,
    marginTop: 10, // Add some space above the closest truck
  },
  closestBadge: {
    position: 'absolute',
    top: -10, // Adjust as needed to position it correctly
    left: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    zIndex: 1,
  },
  closestBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  truckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  truckImage: {
    width: 100,
    height: 100,
    borderRadius: DIMENSIONS.borderRadius,
    marginRight: 12,
  },
  truckDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  truckName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  truckType: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  truckCapacity: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.gray,
    marginRight: 8,
  },
  ratingStars: {
    fontSize: 14,
    color: COLORS.primary,
  },
  truckActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  selectButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: DIMENSIONS.borderRadius,
  },
  selectButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  pickupSection: {
    backgroundColor: COLORS.white,
    marginHorizontal: DIMENSIONS.padding,
    marginBottom: 12,
    padding: 16,
    borderRadius: DIMENSIONS.cardBorderRadius,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  pickupLabel: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 4,
  },
  pickupLocation: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  changeLocationButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: DIMENSIONS.borderRadius,
  },
  changeLocationText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  coordinatesText: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  resultsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: DIMENSIONS.padding,
    marginBottom: 12,
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.borderRadius,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  resultsLeft: {
    flex: 1,
  },
  resultsText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  sortingInfo: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: DIMENSIONS.borderRadius,
  },
  refreshButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  noResultsContainer: {
    marginHorizontal: DIMENSIONS.padding,
    marginTop: 20,
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.borderRadius,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  distanceLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginRight: 5,
  },
  distanceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  etaLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginRight: 5,
  },
  etaValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  distanceSmall: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 5,
  },
  collectionsText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.gray,
  },
  instructionsContainer: {
    marginHorizontal: DIMENSIONS.padding,
    marginBottom: 12,
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.borderRadius,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  instructionsText: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 20,
  },
  instructionsBold: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  pickupsBanner: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: DIMENSIONS.padding,
    marginBottom: 12,
    borderRadius: DIMENSIONS.borderRadius,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  pickupsButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: DIMENSIONS.borderRadius,
  },
  pickupsButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  retryBanner: {
    backgroundColor: COLORS.lightGray,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: DIMENSIONS.padding,
    marginBottom: 12,
    borderRadius: DIMENSIONS.borderRadius,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  retryBannerText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 5,
  },
  retryBannerSubtext: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
});
