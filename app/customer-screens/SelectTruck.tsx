import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants';

// ===== MOCK DATA FOR SELECT TRUCK SCREEN =====
// This replaces the backend API calls with local mock data
// In a real app, this would come from a database or recycler service

// Mock available recyclers data matching the image design
const mockAvailableRecyclers = [
  {
    id: "recycler_001",
    name: "John Doe",
    phone: "+233241234568",
    rating: 4.8,
    completedPickups: 156,
    vehicleType: "Big Truck",
    rate: "GHS 1.20/kg",
    distance: "0.5 km",
    estimatedArrival: "15 min",
    isAvailable: true
  },
  {
    id: "recycler_002",
    name: "Jane Smith",
    phone: "+233241234569",
    rating: 4.6,
    completedPickups: 89,
    vehicleType: "Small Truck",
    rate: "GHS 1.15/kg",
    distance: "1.2 km",
    estimatedArrival: "25 min",
    isAvailable: true
  },
  {
    id: "recycler_003",
    name: "Mike Johnson",
    phone: "+233241234570",
    rating: 4.9,
    completedPickups: 320,
    vehicleType: "Big Truck",
    rate: "GHS 1.25/kg",
    distance: "0.8 km",
    estimatedArrival: "10 min",
    isAvailable: true
  }
];

// Mock pickup request data
const mockPickupRequest = {
  id: "req_001",
  customer_id: "user_001",
  waste_type: "Mixed Waste",
  weight: 8,
  pickup_address: "123 Main Street, Accra Central",
  special_instructions: "Please call before arrival",
  status: "pending",
  created_at: "2024-01-15T10:30:00Z"
};

