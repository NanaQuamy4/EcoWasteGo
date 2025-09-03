import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants';
import { useOnlineRecyclers } from '../../hooks/useRecyclerOnlineStatus';
import { PickupRequestStatus, validateAndUpdateStatus } from '../../lib/pickupRequestStatus';
import { supabase } from '../../lib/supabase';

// ===== INTERFACES =====
interface Recycler {
  id: string;
  fullName: string;
  phone: string;
  truckSize: 'small' | 'big';
  rating: number;
  isAvailable: boolean;
  isOnline: boolean;
  lastSeenAt: string;
  heartbeatAt: string;
  status: 'Active' | 'Online' | 'Offline';
  // Computed fields
  distance?: string;
  estimatedArrival?: string;
  rate?: string;
  completedPickups?: number;
  pendingRequestsCount?: number;
}

interface PickupRequest {
  id: string;
  customer_id: string;
  recycler_id?: string;
  pickup_address: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  waste_type: string;
  waste_quantity: number;
  estimated_weight: number;
  status: string;
  preferred_pickup_date?: string;
  preferred_pickup_time?: string;
  estimated_price?: number;
  final_price?: number;
  payment_status?: string;
  pickup_started_at?: string;
  pickup_completed_at?: string;
  customer_rating?: number;
  customer_feedback?: string;
  recycler_notes?: string;
  created_at: string;
  updated_at?: string;
}

