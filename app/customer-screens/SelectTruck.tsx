import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants';
import { useOnlineRecyclers } from '../../hooks/useRecyclerOnlineStatus';
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
  // Location fields
  latitude?: number;
  longitude?: number;
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
  const [isInitialized, setIsInitialized] = useState(false);
  const [locationPermissionGranted, setLocationPermissionGranted] = useState(false);

  // ===== REFS TO PREVENT INFINITE LOOPS =====
  const hasFetchedRecyclers = useRef(false);
  const isFetchingRecyclers = useRef(false);

  // ===== HELPER FUNCTIONS =====
  const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
    // Validate coordinates
    if (!lat1 || !lon1 || !lat2 || !lon2 || 
        isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2) ||
        lat1 === 0 || lon1 === 0 || lat2 === 0 || lon2 === 0) {
      console.warn('SelectTruck: Invalid coordinates for distance calculation:', { lat1, lon1, lat2, lon2 });
      return 0;
    }

    // Earth's radius in kilometers
    const R = 6371;
    
    // Convert degrees to radians
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    const deltaLat = (lat2 - lat1) * Math.PI / 180;
    const deltaLon = (lon2 - lon1) * Math.PI / 180;

    // Haversine formula
    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    const distance = R * c;
    
    console.log('SelectTruck: Distance calculation details:', {
      from: { lat: lat1, lon: lon1 },
      to: { lat: lat2, lon: lon2 },
      distance: distance.toFixed(2) + ' km'
    });
    
    return distance;
  }, []);

  const calculateETA = useCallback((distance: number, isUrban: boolean = true): number => {
    if (distance <= 0) return 0;
    
    // More realistic speed calculations based on distance and area type
    let averageSpeed: number;
    
    if (distance <= 1) {
      // Very close - walking/cycling speed
      averageSpeed = 8; // km/h
    } else if (distance <= 3) {
      // Short distance - slow city traffic
      averageSpeed = isUrban ? 20 : 30; // km/h
    } else if (distance <= 10) {
      // Medium distance - mixed traffic
      averageSpeed = isUrban ? 25 : 35; // km/h
    } else {
      // Longer distance - highway speeds possible
      averageSpeed = isUrban ? 30 : 45; // km/h
    }
    
    const etaMinutes = Math.round((distance / averageSpeed) * 60);
    
    console.log('SelectTruck: ETA calculation:', {
      distance: distance.toFixed(2) + ' km',
      speed: averageSpeed + ' km/h',
      eta: etaMinutes + ' min',
      isUrban
    });
    
    return Math.max(etaMinutes, 1); // Minimum 1 minute
  }, []);

  const calculatePrice = useCallback((truckSize: string, weight: number, distance: number): number => {
    // Fixed service fee (no weight or distance calculation - proper weighing will be done later)
    const serviceFee = 10; // GHS 10 fixed service fee
    
    return serviceFee;
  }, []);

  // ===== GET CUSTOMER LOCATION =====
  const getCustomerLocation = useCallback(async (userId?: string) => {
    try {
      console.log('SelectTruck: Requesting location permission...');
      
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        console.log('SelectTruck: Location permission denied');
        Alert.alert(
          'Location Permission Required',
          'Please enable location access to find nearby recyclers and calculate accurate distances.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Location.requestForegroundPermissionsAsync() }
          ]
        );
        return null;
      }
      
      setLocationPermissionGranted(true);
      console.log('SelectTruck: Location permission granted');
      
      // Get current location
      console.log('SelectTruck: Getting current location...');
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      const customerLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      
      console.log('SelectTruck: Customer location obtained:', customerLocation);
      setUserLocation(customerLocation);
      
      // Store customer location in database
      if (userId) {
        try {
          console.log('SelectTruck: Attempting to update customer location in database:', {
            userId,
            latitude: customerLocation.latitude,
            longitude: customerLocation.longitude
          });
          
          // First, check if customer record exists
          const { data: existingCustomer, error: checkError } = await supabase
            .from('customers')
            .select('id, full_name, email')
            .eq('id', userId)
            .single();
          
          if (checkError) {
            console.error('SelectTruck: Error checking customer record:', checkError);
            // Try to create customer record if it doesn't exist
            const { data: newCustomer, error: createError } = await supabase
              .from('customers')
              .insert({
                id: userId,
                full_name: 'Customer',
                email: 'customer@example.com',
                latitude: customerLocation.latitude,
                longitude: customerLocation.longitude,
                last_location_updated: new Date().toISOString()
              })
              .select();
            
            if (createError) {
              console.error('SelectTruck: Error creating customer record:', createError);
            } else {
              console.log('SelectTruck: Customer record created with location:', newCustomer);
            }
          } else {
            console.log('SelectTruck: Customer record exists:', existingCustomer);
            
            // Update existing customer record
            const { data, error: locationError } = await supabase
              .from('customers')
              .update({
                latitude: customerLocation.latitude,
                longitude: customerLocation.longitude,
                last_location_updated: new Date().toISOString()
              })
              .eq('id', userId)
              .select();
            
            if (locationError) {
              console.error('SelectTruck: Error updating customer location:', locationError);
              console.error('SelectTruck: Error details:', {
                message: locationError.message,
                details: locationError.details,
                hint: locationError.hint,
                code: locationError.code
              });
            } else {
              console.log('SelectTruck: Customer location stored successfully:', data);
            }
          }
        } catch (error) {
          console.error('SelectTruck: Exception storing customer location:', error);
        }
      } else {
        console.log('SelectTruck: No userId provided, skipping database update');
      }
      
      return customerLocation;
    } catch (error) {
      console.error('SelectTruck: Error getting customer location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Using default location for distance calculation.',
        [{ text: 'OK' }]
      );
      return null;
    }
  }, []);

  // ===== FETCH AVAILABLE RECYCLERS =====
  const fetchAvailableRecyclers = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isFetchingRecyclers.current) {
      console.log('SelectTruck: Already fetching recyclers, skipping...');
      return;
    }
    
    // Prevent repeated calls if we already fetched
    if (hasFetchedRecyclers.current) {
      console.log('SelectTruck: Already fetched recyclers, skipping...');
      return;
    }
    
    try {
      console.log('SelectTruck: Starting fetchAvailableRecyclers...');
      isFetchingRecyclers.current = true;
      setLoadingAvailable(true);
      
      // Get current online recyclers from the hook
      const currentOnlineRecyclers = onlineRecyclers;
      
      // Quick bypass: if we have online recyclers that are available, use them directly
      console.log('SelectTruck: Checking bypass - onlineRecyclers.length:', currentOnlineRecyclers.length);
      if (currentOnlineRecyclers.length > 0) {
        console.log('SelectTruck: Online recyclers data:', currentOnlineRecyclers.map(r => ({
          name: r.fullName,
          isAvailable: r.isAvailable,
          isOnline: r.isOnline
        })));
        const availableOnlineRecyclers = currentOnlineRecyclers.filter(r => r.isAvailable && r.isOnline);
        console.log('SelectTruck: Available online recyclers after filter:', availableOnlineRecyclers.length);
        if (availableOnlineRecyclers.length > 0) {
          console.log('SelectTruck: Bypassing RPC, using available online recyclers directly');
          const convertedRecyclers: Recycler[] = availableOnlineRecyclers.map(recycler => ({
            ...recycler,
            truckSize: (recycler.truckSize?.toLowerCase() === 'big' ? 'big' : 'small') as 'small' | 'big'
          }));
          setAvailableRecyclers(convertedRecyclers);
          setLoadingAvailable(false);
          console.log('SelectTruck: Bypass completed, set availableRecyclers to:', convertedRecyclers.length);
          return;
        }
      }
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 3000) // Reduced to 3 second timeout
      );
      
      console.log('SelectTruck: Calling get_available_recyclers_exclude_rejected RPC...');
      const rpcPromise = supabase.rpc('get_available_recyclers_exclude_rejected', {
        p_customer_id: currentUser.id
      });
      
      // Use the new function that excludes busy recyclers
      const { data, error } = await Promise.race([rpcPromise, timeoutPromise]) as any;
      
      console.log('SelectTruck: RPC response - data:', data, 'error:', error);
      
      if (error) {
        console.error('Error fetching available recyclers:', error);
        console.log('RPC failed, trying direct database query...');
        
        // Try direct database query as fallback
        try {
          // First get rejected recycler IDs for this customer
          const { data: rejectedData } = await supabase
            .from('pickup_requests')
            .select('recycler_id')
            .eq('customer_id', currentUser.id)
            .eq('status', 'rejected')
            .not('recycler_id', 'is', null);

          const rejectedRecyclerIds = rejectedData?.map(r => r.recycler_id) || [];

          const { data: directData, error: directError } = await supabase
            .from('recyclers')
            .select(`
              id,
              full_name,
              phone,
              truck_size,
              rating,
              is_available,
              is_online,
              last_seen_at,
              heartbeat_at,
              latitude,
              longitude
            `)
            .eq('verification_status', 'approved')
            .eq('is_online', true)
            .eq('is_available', true)
            .gt('heartbeat_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()) // Extended to 10 minutes
            .not('id', 'in', `(${rejectedRecyclerIds.length > 0 ? rejectedRecyclerIds.map(id => `'${id}'`).join(',') : 'null'})`); // Exclude rejected recyclers

          if (directError) {
            console.error('Direct query also failed:', directError);
            // Final fallback to online recyclers (excluding rejected ones)
            const filteredRecyclers = currentOnlineRecyclers.filter(recycler => 
              !rejectedRecyclerIds.includes(recycler.id)
            );
            const convertedRecyclers: Recycler[] = filteredRecyclers.map(recycler => ({
          ...recycler,
              truckSize: (recycler.truckSize?.toLowerCase() === 'big' ? 'big' : 'small') as 'small' | 'big'
            }));
            setAvailableRecyclers(convertedRecyclers);
            console.log(`Final Fallback: Using ${filteredRecyclers.length} online recyclers (excluding ${rejectedRecyclerIds.length} rejected)`);
          } else {
            console.log('Direct query successful:', directData?.length, 'recyclers');
            const convertedRecyclers: Recycler[] = (directData || []).map(recycler => ({
              id: recycler.id,
              fullName: recycler.full_name,
          phone: recycler.phone,
              truckSize: (recycler.truck_size?.toLowerCase() === 'big' ? 'big' : 'small') as 'small' | 'big',
          rating: recycler.rating,
              isAvailable: recycler.is_available,
              isOnline: recycler.is_online,
              lastSeenAt: recycler.last_seen_at,
              heartbeatAt: recycler.heartbeat_at,
              status: 'Active' as 'Active' | 'Online' | 'Offline',
              latitude: recycler.latitude,
              longitude: recycler.longitude,
          pendingRequestsCount: 0
        }));
            setAvailableRecyclers(convertedRecyclers);
          }
        } catch (fallbackError) {
          console.error('Fallback query failed:', fallbackError);
          // Final fallback to online recyclers
          const convertedRecyclers: Recycler[] = currentOnlineRecyclers.map(recycler => ({
            ...recycler,
            truckSize: (recycler.truckSize?.toLowerCase() === 'big' ? 'big' : 'small') as 'small' | 'big'
          }));
          setAvailableRecyclers(convertedRecyclers);
          console.log(`Final Fallback: Using ${currentOnlineRecyclers.length} online recyclers`);
        }
        return;
      }
      
      // Check if we got any data
      if (!data || data.length === 0) {
        console.log('No data returned from RPC, trying direct database query...');
        
        // Direct database query as final fallback
        const { data: directData, error: directError } = await supabase
          .from('recyclers')
          .select(`
            id,
            full_name,
            phone,
            truck_size,
            rating,
            is_available,
            is_online,
            last_seen_at,
            heartbeat_at,
            verification_status,
            latitude,
            longitude
          `)
          .eq('verification_status', 'approved')
          .eq('is_online', true)
          .eq('is_available', true)
          .gt('heartbeat_at', new Date(Date.now() - 10 * 60 * 1000).toISOString()); // Extended to 10 minutes
        
        console.log('Direct query result:', directData, 'error:', directError);
        
        if (directData && directData.length > 0) {
          const directRecyclers: Recycler[] = directData.map((recycler: any) => ({
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
            pendingRequestsCount: 0,
            latitude: recycler.latitude,
            longitude: recycler.longitude
          }));
          setAvailableRecyclers(directRecyclers);
          console.log(`Direct query: Found ${directRecyclers.length} available recyclers`);
          return;
        }
        
        // Final fallback to online recyclers
        console.log('Direct query failed, using online recyclers directly...');
        const convertedRecyclers: Recycler[] = currentOnlineRecyclers.map(recycler => ({
        ...recycler,
          truckSize: (recycler.truckSize?.toLowerCase() === 'big' ? 'big' : 'small') as 'small' | 'big'
        }));
        setAvailableRecyclers(convertedRecyclers);
        console.log(`Direct Query Fallback: Using ${currentOnlineRecyclers.length} online recyclers`);
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
        pendingRequestsCount: recycler.pending_requests_count,
        latitude: recycler.latitude,
        longitude: recycler.longitude
      }));
      
      setAvailableRecyclers(transformedData);
      console.log(`SelectTruck: Found ${transformedData.length} available recyclers (not busy)`);
      console.log('SelectTruck: Available recyclers data:', transformedData);
    } catch (error) {
      console.error('SelectTruck: Error in fetchAvailableRecyclers:', error);
      
      // Set empty array on error to show "no recyclers available" message
      setAvailableRecyclers([]);
      
      // Log the specific error for debugging
      if (error instanceof Error) {
        console.error('SelectTruck: Fetch error details:', error.message);
        if (error.message === 'Request timeout') {
          console.error('SelectTruck: Request timed out after 8 seconds');
        }
      }
    } finally {
      console.log('SelectTruck: fetchAvailableRecyclers completed');
      isFetchingRecyclers.current = false;
      hasFetchedRecyclers.current = true;
      setLoadingAvailable(false);
    }
  }, []); // Removed onlineRecyclers dependency to prevent infinite loop

  // ===== TRANSFORM AVAILABLE RECYCLERS =====
  const transformedRecyclers = useMemo(() => {
    if (!pickupRequest) {
      console.log('SelectTruck: No pickupRequest, returning empty array');
      return [];
    }
    
    console.log('SelectTruck: Filtering available recyclers:', availableRecyclers.map(r => ({
      name: r.fullName,
      isAvailable: r.isAvailable,
      isOnline: r.isOnline
    })));
    
    const filtered = availableRecyclers
      .filter(recycler => recycler.isAvailable && recycler.isOnline);
    
    console.log('SelectTruck: After filtering (isAvailable && isOnline):', filtered.length, 'recyclers');
    
    return filtered
      .map((recycler): Recycler => {
        // Use customer's actual location or fallback to Kumasi center
        const defaultLat = 6.6885; // Kumasi coordinates (fallback only)
        const defaultLon = -1.6244;
        
        const userLat = userLocation?.latitude || defaultLat;
        const userLon = userLocation?.longitude || defaultLon;
        
        console.log('SelectTruck: Customer location:', { 
          userLat, 
          userLon, 
          isRealLocation: userLocation !== null,
          locationSource: userLocation ? 'GPS/Params' : 'Fallback'
        });
        
        // Check if recycler has location data
        const recyclerLat = (recycler as any).latitude;
        const recyclerLon = (recycler as any).longitude;
        
        let distance = 'Distance TBD';
        let estimatedArrival = 'ETA TBD';
        
        if (recyclerLat && recyclerLon && userLat && userLon) {
          // Calculate real distance with improved accuracy
          const calculatedDistance = calculateDistance(userLat, userLon, recyclerLat, recyclerLon);
          
          if (calculatedDistance > 0) {
            // Format distance appropriately
            if (calculatedDistance < 1) {
              distance = `${Math.round(calculatedDistance * 1000)} m`; // Show in meters if < 1km
            } else {
              distance = `${calculatedDistance.toFixed(1)} km`;
            }
            
            // Calculate ETA with improved logic (assuming Kumasi is urban)
            const etaMinutes = calculateETA(calculatedDistance, true);
            estimatedArrival = `${etaMinutes} min`;
            
            console.log('SelectTruck: Improved distance calculation:', {
              recycler: recycler.fullName,
              customer: { lat: userLat, lon: userLon, source: userLocation ? 'Real GPS' : 'Fallback' },
              recyclerCoords: { lat: recyclerLat, lon: recyclerLon },
              distance: calculatedDistance.toFixed(2) + ' km',
              displayDistance: distance,
              eta: etaMinutes + ' min',
              isAccurate: userLocation !== null,
              coordinatesValid: true
            });
          } else {
            console.warn('SelectTruck: Distance calculation returned 0 or invalid:', {
              recycler: recycler.fullName,
              customer: { lat: userLat, lon: userLon },
              recyclerCoords: { lat: recyclerLat, lon: recyclerLon }
            });
          }
        } else {
          console.warn('SelectTruck: Missing coordinates for distance calculation:', {
            recyclerName: recycler.fullName,
            hasCustomerCoords: !!(userLat && userLon),
            hasRecyclerCoords: !!(recyclerLat && recyclerLon),
            customer: { lat: userLat, lon: userLon },
            recyclerCoords: { lat: recyclerLat, lon: recyclerLon }
          });
        }
        
        return {
          ...recycler,
          truckSize: (recycler.truckSize?.toLowerCase() === 'big' ? 'big' : 'small') as 'small' | 'big',
          distance,
          estimatedArrival,
          rate: 'GHS 1.2/kg', // Rate per kg
          completedPickups: 0 // Will be fetched from database when available
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
        // Handle both "X.X km" and "XXX m" formats
        const parseDistance = (dist: string): number => {
          if (!dist || dist === 'Distance TBD') return Infinity;
          if (dist.includes('m')) {
            return parseFloat(dist.replace(' m', '')) / 1000; // Convert meters to km
          }
          return parseFloat(dist.replace(' km', ''));
        };
        
        return parseDistance(a.distance!) - parseDistance(b.distance!);
      });
  }, [availableRecyclers, userLocation, pickupRequest, calculateDistance, calculateETA, calculatePrice]);

  // ===== FILTERED RECYCLERS =====
  const filteredRecyclers = useMemo(() => {
    let filtered = transformedRecyclers;
    
    console.log('SelectTruck: Before truck filter:', filtered.length, 'recyclers');
    
    // Apply truck type filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(recycler => 
        recycler.truckSize === selectedFilter.toLowerCase()
      );
      console.log('SelectTruck: After truck filter:', filtered.length, 'recyclers');
    }
    
    console.log('SelectTruck: Final filtered recyclers:', filtered.map(r => r.fullName));
    return filtered;
  }, [transformedRecyclers, selectedFilter]);

  // ===== CHECK FOR ACTIVE REQUESTS =====
  const checkForActiveRequests = useCallback(async (userId: string) => {
    try {
      console.log('SelectTruck: Checking for active requests for user:', userId);
      
      const { data, error } = await supabase.rpc('can_customer_place_request', {
        customer_id_param: userId
      });
      
      if (error) {
        console.error('SelectTruck: Error checking active requests:', error);
        return { canPlace: true, activeRequest: null };
      }
      
      if (data && data.length > 0) {
        const result = data[0];
        console.log('SelectTruck: Active request check result:', result);
        
        if (!result.can_place_request) {
          return {
            canPlace: false,
            activeRequest: {
              id: result.active_request_id,
              status: result.active_request_status,
              message: result.message
            }
          };
        }
      }
      
      return { canPlace: true, activeRequest: null };
    } catch (error) {
      console.error('SelectTruck: Error in checkForActiveRequests:', error);
      return { canPlace: true, activeRequest: null };
    }
  }, []);

  // ===== INITIALIZATION EFFECT =====
  useEffect(() => {
    if (isInitialized) return; // Prevent re-initialization
    
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

        // Check for active requests before proceeding
        const activeRequestCheck = await checkForActiveRequests(user.id);
        if (!activeRequestCheck.canPlace) {
          setError(activeRequestCheck.activeRequest?.message || 'You have an active request that must be completed first');
          setLoading(false);
          return;
        }

        // Get customer location - try params first, then GPS
        let customerLocation = null;
        
        if (params.latitude && params.longitude) {
          // Use location from params (if passed from previous screen)
          customerLocation = {
            latitude: parseFloat(params.latitude),
            longitude: parseFloat(params.longitude)
          };
          console.log('SelectTruck: Using location from params:', customerLocation);
        } else {
          // Get current GPS location
          console.log('SelectTruck: Getting GPS location...');
          customerLocation = await getCustomerLocation(user.id);
        }
        
        if (customerLocation) {
          setUserLocation(customerLocation);
        } else {
          // Fallback to Kumasi center if location unavailable
          const fallbackLocation = {
            latitude: 6.6885,
            longitude: -1.6244
          };
          setUserLocation(fallbackLocation);
          console.log('SelectTruck: Using fallback location:', fallbackLocation);
        }

        // Create pickup request data (but don't save to database yet)
        // The request will only be created when customer confirms with a recycler
        const finalLocation = customerLocation || userLocation;
        const requestData: PickupRequest = {
          id: '', // Will be generated when request is actually created
            customer_id: user.id,
          recycler_id: undefined, // Will be set when recycler is selected
            pickup_address: params.pickup || 'Selected Location',
          pickup_latitude: finalLocation?.latitude,
          pickup_longitude: finalLocation?.longitude,
            waste_type: params.wasteType || 'Mixed Waste',
            waste_quantity: parseInt(params.wasteQuantity || '1'),
            estimated_weight: parseFloat(params.weight || '5'),
          status: 'draft', // Draft status - not yet submitted
            preferred_pickup_date: new Date().toISOString().split('T')[0],
            preferred_pickup_time: new Date().toTimeString().split(' ')[0].substring(0, 5),
            estimated_price: 0, // Will be calculated when recycler is selected
          payment_status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setPickupRequest(requestData);
        console.log('SelectTruck: Pickup request data prepared (not yet created):', requestData);
        setIsInitialized(true);
        
        // Note: fetchAvailableRecyclers will be called by the useEffect when isInitialized becomes true
        
      } catch (error) {
        console.error('SelectTruck: Error initializing:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize');
      } finally {
        setLoading(false);
      }
    };

    initializeScreen();
  }, [isInitialized, params.requestId, params.latitude, params.longitude, params.pickup, params.wasteType, params.wasteQuantity, params.weight]);

  // ===== FETCH AVAILABLE RECYCLERS EFFECT =====
  useEffect(() => {
    if (currentUser && userLocation && isInitialized) {
      console.log(`SelectTruck: Total online recyclers: ${onlineRecyclers.length}`);
      console.log(`SelectTruck: Online recyclers status:`, onlineRecyclers.map(r => ({ 
        name: r.fullName, 
        isOnline: r.isOnline, 
        isAvailable: r.isAvailable 
      })));
      
      // Reset refs when conditions change
      hasFetchedRecyclers.current = false;
      isFetchingRecyclers.current = false;
      
      // Only call fetchAvailableRecyclers once when conditions are met
      const timeoutId = setTimeout(() => {
        console.log('SelectTruck: Calling fetchAvailableRecyclers...');
      fetchAvailableRecyclers();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [currentUser, userLocation, isInitialized]); // Removed fetchAvailableRecyclers and onlineRecyclers to prevent infinite loop

  // ===== LOADING TIMEOUT EFFECT =====
  useEffect(() => {
    if (loadingAvailable) {
      // Set a maximum loading time of 15 seconds
      const timeout = setTimeout(() => {
        console.log('Loading timeout reached, stopping loading state');
        setLoadingAvailable(false);
        setAvailableRecyclers([]); // Show empty state
      }, 15000);

      return () => clearTimeout(timeout);
    }
  }, [loadingAvailable]);

  // ===== FILTER AND SORT HANDLERS =====
  const handleFilterPress = useCallback((filter: string) => {
    setSelectedFilter(filter);
  }, []);





  // ===== ACTION HANDLERS =====
  const handleSelectRecycler = useCallback(async (recycler: Recycler) => {
    if (!pickupRequest) {
      Alert.alert('Error', 'No pickup request data found');
      return;
    }

    try {
      // Navigate to recycler profile details screen WITHOUT creating the request yet
      // The request will be created when user confirms in the profile screen
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
          // Pass pickup request data to be used when confirming
          customerId: pickupRequest.customer_id,
          pickupAddress: pickupRequest.pickup_address,
          pickupLatitude: pickupRequest.pickup_latitude?.toString(),
          pickupLongitude: pickupRequest.pickup_longitude?.toString(),
          wasteType: pickupRequest.waste_type,
          wasteQuantity: pickupRequest.waste_quantity?.toString(),
          estimatedWeight: pickupRequest.estimated_weight?.toString(),
          preferredPickupDate: pickupRequest.preferred_pickup_date,
          preferredPickupTime: pickupRequest.preferred_pickup_time,
          estimatedPrice: '0', // No initial price
          estimatedArrival: recycler.estimatedArrival
        }
      });

    } catch (error) {
      console.error('Error navigating to recycler profile:', error);
      Alert.alert('Error', 'Failed to open recycler profile. Please try again.');
    }
  }, [router, pickupRequest]);

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

        {/* Active Request Warning */}
        {error && error.includes('active request') && (
          <View style={styles.activeRequestContainer}>
            <View style={styles.activeRequestCard}>
              <View style={styles.activeRequestHeader}>
                <Text style={styles.activeRequestIcon}>⚠️</Text>
                <Text style={styles.activeRequestTitle}>Active Request Found</Text>
              </View>
              <Text style={styles.activeRequestMessage}>{error}</Text>
              <View style={styles.activeRequestActions}>
                <TouchableOpacity 
                  style={styles.cancelRequestButton}
                  onPress={async () => {
                    if (currentUser) {
                      try {
                        const { data, error } = await supabase.rpc('cancel_customer_active_request', {
                          customer_id_param: currentUser.id
                        });
                        
                        if (error) {
                          console.error('Error cancelling request:', error);
                          return;
                        }
                        
                        if (data && data[0]?.success) {
                          setError(null);
                          // Refresh the screen
                          setIsInitialized(false);
                        }
                      } catch (err) {
                        console.error('Error cancelling request:', err);
                      }
                    }
                  }}
                >
                  <Text style={styles.cancelRequestButtonText}>Cancel Active Request</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.viewRequestButton}
                  onPress={() => {
                    // Navigate to waiting screen or request details
                    router.push('/customer-screens/WaitingForRecycler');
                  }}
                >
                  <Text style={styles.viewRequestButtonText}>View Request</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

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
            <Text style={styles.noResultsText}>
              {selectedFilter === 'all' ? '🚛 No Recyclers Available' : 
               selectedFilter === 'big' ? '🚛 No Big Trucks Available' :
               '🚛 No Small Trucks Available'}
            </Text>
            <Text style={styles.noResultsSubtext}>
              {recyclersLoading ? 'Loading...' : 
               selectedFilter !== 'all' ? 
               `No ${selectedFilter} trucks available` :
               'No recyclers available at the moment'}
            </Text>
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
  tryAgainButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
    alignSelf: 'stretch',
  },
  tryAgainButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
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
  // Active Request Styles
  activeRequestContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff3cd',
  },
  activeRequestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeRequestIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  activeRequestTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
  },
  activeRequestMessage: {
    fontSize: 14,
    color: '#856404',
    marginBottom: 12,
    lineHeight: 20,
  },
  activeRequestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelRequestButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelRequestButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  viewRequestButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewRequestButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