export default function SelectTruck() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    requestId?: string;
    pickup?: string;
    wasteType?: string;
    weight?: string;
  }>();
  
  // Add missing state variables that were removed during refactoring
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Filter handler function
  const handleFilterPress = (filter: string) => {
    setSelectedFilter(filter);
  };

  // ===== LOCAL STATE MANAGEMENT =====
  // These state variables manage the UI state and data
  const [recyclers, setRecyclers] = useState<any[]>([]);
  const [filteredRecyclers, setFilteredRecyclers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecycler, setSelectedRecycler] = useState<any>(null);
  const [pickupRequest, setPickupRequest] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'distance' | 'rating' | 'rate'>('distance');

  // ===== INITIALIZATION EFFECT =====
  // This effect runs when the component first loads
  useEffect(() => {
    loadMockData();
  }, []);

  // ===== FILTER EFFECT =====
  // This effect runs when selectedFilter changes
  useEffect(() => {
    if (recyclers.length > 0) {
      if (selectedFilter === 'all') {
        setFilteredRecyclers(recyclers);
      } else {
        const filtered = recyclers.filter(recycler => 
          recycler.vehicleType === selectedFilter
        );
        setFilteredRecyclers(filtered);
      }
    }
  }, [selectedFilter, recyclers]);

  // ===== MOCK DATA LOADING FUNCTION =====
  // This replaces the backend API call to fetch available recyclers
  // It loads data from our mock data arrays
  const loadMockData = async () => {
    try {
      setIsLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Load mock recyclers data
      setRecyclers([...mockAvailableRecyclers]);
      setFilteredRecyclers([...mockAvailableRecyclers]);
      
      // Load mock pickup request data
      const request = {
        ...mockPickupRequest,
        pickup_address: params.pickup || mockPickupRequest.pickup_address,
        waste_type: params.wasteType || mockPickupRequest.waste_type,
        weight: parseFloat(params.weight || mockPickupRequest.weight.toString()),
        id: params.requestId || mockPickupRequest.id
      };
      
      setPickupRequest(request);
      console.log('SelectTruck: Mock data loaded successfully');
    } catch (error) {
      console.error('SelectTruck: Error loading mock data:', error);
      // Fallback to default mock data
      setRecyclers(mockAvailableRecyclers);
      setFilteredRecyclers(mockAvailableRecyclers);
      setPickupRequest(mockPickupRequest);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== FILTERING AND SORTING FUNCTIONS =====
  // These functions handle data filtering and sorting
  
  // Filter recyclers based on search query
  const filterRecyclers = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredRecyclers(recyclers);
      return;
    }
    
    const filtered = recyclers.filter(recycler =>
      recycler.name.toLowerCase().includes(query.toLowerCase()) ||
      recycler.vehicleType.toLowerCase().includes(query.toLowerCase()) ||
      recycler.specialties.some((specialty: string) => 
        specialty.toLowerCase().includes(query.toLowerCase())
      )
    );
    
    setFilteredRecyclers(filtered);
  };

  // Sort recyclers by different criteria
  const sortRecyclers = (criteria: 'distance' | 'rating' | 'rate') => {
    setSortBy(criteria);
    
    const sorted = [...filteredRecyclers].sort((a, b) => {
      switch (criteria) {
        case 'distance':
          return parseFloat(a.distance) - parseFloat(b.distance);
        case 'rating':
          return b.rating - a.rating;
        case 'rate':
          return parseFloat(a.rate.replace('₵', '')) - parseFloat(b.rate.replace('₵', ''));
        default:
          return 0;
      }
    });
    
    setFilteredRecyclers(sorted);
  };

  // ===== ACTION HANDLERS =====
  // These functions handle user actions
  
  // Select a recycler for pickup
  const handleSelectRecycler = (recycler: any) => {
    // Navigate directly to recycler profile details screen
    router.push({
      pathname: '/customer-screens/RecyclerProfileDetails',
      params: { 
        recyclerId: recycler.id,
        recyclerName: recycler.name,
        recyclerRating: recycler.rating.toString(),
        recyclerDistance: recycler.distance,
        vehicleType: recycler.vehicleType,
        rate: recycler.rate,
        requestId: pickupRequest?.id
      }
    });
  };

  // Call recycler
  const handleCallRecycler = (recycler: any) => {
    Alert.alert(
      'Call Recycler',
      `Call ${recycler.name} at ${recycler.phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => {
            // In a real app, this would use Linking to make a phone call
            console.log('Calling recycler:', recycler.phone);
            Alert.alert('Call Recycler', 'Phone call functionality would be implemented here.');
          }
        }
      ]
    );
  };

  // View recycler profile
  const handleViewProfile = (recycler: any) => {
    router.push({
      pathname: '/customer-screens/RecyclerProfileDetails',
      params: { recyclerId: recycler.id }
    });
  };

  // ===== UI RENDER FUNCTIONS =====
  // These functions render different parts of the UI
  
  // Render a single recycler item matching the image design
  const renderRecyclerItem = ({ item }: { item: any }) => (
    <View style={styles.recyclerCard}>
      <View style={styles.recyclerRow}>
        {/* Left side - Truck icon */}
        <View style={styles.truckIconContainer}>
          <Image
            source={
              item.vehicleType === 'Big Truck'
                ? require('../../assets/images/truck.png')
                : require('../../assets/images/small truck.png')
            }
            style={styles.truckIcon}
            resizeMode="contain"
          />
        </View>
        
        {/* Right side - Recycler details */}
        <View style={styles.recyclerDetails}>
          <Text style={styles.recyclerName}>{item.name}</Text>
          <Text style={styles.vehicleTypeText}>{item.vehicleType}</Text>
          <Text style={styles.rateText}>Rate: {item.rate}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>Rating: {item.rating}</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Text key={star} style={styles.starIcon}>
                  {star <= Math.floor(item.rating) ? '★' : '☆'}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </View>
      
      {/* Bottom section with price and select button */}
      <View style={styles.cardBottom}>
        <Text style={styles.priceText}>{item.rate}</Text>
        <TouchableOpacity 
          style={styles.selectButton}
          onPress={() => handleSelectRecycler(item)}
        >
          <Text style={styles.selectButtonText}>Select</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading available recyclers...</Text>
      </View>
    );
  }

  if (!pickupRequest) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load pickup request</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadMockData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
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


      </View>

      {/* Pickups Banner */}
      <View style={styles.pickupsBanner}>
        <TouchableOpacity style={styles.pickupsButton}>
          <Text style={styles.pickupsButtonText}>Pickups</Text>
        </TouchableOpacity>
      </View>



      {/* Scrollable Recyclers */}
      <FlatList
        data={filteredRecyclers}
        renderItem={renderRecyclerItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 32 }}
        ListEmptyComponent={() => (
          <View style={styles.noResultsContainer}>
            <Text style={styles.noResultsText}>🚛 No Recyclers Found</Text>
            <Text style={styles.noResultsSubtext}>
              {isLoading ? 'Searching for recyclers...' : 
               selectedFilter !== 'all' ? 
               `No ${selectedFilter.toLowerCase()}s available in this area` :
               'No recyclers are currently available in this area'}
            </Text>
            
            {!isLoading && (
              <>
                <Text style={styles.suggestionText}>
                  💡 What you can try:
                </Text>
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionItem}>• Try again in a few minutes</Text>
                  <Text style={styles.suggestionItem}>• Change your pickup location</Text>
                  {selectedFilter !== 'all' && (
                    <Text style={styles.suggestionItem}>• Try "All" filter for more options</Text>
                  )}
                  <Text style={styles.suggestionItem}>• Contact support if issue persists</Text>
                </View>
                
                <View style={styles.actionButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.tryAgainButton}
                    onPress={loadMockData}
                  >
                    <Text style={styles.tryAgainButtonText}>🔄 Try Again</Text>
                  </TouchableOpacity>
                  

                </View>
                
                {selectedFilter !== 'all' && (
                  <TouchableOpacity 
                    style={styles.showAllButton}
                    onPress={() => handleFilterPress('all')}
                  >
                    <Text style={styles.showAllButtonText}>Show All Recyclers</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}
      />
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

  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
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
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 20,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative', // Added for badge positioning
  },
  closestTruckCard: {
    borderWidth: 3,
    borderColor: COLORS.primary,
    borderRadius: 22,
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
    borderRadius: 10,
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
  ratingStars: {
    fontSize: 14,
    color: COLORS.primary,
  },
  truckActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
  },
  selectButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },

  noResultsContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 24,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  noResultsSubtext: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  suggestionsContainer: {
    alignSelf: 'stretch',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  suggestionItem: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 8,
    lineHeight: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    marginBottom: 16,
    gap: 12,
  },
  tryAgainButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  tryAgainButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  showAllButton: {
    backgroundColor: COLORS.lightGray,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  showAllButtonText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 14,
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
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    backgroundColor: COLORS.white,
    borderRadius: 10,
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
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 10,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  pickupsButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 10,
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
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 10,
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
  // New styles for recycler cards matching the image design
  recyclerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 12,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  recyclerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  truckIconContainer: {
    marginRight: 16,
  },
  truckIcon: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  recyclerDetails: {
    flex: 1,
  },
  recyclerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  vehicleTypeText: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  rateText: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  starsContainer: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  starIcon: {
    fontSize: 14,
    color: COLORS.primary,
    marginLeft: 2,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: COLORS.darkGreen,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.darkGreen,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