export default function SelectTruck() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    requestId?: string;
    pickup?: string;
    wasteType?: string;
    weight?: string;
    latitude?: string;
    longitude?: string;
    wasteQuantity?: string;
  }>();
  
  // ===== REAL-TIME DATA HOOKS =====
  const { recyclers: onlineRecyclers, loading: recyclersLoading, error: recyclersError } = useOnlineRecyclers();
  
  // ===== AVAILABLE RECYCLERS (EXCLUDES BUSY ONES) =====
  const [availableRecyclers, setAvailableRecyclers] = useState<Recycler[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(true);
  
  // ===== LOCAL STATE MANAGEMENT =====
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [pickupRequest, setPickupRequest] = useState<PickupRequest | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===== HELPER FUNCTIONS =====
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  const calculateETA = useCallback((distance: number): number => {
    // Assume average speed of 30 km/h in city traffic
    return Math.round((distance / 30) * 60); // Convert to minutes
  }, []);

  const calculatePrice = useCallback((truckSize: string, weight: number, distance: number): number => {
    // Base rate per kg
    const baseRate = truckSize === 'big' ? 1.25 : 1.15;
    
    // Distance multiplier (higher for longer distances)
    const distanceMultiplier = distance > 5 ? 1.2 : distance > 2 ? 1.1 : 1.0;
    
    // Calculate total price
    const totalPrice = (baseRate * weight * distanceMultiplier);
    
    return Math.round(totalPrice * 100) / 100; // Round to 2 decimal places
  }, []);

  // ===== FETCH AVAILABLE RECYCLERS =====
  const fetchAvailableRecyclers = useCallback(async () => {
    try {
      setLoadingAvailable(true);
      
      // Use the new function that excludes busy recyclers
      const { data, error } = await supabase.rpc('get_available_recyclers_for_requests');
      
      if (error) {
        console.error('Error fetching available recyclers:', error);
        // Fallback to regular online recyclers if the function fails
        const fallbackRecyclers: Recycler[] = onlineRecyclers.map(recycler => ({
          ...recycler,
          truckSize: recycler.truckSize as 'small' | 'big',
          fullName: recycler.fullName,
          phone: recycler.phone,
          rating: recycler.rating,
          isAvailable: recycler.isAvailable,
          isOnline: recycler.isOnline,
          lastSeenAt: recycler.lastSeenAt,
          heartbeatAt: recycler.heartbeatAt,
          status: recycler.status,
          pendingRequestsCount: 0
        }));
        setAvailableRecyclers(fallbackRecyclers);
        return;
      }
      
      // Transform the data to match our Recycler interface
      const transformedData: Recycler[] = (data || []).map((recycler: any) => ({
        id: recycler.id,
        fullName: recycler.full_name,
        phone: recycler.phone,
        truckSize: recycler.truck_size as 'small' | 'big',
        rating: recycler.rating,
        isAvailable: recycler.is_available,
        isOnline: recycler.is_online,
        lastSeenAt: recycler.last_seen_at,
        heartbeatAt: recycler.heartbeat_at,
        status: 'Active' as 'Active' | 'Online' | 'Offline',
        pendingRequestsCount: recycler.pending_requests_count
      }));
      
      setAvailableRecyclers(transformedData);
    } catch (error) {
      console.error('Error in fetchAvailableRecyclers:', error);
      // Fallback to regular online recyclers
      const fallbackRecyclers: Recycler[] = onlineRecyclers.map(recycler => ({
        ...recycler,
        truckSize: recycler.truckSize as 'small' | 'big',
        fullName: recycler.fullName,
        phone: recycler.phone,
        rating: recycler.rating,
        isAvailable: recycler.isAvailable,
        isOnline: recycler.isOnline,
        lastSeenAt: recycler.lastSeenAt,
        heartbeatAt: recycler.heartbeatAt,
        status: recycler.status,
        pendingRequestsCount: 0
      }));
      setAvailableRecyclers(fallbackRecyclers);
    } finally {
      setLoadingAvailable(false);
    }
  }, [onlineRecyclers]);

  // ===== TRANSFORM AVAILABLE RECYCLERS =====
  const transformedRecyclers = useMemo(() => {
    if (!userLocation || !pickupRequest) return [];
    
    return availableRecyclers
      .filter(recycler => recycler.isAvailable && recycler.isOnline)
      .map((recycler): Recycler => {
        // Mock recycler location (in real app, get from recycler profile)
        const recyclerLat = userLocation.latitude + (Math.random() - 0.5) * 0.1;
        const recyclerLon = userLocation.longitude + (Math.random() - 0.5) * 0.1;
        
        // Calculate real distance
        const distance = calculateDistance(
          userLocation.latitude, 
          userLocation.longitude, 
          recyclerLat, 
          recyclerLon
        );
        
        // Calculate ETA based on distance
        const etaMinutes = calculateETA(distance);
        
        // Calculate price based on truck size, weight, and distance
        const price = calculatePrice(recycler.truckSize, pickupRequest.estimated_weight, distance);
        const rate = `GHS ${price.toFixed(2)}`;
        
        // Mock completed pickups (in real app, get from database)
        const completedPickups = Math.floor(Math.random() * 300 + 50);
        
        return {
          ...recycler,
          truckSize: recycler.truckSize as 'small' | 'big',
          distance: `${distance.toFixed(1)} km`,
          estimatedArrival: `${etaMinutes} min`,
          rate,
          completedPickups
        };
      })
      .sort((a, b) => {
        // Sort by pending requests count first (fewer pending requests first), then by distance
        const pendingA = (a as any).pendingRequestsCount || 0;
        const pendingB = (b as any).pendingRequestsCount || 0;
        
        if (pendingA !== pendingB) {
          return pendingA - pendingB;
        }
        
        // If pending requests are equal, sort by distance
        return parseFloat(a.distance!) - parseFloat(b.distance!);
      });
  }, [availableRecyclers, userLocation, pickupRequest, calculateDistance, calculateETA, calculatePrice]);

  // ===== FILTERED RECYCLERS =====
  const filteredRecyclers = useMemo(() => {
    let filtered = transformedRecyclers;
    
    // Apply truck type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(recycler => 
        recycler.truckSize === selectedFilter.toLowerCase()
      );
    }
    
    return filtered;
  }, [transformedRecyclers, selectedFilter]);

  // ===== INITIALIZATION EFFECT =====
  useEffect(() => {
    const initializeScreen = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        
        if (!user) {
          throw new Error('User not authenticated');
        }
        
        setCurrentUser(user);

        // Set user location from params
        if (params.latitude && params.longitude) {
          setUserLocation({
            latitude: parseFloat(params.latitude),
            longitude: parseFloat(params.longitude)
          });
        }

        // Create or load pickup request
        let request: PickupRequest;
        
        if (params.requestId) {
          // Load existing request
          const { data, error } = await supabase
            .from('pickup_requests')
            .select('*')
            .eq('id', params.requestId)
            .single();
            
          if (error) throw error;
          request = data;
        } else {
          // Create new request
          const newRequest = {
            customer_id: user.id,
            pickup_address: params.pickup || 'Selected Location',
            pickup_latitude: params.latitude ? parseFloat(params.latitude) : null,
            pickup_longitude: params.longitude ? parseFloat(params.longitude) : null,
            waste_type: params.wasteType || 'Mixed Waste',
            waste_quantity: parseInt(params.wasteQuantity || '1'),
            estimated_weight: parseFloat(params.weight || '5'),
            status: 'pending',
            preferred_pickup_date: new Date().toISOString().split('T')[0],
            preferred_pickup_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
            estimated_price: 0, // Will be calculated when recycler is selected
            payment_status: 'pending'
          };

          const { data, error } = await supabase
            .from('pickup_requests')
            .insert([newRequest])
            .select()
            .single();
            
          if (error) throw error;
          request = data;
        }
        
        setPickupRequest(request);
        console.log('SelectTruck: Pickup request loaded:', request);
        
      } catch (error) {
        console.error('SelectTruck: Error initializing:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize');
      } finally {
        setLoading(false);
      }
    };

    initializeScreen();
  }, [params]);

  // ===== FETCH AVAILABLE RECYCLERS EFFECT =====
  useEffect(() => {
    if (currentUser && userLocation) {
      fetchAvailableRecyclers();
    }
  }, [currentUser, userLocation, fetchAvailableRecyclers]);

  // ===== FILTER AND SORT HANDLERS =====
  const handleFilterPress = useCallback((filter: string) => {
    setSelectedFilter(filter);
  }, []);





  // ===== ACTION HANDLERS =====
  const handleSelectRecycler = useCallback(async (recycler: Recycler) => {
    if (!pickupRequest) {
      Alert.alert('Error', 'No pickup request found');
      return;
    }

    try {
      // Calculate final price
      const distance = parseFloat(recycler.distance?.replace(' km', '') || '0');
      const finalPrice = calculatePrice(recycler.truckSize, pickupRequest.estimated_weight, distance);

      // Validate and update status using the new status management
      const result = await validateAndUpdateStatus(
        supabase,
        pickupRequest.id,
        'assigned' as PickupRequestStatus,
        pickupRequest.status as PickupRequestStatus
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to update request status');
      }

      // Update pickup request with selected recycler (separate from status update)
      const { error } = await supabase
        .from('pickup_requests')
        .update({
          recycler_id: recycler.id,
          estimated_price: finalPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', pickupRequest.id);

      if (error) throw error;

      // Navigate to recycler profile details screen
      router.push({
        pathname: '/customer-screens/RecyclerProfileDetails',
        params: { 
          recyclerId: recycler.id,
          recyclerName: recycler.fullName,
          recyclerRating: recycler.rating.toString(),
          recyclerDistance: recycler.distance,
          recyclerPhone: recycler.phone,
          vehicleType: recycler.truckSize,
          rate: recycler.rate,
          requestId: pickupRequest.id,
          estimatedPrice: finalPrice.toString(),
          estimatedArrival: recycler.estimatedArrival
        }
      });

    } catch (error) {
      console.error('Error selecting recycler:', error);
      Alert.alert('Error', 'Failed to assign recycler. Please try again.');
    }
  }, [router, pickupRequest, calculatePrice]);

  const handleCallRecycler = useCallback((recycler: Recycler) => {
    Alert.alert(
      'Call Recycler',
      `Call ${recycler.fullName} at ${recycler.phone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => {
            console.log('Calling recycler:', recycler.phone);
            Alert.alert('Call Recycler', 'Phone call functionality would be implemented here.');
          }
        }
      ]
    );
  }, []);

  // ===== UI RENDER FUNCTIONS =====
  const renderRecyclerItem = useCallback(({ item }: { item: Recycler }) => (
    <View style={styles.recyclerCard}>
      {/* Status Badge */}
      <View style={[
        styles.statusBadge,
        { backgroundColor: item.status === 'Active' ? COLORS.green : COLORS.orange }
      ]}>
        <Text style={styles.statusBadgeText}>
          {item.status === 'Active' ? '🟢 Active' : '🟡 Online'}
        </Text>
      </View>
      
      <View style={styles.recyclerRow}>
        {/* Left side - Truck icon */}
        <View style={styles.truckIconContainer}>
          <Image
            source={
              item.truckSize === 'big'
                ? require('../../assets/images/truck.png')
                : require('../../assets/images/small truck.png')
            }
            style={styles.truckIcon}
            resizeMode="contain"
          />
        </View>
        
        {/* Right side - Recycler details */}
        <View style={styles.recyclerDetails}>
          <Text style={styles.recyclerName}>{item.fullName}</Text>
          <Text style={styles.vehicleTypeText}>
            {item.truckSize === 'big' ? 'Big Truck' : 'Small Truck'}
          </Text>
          <Text style={styles.rateText}>Rate: {item.rate}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>Rating: {item.rating.toFixed(1)}</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Text key={star} style={styles.starIcon}>
                  {star <= Math.floor(item.rating) ? '★' : '☆'}
                </Text>
              ))}
            </View>
          </View>
          <View style={styles.distanceRow}>
            <MaterialIcons name="location-on" size={14} color={COLORS.gray} />
            <Text style={styles.distanceText}>{item.distance}</Text>
            <MaterialIcons name="access-time" size={14} color={COLORS.gray} style={{ marginLeft: 8 }} />
            <Text style={styles.etaText}>{item.estimatedArrival}</Text>
          </View>
        </View>
      </View>
      
      {/* Bottom section with price and select button */}
      <View style={styles.cardBottom}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceText}>{item.rate}</Text>
          <Text style={styles.pickupsText}>{item.completedPickups} pickups</Text>
        </View>
        <TouchableOpacity 
          style={styles.selectButton}
          onPress={() => handleSelectRecycler(item)}
        >
          <Text style={styles.selectButtonText}>Select</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [handleSelectRecycler]);

  if (loading || loadingAvailable) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          {loading ? 'Setting up pickup request...' : 'Loading available recyclers...'}
        </Text>
      </View>
    );
  }

  if (error || recyclersError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || `Error loading recyclers: ${recyclersError}`}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/')}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!pickupRequest) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load pickup request</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.replace('/')}>
          <Text style={styles.retryButtonText}>Go Back</Text>
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

        {/* Banner with Filter Buttons and Search */}
        <View style={styles.bannerBg}>
          <Image
            source={require('../../assets/images/blend.jpg')}
            style={styles.bannerImage}
            resizeMode="cover"
          />
          <View style={styles.bannerContent}>
            {/* Filter Buttons */}
            <View style={styles.filterContainerOverlay}>
              {['all', 'big', 'small'].map(filter => (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterButton,
                    selectedFilter === filter && styles.filterButtonActive
                  ]}
                  onPress={() => handleFilterPress(filter)}
                >
                  {filter !== 'all' && (
                    <Image
                      source={
                        filter === 'big'
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
                    {filter === 'all' ? 'All' : filter === 'big' ? 'Big Truck' : 'Small Truck'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>


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
              {recyclersLoading ? 'Loading recyclers...' : 
               selectedFilter !== 'all' ? 
               `No ${selectedFilter.toLowerCase()} trucks available in this area` :
               'No recyclers are currently available in this area'}
            </Text>
            
            {!recyclersLoading && (
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
  header: {
    backgroundColor: '#E3F0D5',
    paddingTop: 5,
    marginTop: 35,
    marginBottom: 35,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  headerLogo: {
    width: 200,
    height: 80,
    resizeMode: 'contain',
  },
  bannerBg: {
    position: 'relative',
    height: 80,
    marginBottom: 10,
    marginTop: -10,
    borderRadius: 15,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
    justifyContent: 'center',
  },
  filterContainerOverlay: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
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
    position: 'relative',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
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
  priceContainer: {
    flex: 1,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  pickupsText: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  distanceText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
  },
  etaText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
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
