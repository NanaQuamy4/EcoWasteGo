import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import MapComponent from '../../components/MapComponent';
import { COLORS } from '../../constants';
import { getRoute, RouteInfo, RouteStep } from '../../lib/routeService';
import { supabase } from '../../lib/supabase';

// ===== REAL DATA LOADING FOR RECYCLER NAVIGATION =====
// This loads real data from the database instead of using mock data

interface NavigationData {
  requestId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  wasteType: string;
  weight: number;
  estimatedDistance: number;
  estimatedTime: number;
}

export default function RecyclerNavigation() {
  const params = useLocalSearchParams();
  const requestId = params.requestId as string;
  
  const [isNavigating, setIsNavigating] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [isLocationTracking, setIsLocationTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 6.6734,
    longitude: -1.5714,
  });
  const [destinationLocation, setDestinationLocation] = useState({
    latitude: 6.6834,
    longitude: -1.5814,
  });
  const [arrivalTimer, setArrivalTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [navigationData, setNavigationData] = useState<NavigationData | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{latitude: number, longitude: number}>>([]);
  const [distanceToDestination, setDistanceToDestination] = useState(0);
  const [etaToDestination, setEtaToDestination] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [movementSpeed, setMovementSpeed] = useState(0);
  const [previousLocation, setPreviousLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
  const [showRouteSteps, setShowRouteSteps] = useState(false);


  // ===== MOVEMENT CALCULATION FUNCTIONS =====
  // Calculate distance between two coordinates using Haversine formula
  const calculateDistanceHaversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate movement and speed
  const calculateMovement = useCallback((newLocation: {latitude: number, longitude: number}) => {
    if (previousLocation) {
      const movementDistance = calculateDistanceHaversine(
        previousLocation.latitude,
        previousLocation.longitude,
        newLocation.latitude,
        newLocation.longitude
      );
      
      // Update movement status
      if (movementDistance > 0.001) { // 1 meter threshold
        setIsMoving(true);
        // Calculate speed in km/h (distance moved in 5 seconds * 720)
        const speed = movementDistance * 720;
        setMovementSpeed(speed);
        console.log('🚛 Recycler is moving! Distance moved:', movementDistance.toFixed(3), 'km, Speed:', speed.toFixed(1), 'km/h');
      } else {
        setIsMoving(false);
        setMovementSpeed(0);
      }
    }
    
    // Update previous location for next calculation
    setPreviousLocation(newLocation);
  }, [previousLocation]);

  // Calculate route to destination
  const calculateRoute = useCallback(async () => {
    if (!currentLocation || !destinationLocation) return;
    
    try {
      setIsCalculatingRoute(true);
      console.log('🗺️ Calculating route to destination...');
      
      const route = await getRoute(currentLocation, destinationLocation, 'driving');
      
      if (route) {
        setRouteInfo(route);
        setRouteSteps(route.steps);
        setRouteCoordinates(route.coordinates);
        
        // Update distance and ETA with real route data
        const distanceKm = parseFloat(route.distance.replace(/[^\d.]/g, ''));
        const durationMinutes = parseInt(route.duration.replace(/[^\d]/g, ''));
        
        setDistanceToDestination(distanceKm);
        setEtaToDestination(durationMinutes);
        
        console.log('✅ Route calculated successfully:');
        console.log('Distance:', route.distance);
        console.log('Duration:', route.duration);
        console.log('Steps:', route.steps.length);
      } else {
        console.log('❌ Failed to calculate route, using fallback');
        // Fallback to direct distance calculation
        const distance = calculateDistanceHaversine(
          currentLocation.latitude,
          currentLocation.longitude,
          destinationLocation.latitude,
          destinationLocation.longitude
        );
        setDistanceToDestination(distance);
        setEtaToDestination(Math.round(distance * 2)); // Rough estimate
      }
    } catch (error) {
      console.error('❌ Error calculating route:', error);
    } finally {
      setIsCalculatingRoute(false);
    }
  }, [currentLocation, destinationLocation]);

  // ===== REAL DATA LOADING FUNCTION =====
  // This fetches real pickup request data from the database
  const loadRequestData = useCallback(async () => {
    if (!requestId) return;
    
    try {
      console.log('RecyclerNavigation: Loading request data for ID:', requestId);
      
      // Fetch pickup request with customer details
      const { data: requestData, error: requestError } = await supabase
        .from('pickup_requests')
        .select(`
          *,
          customers:customer_id (
            id,
            full_name,
            phone
          )
        `)
        .eq('id', requestId)
        .single();

      if (requestError) {
        console.error('Error fetching request data:', requestError);
        Alert.alert('Error', 'Failed to load pickup request details');
        return;
      }

      if (!requestData) {
        Alert.alert('Error', 'Pickup request not found');
        router.back();
        return;
      }

      // Calculate distance and ETA (simplified for now)
      const estimatedDistance = 2.3; // This would be calculated from actual coordinates
      const estimatedTime = 8; // This would be calculated based on distance and traffic

      setNavigationData({
        requestId: requestData.id,
        customerId: requestData.customer_id,
        customerName: requestData.customers?.full_name || 'Customer',
        customerPhone: requestData.customers?.phone || 'Unknown',
        pickupAddress: requestData.pickup_address || 'Location not specified',
        wasteType: 'Mixed Waste', // We removed waste_type from the interface
        weight: 0, // We removed weight from the interface
        estimatedDistance,
        estimatedTime
      });

      // Set destination coordinates if available
      if (requestData.pickup_latitude && requestData.pickup_longitude) {
        setDestinationLocation({
          latitude: requestData.pickup_latitude,
          longitude: requestData.pickup_longitude
        });
      }

      console.log('RecyclerNavigation: Request data loaded successfully');
    } catch (error) {
      console.error('Error loading request data:', error);
      Alert.alert('Error', 'Failed to load pickup request details');
    }
  }, [requestId]);

  // Load notification count
  const loadNotificationCount = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching notification count:', error);
        return;
      }

      setNotificationCount(count || 0);
    } catch (error) {
      console.error('Error fetching notification count:', error);
    }
  }, []);

  // Get request details when component mounts
  useEffect(() => {
    if (requestId) {
      loadRequestData();
      loadNotificationCount();
    }
    requestLocationPermission();
  }, [requestId, loadRequestData, loadNotificationCount]);

  // Calculate route when locations are available
  useEffect(() => {
    if (currentLocation && destinationLocation) {
      calculateRoute();
    }
  }, [currentLocation, destinationLocation, calculateRoute]);

  // Cleanup location subscription and arrival timer
  useEffect(() => {
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      if (arrivalTimer) {
        clearTimeout(arrivalTimer);
      }
    };
  }, [locationSubscription, arrivalTimer]);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationPermission(true);
        getCurrentLocation();
      } else {
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to use navigation features.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error requesting location permission:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setCurrentLocation(newLocation);
      
      // Calculate movement and speed
      calculateMovement(newLocation);
      
      // Update route coordinates when location changes
      if (isNavigating) {
        updateRouteCoordinates(newLocation);
        updateCustomerTracking(newLocation);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const startLocationTracking = async () => {
    if (!locationPermission) {
      Alert.alert('Location Permission Required', 'Please enable location services first.');
      return;
    }

    setIsLocationTracking(true);
    
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 10, // Update every 10 meters
        },
        async (location) => {
          const newLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          
          setCurrentLocation(newLocation);
          
          // Calculate movement and speed
          calculateMovement(newLocation);
          
          // Update recycler location in database
          await updateRecyclerLocation(newLocation);
          
          if (isNavigating) {
            updateRouteCoordinates(newLocation);
            updateCustomerTracking(newLocation);
            checkArrival(newLocation);
          }
        }
      );

      setLocationSubscription(subscription);
    } catch (error) {
      console.error('Error starting location tracking:', error);
      setIsLocationTracking(false);
      Alert.alert('Error', 'Failed to start location tracking. Please try again.');
    }
  };

  const stopLocationTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    setIsLocationTracking(false);
  };

  // Update recycler location in database
  const updateRecyclerLocation = async (location: {latitude: number, longitude: number}) => {
    try {
      const { error } = await supabase
        .from('recyclers')
        .update({
          latitude: location.latitude,
          longitude: location.longitude,
          heartbeat_at: new Date().toISOString()
        })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);

      if (error) {
        console.error('Error updating recycler location:', error);
      }
    } catch (error) {
      console.error('Error updating recycler location:', error);
    }
  };

  const updateRouteCoordinates = (newLocation: {latitude: number, longitude: number}) => {
    // Add new location to route coordinates
    setRouteCoordinates(prev => [...prev, newLocation]);
    
    // Calculate distance to destination
    const distance = calculateDistanceHaversine(
      newLocation.latitude,
      newLocation.longitude,
      destinationLocation.latitude,
      destinationLocation.longitude
    );
    setDistanceToDestination(distance);
    
    // Calculate ETA (assuming average speed of 30 km/h)
    const etaMinutes = Math.round((distance / 30) * 60);
    setEtaToDestination(etaMinutes);
  };

  const updateCustomerTracking = async (recyclerLocation: {latitude: number, longitude: number}) => {
    try {
      if (!navigationData?.customerId || !requestId) {
        console.log('Missing customer ID or request ID for tracking update');
        return;
      }

      console.log('Updating customer tracking with recycler location:', {
        recyclerLocation,
        customerId: navigationData.customerId,
        requestId
      });
      
      // Update recycler location in the pickup_requests table for customer tracking
      const { error: updateError } = await supabase
        .from('pickup_requests')
        .update({
          recycler_latitude: recyclerLocation.latitude,
          recycler_longitude: recyclerLocation.longitude,
          recycler_location_updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating recycler location for tracking:', updateError);
        return;
      }

      // Send real-time notification to customer about recycler location update
      const { error: notificationError } = await supabase.rpc('send_notification', {
        p_user_id: navigationData.customerId,
        p_type: 'recycler_location_update',
        p_title: '🚛 Recycler Location Update',
        p_message: `Your recycler is at ${recyclerLocation.latitude.toFixed(4)}, ${recyclerLocation.longitude.toFixed(4)}. Tap to track their progress.`,
        p_related_request_id: requestId,
        p_related_user_id: (await supabase.auth.getUser()).data.user?.id,
        p_priority: 'low'
      });

      if (notificationError) {
        console.error('Error sending location update notification:', notificationError);
        // Don't block tracking if notification fails
      }

      console.log('Customer tracking updated successfully');
    } catch (error) {
      console.error('Error updating customer tracking:', error);
    }
  };

  const checkArrival = async (currentLoc: {latitude: number, longitude: number}) => {
    if (!requestId) return;
    
    try {
      // Use database function to check and update arrival status
      const { data, error } = await supabase.rpc('update_pickup_status_on_arrival', {
        p_request_id: requestId,
        p_recycler_latitude: currentLoc.latitude,
        p_recycler_longitude: currentLoc.longitude,
        p_arrival_threshold: 0.05 // 50 meters
      });
      
      if (error) {
        console.error('Error checking arrival:', error);
        return;
      }
      
      // If database indicates arrival, update local state
      if (data && !hasArrived) {
        setHasArrived(true);
        setIsNavigating(false);
        stopLocationTracking();
        
        console.log('🎯 Recycler has arrived at pickup location!');
        
        Alert.alert(
          '🎯 Destination Reached!',
          'You have arrived at the pickup location. Ready to collect waste.',
          [
            {
              text: 'Start Collection',
              onPress: () => {
                console.log('Starting waste collection process');
                // Navigate to collection screen or update UI
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error in arrival detection:', error);
    }
  };

  // ===== MANUAL ARRIVAL CONFIRMATION =====
  const handleManualArrival = useCallback(async () => {
    if (!requestId || hasArrived) return;

    try {
      console.log('Processing manual arrival confirmation for request:', requestId);
      
      // Use the same database function as automatic detection but with current location
      const { data, error } = await supabase.rpc('update_pickup_status_on_arrival', {
        p_request_id: requestId,
        p_recycler_latitude: currentLocation.latitude,
        p_recycler_longitude: currentLocation.longitude,
        p_arrival_threshold: 0.05 // 50 meters
      });

      if (error) {
        console.error('Error updating pickup request status:', error);
        throw error;
      }

      // If successful, trigger the same arrival logic as automatic detection
      if (data && !hasArrived) {
        setHasArrived(true);
        setIsNavigating(false);
        stopLocationTracking();
        
        console.log('🎯 Manual arrival confirmation successful!');
        
        Alert.alert(
          '🎯 Arrival Confirmed!',
          'You have successfully confirmed your arrival at the pickup location. All stakeholders have been notified.',
          [
            {
              text: 'Start Collection',
              onPress: () => {
                console.log('Starting waste collection process');
                // Navigate to collection screen or update UI
              }
            }
          ]
        );
      }
      
      console.log('Manual arrival confirmation completed successfully');
    } catch (error) {
      console.error('Error in manual arrival confirmation:', error);
      throw error;
    }
  }, [requestId, hasArrived, currentLocation]);

  const handleStartNavigation = async () => {
    if (!locationPermission) {
      Alert.alert('Location Permission Required', 'Please enable location services first.');
      return;
    }

    try {
      // Update status to 'in_progress' in the database
      const { error: updateError } = await supabase
        .from('pickup_requests')
        .update({ status: 'in_progress' })
        .eq('id', requestId);

      if (updateError) {
        console.error('Error updating pickup status:', updateError);
        Alert.alert('Error', 'Failed to update pickup status. Please try again.');
        return;
      }

      // Send notification to customer that recycler has started navigation
      const { data: requestData } = await supabase
        .from('pickup_requests')
        .select('customer_id')
        .eq('id', requestId)
        .single();

      if (requestData?.customer_id) {
        const { error: notificationError } = await supabase.rpc('send_notification', {
          p_user_id: requestData.customer_id,
          p_type: 'recycler_started_navigation',
          p_title: '🚛 Recycler is on the way!',
          p_message: `Your recycler has started navigation and is heading to your pickup location. Tap to track their progress in real-time.`,
          p_related_request_id: requestId,
          p_related_user_id: (await supabase.auth.getUser()).data.user?.id,
          p_priority: 'high'
        });

        if (notificationError) {
          console.error('Error sending notification:', notificationError);
          // Don't block navigation if notification fails
        }
      }
      
      console.log('Starting waste collection process');
      
      setIsNavigating(true);
      startLocationTracking();
      
      // Simulate arrival after 10 seconds for testing purposes
      const timer = setTimeout(() => {
        console.log('Timer-based arrival triggered');
        setHasArrived(true);
        setIsNavigating(false);
        stopLocationTracking();
        
        // Clear the timer
        if (arrivalTimer) {
          clearTimeout(arrivalTimer);
          setArrivalTimer(null);
        }
        
        Alert.alert(
          '🎯 Destination Reached!',
          'You have arrived at the pickup location. Ready to collect waste.',
          [{ text: 'OK' }]
        );
      }, 10000); // 10 seconds
      
      setArrivalTimer(timer);
      
      Alert.alert(
        '🚀 Navigation Started!',
        'Turn-by-turn navigation is now active. Your location will be shared with the customer in real-time.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error starting navigation:', error);
      Alert.alert('Error', 'Failed to start navigation. Please try again.');
    }
  };

  const handleStopNavigation = () => {
    Alert.alert(
      'Stop Navigation',
      'Are you sure you want to stop navigation?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: () => {
            setIsNavigating(false);
            stopLocationTracking();
          }
        }
      ]
    );
  };

  const handleCancelNavigation = () => {
    Alert.alert(
      'Cancel Navigation',
      'Are you sure you want to cancel the navigation?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: () => {
            setIsNavigating(false);
            stopLocationTracking();
            router.back();
          }
        }
      ]
    );
  };

  const handleCallUser = () => {
    if (!navigationData) return;
    
    try {
      Linking.openURL(`tel:${navigationData.customerPhone}`);
    } catch {
      Alert.alert('Error', 'Unable to open phone dialer. Please try calling manually: ' + navigationData.customerPhone);
    }
  };

  const handleTextUser = () => {
    if (!navigationData) return;
    
    router.push({
      pathname: '/recycler-screens/RecyclerTextUserScreen' as any,
      params: {
        requestId: requestId,
        customerId: navigationData.customerId,
        customerName: navigationData.customerName,
        customerPhone: navigationData.customerPhone,
        pickup: navigationData.pickupAddress
      }
    });
  };

  const handleCancelRide = async () => {
    Alert.alert(
      'Cancel Ride',
      'Are you sure you want to cancel this pickup request? This will notify the customer.',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              // This mock function does nothing, as there's no backend API
              console.log('Ride cancelled');
              Alert.alert(
                'Ride Cancelled',
                'The pickup request has been cancelled. You will be redirected to the requests screen.',
                [
                  {
                    text: 'OK',
                    onPress: () => router.back()
                  }
                ]
              );
            } catch (error) {
              console.error('Error cancelling ride:', error);
              Alert.alert('Error', 'Failed to cancel ride. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleCalculate = () => {
    if (!navigationData) return;
    
    // Navigate to weight entry screen with all necessary parameters
    router.push({
      pathname: '/recycler-screens/RecyclerWeightEntry' as any,
      params: {
        requestId: requestId,
        userName: navigationData.customerName,
        pickup: navigationData.pickupAddress
      }
    });
  };

  if (!navigationData) {
    return (
      <View style={styles.container}>
        <AppHeader 
          leftIcon="arrow-left"
          rightIcon="truck"
          onLeftPress={() => router.back()}
          onRightPress={() => router.push('/recycler-screens/RecyclerRequests' as any)}
          notificationCount={notificationCount}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading navigation data...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader 
        leftIcon="arrow-left"
        rightIcon="truck"
        onLeftPress={() => router.back()}
        onRightPress={() => router.push('/recycler-screens/RecyclerRequests' as any)}
        notificationCount={notificationCount}
      />
      
      <ScrollView style={styles.content}>
        {/* Arrival Notification */}
        {hasArrived && (
          <View style={styles.arrivalNotification}>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>🎯 You have arrived at your destination!</Text>
              <Text style={styles.notificationText}>Ready to collect waste from {navigationData.customerName}</Text>
              <TouchableOpacity style={styles.calculateButton} onPress={handleCalculate}>
                <Text style={styles.calculateButtonText}>⚖️ Calculate Weight</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Debug Info - Remove in production */}
        <View style={styles.debugInfo}>
          <Text style={styles.debugText}>Debug: hasArrived = {hasArrived.toString()}</Text>
          <Text style={styles.debugText}>Debug: isNavigating = {isNavigating.toString()}</Text>
        </View>

        {/* Route Information Card */}
        <View style={styles.routeInfoCard}>
          <View style={styles.routeHeader}>
            <MaterialIcons name="navigation" size={24} color={COLORS.darkGreen} />
            <Text style={styles.routeTitle}>Route to Pickup</Text>
          </View>
          
          <View style={styles.routeDetails}>
            <View style={styles.detailRow}>
              <MaterialIcons name="person" size={20} color={COLORS.gray} />
              <Text style={styles.detailText}>{navigationData.customerName}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="location-on" size={20} color={COLORS.gray} />
              <Text style={styles.detailText}>{navigationData.pickupAddress}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="phone" size={20} color={COLORS.gray} />
              <Text style={styles.detailText}>{navigationData.customerPhone}</Text>
            </View>
          </View>
          
          <View style={styles.routeStats}>
            <View style={styles.statItem}>
              <MaterialIcons name="directions-car" size={20} color={COLORS.darkGreen} />
              <Text style={styles.statValue}>
                {isNavigating ? `${distanceToDestination.toFixed(1)} km` : `${navigationData.estimatedDistance} km`}
              </Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="access-time" size={20} color={COLORS.darkGreen} />
              <Text style={styles.statValue}>
                {isNavigating ? `${etaToDestination} min` : `${navigationData.estimatedTime} min`}
              </Text>
              <Text style={styles.statLabel}>ETA</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="category" size={20} color={COLORS.darkGreen} />
              <Text style={styles.statValue}>{navigationData.wasteType}</Text>
              <Text style={styles.statLabel}>Waste Type</Text>
            </View>
          </View>
          
          {/* Movement Status Indicator */}
          {isNavigating && (
            <View style={styles.movementIndicator}>
              <View style={styles.movementIcon}>
                <MaterialIcons 
                  name={isMoving ? "local-shipping" : "pause-circle-filled"} 
                  size={24} 
                  color={isMoving ? COLORS.green : COLORS.orange} 
                />
              </View>
              <View style={styles.movementInfo}>
                <Text style={styles.movementStatus}>
                  {isMoving ? '🚛 You are moving towards pickup location' : '⏸️ You are currently stopped'}
                </Text>
                {isMoving && movementSpeed > 0 && (
                  <Text style={styles.movementSpeed}>
                    Speed: {movementSpeed.toFixed(1)} km/h
                  </Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* Route Steps Section */}
        {routeInfo && routeSteps.length > 0 && (
          <View style={styles.routeStepsCard}>
            <View style={styles.routeStepsHeader}>
              <MaterialIcons name="directions" size={24} color={COLORS.darkGreen} />
              <Text style={styles.routeStepsTitle}>Turn-by-Turn Directions</Text>
              <TouchableOpacity 
                style={styles.toggleStepsButton}
                onPress={() => setShowRouteSteps(!showRouteSteps)}
              >
                <MaterialIcons 
                  name={showRouteSteps ? "expand-less" : "expand-more"} 
                  size={24} 
                  color={COLORS.darkGreen} 
                />
              </TouchableOpacity>
            </View>
            
            {showRouteSteps && (
              <View style={styles.routeStepsList}>
                {routeSteps.slice(0, 5).map((step, index) => (
                  <View key={index} style={styles.routeStep}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <View style={styles.stepContent}>
                      <Text style={styles.stepInstruction}>{step.instruction}</Text>
                      <View style={styles.stepDetails}>
                        <Text style={styles.stepDistance}>{step.distance}</Text>
                        <Text style={styles.stepDuration}>{step.duration}</Text>
                      </View>
                    </View>
                  </View>
                ))}
                {routeSteps.length > 5 && (
                  <Text style={styles.moreStepsText}>
                    +{routeSteps.length - 5} more steps
                  </Text>
                )}
              </View>
            )}
          </View>
        )}

        {/* Live Navigation Map */}
        <View style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>
              {isNavigating ? '🔴 Live Navigation' : '🗺️ Route Preview'}
            </Text>
            <Text style={styles.mapSubtitle}>
              {isCalculatingRoute 
                ? 'Calculating shortest route...'
                : isNavigating 
                ? `Real-time tracking • ${distanceToDestination.toFixed(1)} km remaining${isMoving ? ` • Moving at ${movementSpeed.toFixed(1)} km/h` : ' • Stopped'}`
                : routeInfo 
                ? `Shortest route calculated • ${routeInfo.distance} • ${routeInfo.duration}`
                : 'Tap Start Navigation to begin live tracking'
              }
            </Text>
          </View>
          
          <MapComponent
            markers={[
              {
                id: 'current',
                coordinate: currentLocation,
                title: 'Your Location',
                description: isMoving 
                  ? `Moving towards pickup at ${movementSpeed.toFixed(1)} km/h`
                  : 'Recycler current position',
                type: 'recycler',
                isMoving: isMoving && isNavigating,
              },
              {
                id: 'destination',
                coordinate: destinationLocation,
                title: 'Pickup Location',
                description: navigationData.pickupAddress,
                type: 'destination',
              },
            ]}
            route={{
              coordinates: routeCoordinates.length > 0 ? routeCoordinates : [currentLocation, destinationLocation],
              color: COLORS.darkGreen,
            }}
            style={styles.navigationMap}
            showUserLocation={true}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!hasArrived ? (
            <>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleCallUser}
              >
                <Text style={styles.actionButtonText}>📞 Call</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleTextUser}
              >
                <Text style={styles.actionButtonText}>💬 Text</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleCancelRide}
              >
                <Text style={styles.cancelButtonText}>❌ Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.calculateWeightButton} 
                onPress={handleCalculate}
              >
                <Text style={styles.calculateWeightButtonText}>⚖️ Calculate Weight</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleTextUser}
              >
                <Text style={styles.actionButtonText}>💬 Text</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleCallUser}
              >
                <Text style={styles.actionButtonText}>📞 Call</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Navigation Controls */}
        <View style={styles.navigationControls}>
          <View style={styles.navigationButtonsRow}>
            {!isNavigating ? (
              <TouchableOpacity 
                style={[styles.navButton, styles.startNavButton]}
                onPress={handleStartNavigation}
              >
                <MaterialIcons name="play-arrow" size={20} color={COLORS.white} />
                <Text style={styles.startNavButtonText}>Start Navigation</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.navButton, styles.stopNavButton]}
                onPress={handleStopNavigation}
              >
                <MaterialIcons name="stop" size={20} color={COLORS.white} />
                <Text style={styles.stopNavButtonText}>Stop Navigation</Text>
              </TouchableOpacity>
            )}
            
            {/* Manual Arrival Confirmation Button */}
            {!hasArrived && (
              <TouchableOpacity 
                style={[styles.navButton, styles.manualArrivalButton]}
                onPress={async () => {
                  console.log('Manual arrival confirmation triggered');
                  
                  try {
                    // Trigger the same arrival detection logic as automatic system
                    await handleManualArrival();
                  } catch (error) {
                    console.error('Error in manual arrival confirmation:', error);
                    Alert.alert(
                      'Error',
                      'Failed to confirm arrival. Please try again or contact support.',
                      [{ text: 'OK' }]
                    );
                  }
                }}
              >
                <MaterialIcons name="location-on" size={20} color={COLORS.white} />
                <Text style={styles.manualArrivalButtonText}>I've Arrived</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Location Status */}
        <View style={styles.locationStatus}>
          <MaterialIcons 
            name={locationPermission ? "location-on" : "location-off"} 
            size={16} 
            color={locationPermission ? COLORS.darkGreen : COLORS.red} 
          />
          <Text style={[styles.locationStatusText, { color: locationPermission ? COLORS.darkGreen : COLORS.red }]}>
            {locationPermission 
              ? (isLocationTracking ? 'Live tracking active' : 'Location ready')
              : 'Location permission required'
            }
          </Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  routeInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginLeft: 8,
  },
  routeDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.black,
    marginLeft: 8,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  mapContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  mapHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  mapSubtitle: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  mockMap: {
    height: 300,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    margin: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  mapPlaceholder: {
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginTop: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  routeIndicator: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentLocation: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.darkGreen,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeLine: {
    flex: 1,
    height: 3,
    backgroundColor: COLORS.darkGreen,
    marginHorizontal: 8,
  },
  destinationLocation: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.darkGreen,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
    gap: 6,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 0,
    backgroundColor: COLORS.darkGreen,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 36,
  },
  callButton: {
    backgroundColor: COLORS.darkGreen,
  },
  textButton: {
    backgroundColor: COLORS.primary,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
    letterSpacing: 0.2,
  },
  navigationControls: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  navigationButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 6,
  },
  startNavButton: {
    backgroundColor: COLORS.darkGreen,
  },
  stopNavButton: {
    backgroundColor: COLORS.lightRed,
  },
  startNavButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  stopNavButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelRideContainer: {
    marginBottom: 16,
  },
  cancelRideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightRed,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelRideButtonText: {
    color: COLORS.darkGreen,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  arrivalNotification: {
    backgroundColor: '#F2FFE5',
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  notificationContent: {
    padding: 20,
    alignItems: 'center',
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 8,
    textAlign: 'center',
  },
  notificationText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  calculateButton: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 16,
    paddingHorizontal: 32,
    paddingVertical: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  calculateButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  navigationMap: {
    height: 300,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.gray,
    fontStyle: 'italic',
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  locationStatusText: {
    marginLeft: 8,
    fontSize: 14,
  },
  calculateWeightButton: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calculateWeightButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  manualArrivalButton: {
    backgroundColor: COLORS.primary,
  },
  manualArrivalButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  debugInfo: {
    backgroundColor: COLORS.lightGray,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  debugText: {
    fontSize: 12,
    color: COLORS.gray,
    fontFamily: 'monospace',
  },
  
  // Movement indicator styles
  movementIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.green,
  },
  movementIcon: {
    marginRight: 12,
  },
  movementInfo: {
    flex: 1,
  },
  movementStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.darkGreen,
    marginBottom: 2,
  },
  movementSpeed: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  
  // Route steps styles
  routeStepsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  routeStepsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeStepsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginLeft: 8,
    flex: 1,
  },
  toggleStepsButton: {
    padding: 4,
  },
  routeStepsList: {
    marginTop: 8,
  },
  routeStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.darkGreen,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepContent: {
    flex: 1,
  },
  stepInstruction: {
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 20,
    marginBottom: 4,
  },
  stepDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDistance: {
    fontSize: 12,
    color: COLORS.gray,
    marginRight: 12,
  },
  stepDuration: {
    fontSize: 12,
    color: COLORS.gray,
  },
  moreStepsText: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  cancelButton: {
    backgroundColor: COLORS.red,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
}); 