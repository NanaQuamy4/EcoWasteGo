import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import MapComponent from '../../components/MapComponent';
import { COLORS } from '../../constants';
import { supabase } from '../../lib/supabase';

// ===== MOCK DATA FOR TRACKING SCREEN =====
// This replaces the backend API calls with local mock data
// In a real app, this would come from a database or real-time tracking service

// Mock waste collection data for tracking
const mockWasteCollection = {
  id: "req_001",
  customer_id: "user_001",
  recycler_id: "user_002",
  waste_type: "Mixed Waste",
  weight: 8,
  pickup_address: "123 Main Street, Accra Central",
  special_instructions: "Please call before arrival",
  status: "in_progress",
  created_at: "2024-01-15T10:30:00Z",
  accepted_at: "2024-01-15T10:32:00Z",
  started_at: "2024-01-15T10:40:00Z",
  estimated_completion: "2024-01-15T11:00:00Z"
};

// Mock recycler location data
const mockRecyclerLocation = {
  latitude: 6.6734,
  longitude: -1.5714,
  heading: 45, // Direction in degrees
  speed: 25, // km/h
  lastUpdated: new Date().toISOString()
};

// Mock customer location data
const mockCustomerLocation = {
  latitude: 6.6834,
  longitude: -1.5814,
  address: "123 Main Street, Accra Central"
};

// Mock tracking updates
const mockTrackingUpdates = [
  {
    id: "update_001",
    type: "location",
    message: "Recycler is 2.3 km away",
    timestamp: "2024-01-15T10:42:00Z",
    icon: "location-on"
  },
  {
    id: "update_002",
    type: "status", 
    message: "Recycler started journey to pickup location",
    timestamp: "2024-01-15T10:40:00Z",
    icon: "directions-car"
  },
  {
    id: "update_003",
    type: "eta",
    message: "Estimated arrival: 8 minutes",
    timestamp: "2024-01-15T10:43:00Z",
    icon: "access-time"
  }
];

export default function TrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    requestId?: string;
    recyclerName?: string;
    pickup?: string;
  }>();

  // ===== LOCAL STATE MANAGEMENT =====
  // These state variables manage the UI state and tracking data
  const [wasteCollection, setWasteCollection] = useState<any>(null);
  const [recyclerLocation, setRecyclerLocation] = useState<any>(null);
  const [customerLocation, setCustomerLocation] = useState<any>(null);
  const [trackingUpdates, setTrackingUpdates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [distance, setDistance] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('in_progress');
  
  // Add missing variables that were removed during refactoring
  const [showPopup, setShowPopup] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [hasReachedDestination, setHasReachedDestination] = useState(false);
  const [isTrackingActive, setIsTrackingActive] = useState(true);
  const [hasArrived, setHasArrived] = useState(false);
  const [isWeightCalculation, setIsWeightCalculation] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState<any>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [locationInput, setLocationInput] = useState('');
  const [showPaymentButton, setShowPaymentButton] = useState(false);
  const [distanceToCustomer, setDistanceToCustomer] = useState(2.3);
  const [etaToCustomer, setEtaToCustomer] = useState(8);
  const [isTruckMoving, setIsTruckMoving] = useState(false);
  const [movementSpeed, setMovementSpeed] = useState(0);
  
  // Add missing handler functions
  const handlePopupOK = () => {
    setShowPopup(false);
  };
  
  const handleCall = () => {
    // Mock call functionality
    Alert.alert('Call', 'Calling recycler...');
  };
  
  const handleText = () => {
    // Navigate to text recycler screen with recycler info
    router.push({
      pathname: '/customer-screens/TextRecyclerScreen',
      params: {
        requestId: trackingData?.requestId || 'req_001',
        recyclerName: trackingData?.recyclerName || 'GreenFleet GH',
        recyclerPhone: '+233241234567', // Mock phone number
        pickup: trackingData?.pickupAddress || '123 Main Street, Accra Central'
      }
    });
  };
  
  const handleCancel = () => {
    Alert.alert('Cancel Pickup', 'Are you sure you want to cancel this pickup?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: () => router.back() }
    ]);
  };
  
  const handleCheckPaymentDue = () => {
    // Mock payment check
    setIsLoadingPayment(true);
    setTimeout(() => {
      setIsLoadingPayment(false);
      setPaymentSummary({
        totalAmount: 20.00,
        wasteType: 'Mixed Waste',
        weight: 8
      });
    }, 1000);
  };

  // ===== DATABASE ARRIVAL DETECTION =====
  // Check arrival status from database
  const checkArrivalStatus = useCallback(async () => {
    if (!params.requestId) return;
    
    try {
      // Get arrival status from database
      const { data, error } = await supabase.rpc('get_customer_arrival_status', {
        p_customer_id: params.requestId // This should be customer ID, not request ID
      });
      
      if (error) {
        console.error('Error checking arrival status:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const arrivalData = data[0];
        
        // Update arrival status if recycler has arrived
        if (arrivalData.is_arrived && !hasArrived) {
          setHasArrived(true);
          setHasReachedDestination(true);
          setIsTrackingActive(false);
          setCurrentStatus('arrived');
          
          console.log('🎯 Recycler has arrived at pickup location!');
          
          // Show arrival notification
          Alert.alert(
            '🎯 Recycler Has Arrived!',
            'Your recycler is now at your location and ready to collect waste.',
            [
              {
                text: 'OK',
                onPress: () => console.log('User acknowledged recycler arrival')
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error in arrival status check:', error);
    }
  }, [params.requestId, hasArrived]);

  // Load real tracking data from database
  const loadTrackingData = useCallback(async () => {
    if (!params.requestId) return;
    
    try {
      console.log('📋 Loading tracking data for request:', params.requestId);
      
      // Get pickup request with recycler details
      const { data: requestData, error: requestError } = await supabase
        .from('pickup_requests')
        .select(`
          id,
          customer_id,
          recycler_id,
          pickup_address,
          pickup_latitude,
          pickup_longitude,
          status,
          created_at,
          customers!inner(
            id,
            full_name,
            phone
          ),
          recyclers!inner(
            id,
            full_name,
            phone,
            latitude,
            longitude
          )
        `)
        .eq('id', params.requestId)
        .single();
      
      if (requestError) {
        console.error('Error loading tracking data:', requestError);
        return;
      }
      
      if (requestData) {
        // Update tracking data with real data
        setTrackingData({
          requestId: requestData.id,
          customerName: requestData.customers[0]?.full_name || 'Customer',
          customerPhone: requestData.customers[0]?.phone || 'Unknown',
          recyclerName: requestData.recyclers[0]?.full_name || 'Recycler',
          recyclerPhone: requestData.recyclers[0]?.phone || 'Unknown',
          pickupAddress: requestData.pickup_address,
          status: requestData.status
        });
        
        // Update customer location with real coordinates
        if (requestData.pickup_latitude && requestData.pickup_longitude) {
          setCustomerLocation({
            latitude: requestData.pickup_latitude,
            longitude: requestData.pickup_longitude,
            address: requestData.pickup_address
          });
        }
        
        // Update recycler location with real coordinates
        if (requestData.recyclers[0]?.latitude && requestData.recyclers[0]?.longitude) {
          setRecyclerLocation({
            latitude: requestData.recyclers[0].latitude,
            longitude: requestData.recyclers[0].longitude,
            heading: 45,
            speed: 25,
            lastUpdated: new Date().toISOString()
          });
        }
        
        console.log('✅ Tracking data loaded successfully');
      }
    } catch (error) {
      console.error('Error loading tracking data:', error);
    }
  }, [params.requestId]);

  // ===== EFFECTS =====
  // Load tracking data and check arrival status
  useEffect(() => {
    loadTrackingData();
  }, [loadTrackingData]);

  // Check arrival status every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkArrivalStatus();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [checkArrivalStatus]);

  // Real-time recycler location updates with movement tracking
  const updateRecyclerLocation = useCallback(async () => {
    if (!wasteCollection?.recycler_id) return;
    
    try {
      const { data: recyclerData, error } = await supabase
        .from('recyclers')
        .select('latitude, longitude, heartbeat_at')
        .eq('id', wasteCollection.recycler_id)
        .single();

      if (error) {
        console.error('Error fetching recycler location:', error);
        return;
      }

      if (recyclerData?.latitude && recyclerData?.longitude) {
        // Store previous location for movement calculation
        const previousLocation = recyclerLocation;
        
        setRecyclerLocation({
          latitude: recyclerData.latitude,
          longitude: recyclerData.longitude,
          lastUpdated: recyclerData.heartbeat_at
        });

        // Calculate distance and ETA
        if (customerLocation) {
          const distance = calculateDistance(
            recyclerData.latitude,
            recyclerData.longitude,
            customerLocation.latitude,
            customerLocation.longitude
          );
          setDistance(distance);
          setEtaToCustomer(Math.round(distance * 2)); // Rough estimate: 2 minutes per km
          
          // Calculate movement direction and speed if we have previous location
          if (previousLocation) {
            const movementDistance = calculateDistance(
              previousLocation.latitude,
              previousLocation.longitude,
              recyclerData.latitude,
              recyclerData.longitude
            );
            
            // Update movement status
            if (movementDistance > 0.001) { // 1 meter threshold
              setIsTruckMoving(true);
              // Calculate speed in km/h (distance moved in 5 seconds * 720)
              const speed = movementDistance * 720;
              setMovementSpeed(speed);
              console.log('🚛 Truck is moving! Distance moved:', movementDistance.toFixed(3), 'km, Speed:', speed.toFixed(1), 'km/h');
            } else {
              setIsTruckMoving(false);
              setMovementSpeed(0);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error updating recycler location:', error);
    }
  }, [wasteCollection?.recycler_id, customerLocation, recyclerLocation]);

  // ===== LOCATION CALCULATION FUNCTIONS =====
  // These functions calculate distance and ETA
  
  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Calculate distance and ETA
  const calculateDistanceAndETA = useCallback(() => {
    if (recyclerLocation && customerLocation) {
      const calculatedDistance = calculateDistance(
        recyclerLocation.latitude,
        recyclerLocation.longitude,
        customerLocation.latitude,
        customerLocation.longitude
      );
      
      setDistance(calculatedDistance);
      
      // Estimate time based on distance and speed
      const estimatedMinutes = Math.round((calculatedDistance / recyclerLocation.speed) * 60);
      setEstimatedTime(estimatedMinutes);
    }
  }, [recyclerLocation, customerLocation]);

  // ===== SIMULATION FUNCTIONS =====
  // These functions simulate real-time updates
  
  // Add new tracking update
  const addTrackingUpdate = useCallback((type: string, message: string, icon?: string) => {
    const newUpdate = {
      id: `update_${Date.now()}`,
      type,
      message,
      timestamp: new Date().toISOString(),
      icon: icon || 'info'
    };
    
    setTrackingUpdates(prev => [newUpdate, ...prev]);
  }, []);

  // Simulate recycler movement towards customer
  const simulateRecyclerMovement = useCallback(() => {
    if (recyclerLocation && customerLocation) {
      // Move recycler closer to customer (simplified linear interpolation)
      const progress = Math.min(timeElapsed / 600, 1); // Complete journey in 10 minutes
      
      const newLat = recyclerLocation.latitude + (customerLocation.latitude - recyclerLocation.latitude) * progress;
      const newLon = recyclerLocation.longitude + (customerLocation.longitude - recyclerLocation.longitude) * progress;
      
      const newLocation = {
        ...recyclerLocation,
        latitude: newLat,
        longitude: newLon,
        lastUpdated: new Date().toISOString()
      };
      
      setRecyclerLocation(newLocation);
      calculateDistanceAndETA();
      
      // Check if recycler has arrived
      if (progress >= 0.95) {
        setCurrentStatus('arrived');
        addTrackingUpdate('arrival', 'Recycler has arrived at your location!');
      }
    }
  }, [recyclerLocation, customerLocation, timeElapsed, addTrackingUpdate, calculateDistanceAndETA]);

  // Simulate new tracking updates
  const simulateTrackingUpdates = useCallback(() => {
    const updateTypes = [
      { type: 'location', message: 'Recycler is getting closer', icon: 'my-location' },
      { type: 'status', message: 'Making good progress', icon: 'trending-up' },
      { type: 'eta', message: `Updated ETA: ${Math.max(estimatedTime - 2, 1)} minutes`, icon: 'access-time' }
    ];
    
    const randomUpdate = updateTypes[Math.floor(Math.random() * updateTypes.length)];
    addTrackingUpdate(randomUpdate.type, randomUpdate.message, randomUpdate.icon);
  }, [estimatedTime, addTrackingUpdate]);

  // ===== TRACKING SIMULATION =====
  // This simulates real-time tracking updates
  const startTracking = useCallback(() => {
    // Timer for elapsed time
    const timeInterval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Simulate recycler movement every 10 seconds
    const trackingInterval = setInterval(() => {
      simulateRecyclerMovement();
    }, 10000);

    // Simulate new tracking updates every 30 seconds
    const updateInterval = setInterval(() => {
      simulateTrackingUpdates();
    }, 30000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(trackingInterval);
      clearInterval(updateInterval);
    };
  }, [simulateRecyclerMovement, simulateTrackingUpdates]); // Include the simulation functions

  // ===== MOCK DATA LOADING FUNCTION =====
  // This replaces the backend API call to fetch tracking data
  // It loads data from our mock data arrays
  const loadMockData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Load mock waste collection data
      setWasteCollection(mockWasteCollection);
      
      // Load mock location data
      setRecyclerLocation(mockRecyclerLocation);
      setCustomerLocation(mockCustomerLocation);
      
      // Load mock tracking updates
      setTrackingUpdates([...mockTrackingUpdates]);
      
      // Set tracking data with recycler info from params
      setTrackingData({
        recyclerName: params.recyclerName || 'GreenFleet GH',
        pickupAddress: params.pickup || '123 Main Street, Accra Central',
        wasteType: mockWasteCollection.waste_type,
        weight: mockWasteCollection.weight,
        status: mockWasteCollection.status
      });
      
      // Calculate initial distance and ETA
      calculateDistanceAndETA();
      
      console.log('TrackingScreen: Mock data loaded successfully');
    } catch (error) {
      console.error('TrackingScreen: Error loading mock data:', error);
      // Fallback to default mock data
      setWasteCollection(mockWasteCollection);
      setRecyclerLocation(mockRecyclerLocation);
      setCustomerLocation(mockCustomerLocation);
      setTrackingUpdates(mockTrackingUpdates);
    } finally {
      setIsLoading(false);
    }
  }, [params.recyclerName, params.pickup, calculateDistanceAndETA]);

  // ===== INITIALIZATION EFFECT =====
  // This effect runs when the component first loads
  useEffect(() => {
    loadTrackingData();
  }, [loadTrackingData]);

  // Real-time location updates - Enhanced for better truck movement visibility
  useEffect(() => {
    if (!wasteCollection?.recycler_id) return;

    // Update recycler location every 5 seconds for smoother movement
    const locationInterval = setInterval(() => {
      updateRecyclerLocation();
    }, 5000);

    return () => clearInterval(locationInterval);
  }, [wasteCollection?.recycler_id, updateRecyclerLocation]);

  // Simulate recycler arriving after some time
  useEffect(() => {
    const arrivalTimer = setTimeout(() => {
      setHasArrived(true);
      setHasReachedDestination(true);
      setIsTrackingActive(false);
      setCurrentStatus('arrived');
      
      // Show arrival notification alert
      Alert.alert(
        '🎯 Recycler Has Arrived!',
        'Your recycler is now at your location and ready to collect waste.',
        [
          {
            text: 'OK',
            onPress: () => console.log('User acknowledged recycler arrival')
          }
        ]
      );
    }, 10000); // 10 seconds delay
    
    return () => clearTimeout(arrivalTimer);
  }, []);

  // Clear arrival timer when navigating away
  useEffect(() => {
    return () => {
      // This will clear any pending timers when component unmounts
      // or when navigating to PaymentSummary
    };
  }, []);

  // ===== ACTION HANDLERS =====
  // These functions handle user actions
  
  // Cancel the pickup
  const handleCancelPickup = () => {
    Alert.alert(
      'Cancel Pickup',
      'Are you sure you want to cancel this pickup?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Simulate API call delay
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // Update mock data status
              if (wasteCollection) {
                wasteCollection.status = 'cancelled';
                setWasteCollection({ ...wasteCollection });
              }
              
              setCurrentStatus('cancelled');
              addTrackingUpdate('cancelled', 'Pickup cancelled by customer', 'cancel');
              
              Alert.alert(
                'Pickup Cancelled',
                'Your pickup has been cancelled successfully.',
                [
                  {
                    text: 'OK',
                    onPress: () => router.back()
                  }
                ]
              );
            } catch (error) {
              console.error('Error cancelling pickup:', error);
              Alert.alert('Error', 'Failed to cancel pickup. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Contact recycler
  const handleContactRecycler = () => {
    Alert.alert(
      'Contact Recycler',
      'Call the recycler?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => {
            // In a real app, this would use Linking to make a phone call
            console.log('Calling recycler');
            Alert.alert('Call Recycler', 'Phone call functionality would be implemented here.');
          }
        }
      ]
    );
  };

  // ===== UTILITY FUNCTIONS =====
  // Format time display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // ===== UI RENDER FUNCTIONS =====
  // These functions render different parts of the UI
  
  // Render tracking update item
  const renderTrackingUpdate = (update: any) => (
    <View key={update.id} style={styles.updateItem}>
      <MaterialIcons 
        name={update.icon as any} 
        size={20} 
        color={COLORS.darkGreen} 
        style={styles.updateIcon} 
      />
      <View style={styles.updateContent}>
        <Text style={styles.updateMessage}>{update.message}</Text>
        <Text style={styles.updateTime}>
          {new Date(update.timestamp).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </Text>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading tracking information...</Text>
      </View>
    );
  }

  if (!wasteCollection || !recyclerLocation || !customerLocation || !trackingData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load tracking data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadMockData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
              <AppHeader />
      
      <View style={styles.content}>
        {/* Arrival Notification Modal */}
        <Modal
          visible={showPopup}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🎉 Recycler Has Arrived!</Text>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.modalText}>
                  {trackingData?.recyclerName || 'Your recycler'} has reached your location and is ready to collect your waste.
                </Text>
                <Text style={styles.modalSubtext}>
                  Please prepare your waste for pickup. The recycler will collect it from your specified location.
                </Text>
                
                {/* Additional arrival information */}
                <View style={styles.arrivalInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>📍 Location:</Text>
                    <Text style={styles.infoValue}>{trackingData?.pickupAddress}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>🗑️ Waste Type:</Text>
                    <Text style={styles.infoValue}>{trackingData?.wasteType} • {trackingData?.weight}kg</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>⏰ Time:</Text>
                    <Text style={styles.infoValue}>{new Date().toLocaleTimeString()}</Text>
                  </View>
                </View>
                
                <Text style={styles.modalInstructions}>
                  💡 Tip: Have your waste ready and accessible for quick collection.
                </Text>
              </View>
              <TouchableOpacity style={styles.modalButton} onPress={handlePopupOK}>
                <Text style={styles.modalButtonText}>Got It!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Live Tracking Map */}
          <View style={styles.mapContainer}>
            <View style={styles.mapHeader}>
              <Text style={styles.mapTitle}>
                {hasReachedDestination 
                  ? '🎯 Recycler Has Arrived!' 
                  : isTrackingActive 
                  ? '🚚 Live Tracking' 
                  : '📍 Pickup Location'
                }
              </Text>
              <Text style={styles.mapSubtitle}>
                {hasReachedDestination
                  ? 'Ready for waste collection • Navigation completed'
                  : isTrackingActive 
                  ? `${trackingData?.recyclerName || 'Recycler'} is on the way • ${distanceToCustomer.toFixed(1)} km away${isTruckMoving ? ` • Moving at ${movementSpeed.toFixed(1)} km/h` : ' • Stopped'}`
                  : 'Recycler location will appear here'
                }
              </Text>
            </View>
            
            {/* Movement Status Indicator */}
            {isTrackingActive && !hasReachedDestination && (
              <View style={styles.movementIndicator}>
                <View style={styles.movementIcon}>
                  <MaterialIcons 
                    name={isTruckMoving ? "local-shipping" : "pause-circle-filled"} 
                    size={24} 
                    color={isTruckMoving ? COLORS.green : COLORS.orange} 
                  />
                </View>
                <View style={styles.movementInfo}>
                  <Text style={styles.movementStatus}>
                    {isTruckMoving ? '🚛 Truck is moving towards you' : '⏸️ Truck is currently stopped'}
                  </Text>
                  {isTruckMoving && movementSpeed > 0 && (
                    <Text style={styles.movementSpeed}>
                      Speed: {movementSpeed.toFixed(1)} km/h
                    </Text>
                  )}
                </View>
              </View>
            )}
            
            {/* Debug Info */}
            <View style={styles.debugInfo}>
              <Text style={styles.debugText}>
                Recycler: {recyclerLocation ? `${recyclerLocation.latitude.toFixed(4)}, ${recyclerLocation.longitude.toFixed(4)}` : 'Loading...'}
              </Text>
              <Text style={styles.debugText}>
                Customer: {customerLocation ? `${customerLocation.latitude.toFixed(4)}, ${customerLocation.longitude.toFixed(4)}` : 'Loading...'}
              </Text>
            </View>
            
            <View style={styles.mapWrapper}>
              {recyclerLocation && customerLocation ? (
                <MapComponent
                  markers={[
                    {
                      id: 'recycler',
                      coordinate: recyclerLocation,
                      title: hasReachedDestination 
                        ? `${trackingData?.recyclerName || 'Recycler'} - Arrived!` 
                        : trackingData?.recyclerName || 'Recycler',
                      description: hasReachedDestination 
                        ? 'Ready to collect waste' 
                        : isTruckMoving 
                        ? `Moving towards you at ${movementSpeed.toFixed(1)} km/h`
                        : 'Recycler current location',
                      type: 'recycler',
                      isMoving: isTruckMoving && !hasReachedDestination,
                    },
                    {
                      id: 'destination',
                      coordinate: customerLocation,
                      title: 'Your Location',
                      description: customerLocation.address,
                      type: 'destination',
                    },
                  ]}
                  route={{
                    coordinates: [recyclerLocation, customerLocation],
                    color: hasReachedDestination ? COLORS.green : COLORS.darkGreen,
                  }}
                  style={{ flex: 1 }}
                  showUserLocation={true}
                />
              ) : (
                <View style={styles.mapFallback}>
                  <Text style={styles.mapFallbackText}>Loading map...</Text>
                  <Text style={styles.mapFallbackSubtext}>Please wait while we get your location</Text>
                </View>
              )}
            </View>
            
            {/* Arrival Indicator Overlay */}
            {hasReachedDestination && (
              <View style={styles.arrivalOverlay}>
                <View style={styles.arrivalBadge}>
                  <Text style={styles.arrivalBadgeText}>🎯 ARRIVED</Text>
                </View>
              </View>
            )}
          </View>

                  {/* Action Buttons - Below Map */}
        <View style={styles.actionButtonsContainer}>
          {/* First Row: Call, Text, Cancel */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleCall}
            >
              <Text style={styles.actionButtonText}>📞 Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={handleText}
            >
              <Text style={styles.actionButtonText}>💬 Text</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Feather name="x-circle" size={20} color={COLORS.white} />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          {/* Second Row: Check Payment (only when recycler arrives) */}
          {hasArrived && (
            <View style={styles.checkPaymentRow}>
              <TouchableOpacity 
                style={[
                  styles.checkPaymentButton, 
                  paymentSummary && styles.checkPaymentButtonActive
                ]} 
                onPress={() => router.push('/customer-screens/PaymentSummary')}
                disabled={isLoadingPayment}
              >
                {isLoadingPayment ? (
                  <Text style={styles.checkPaymentButtonText}>⏳ Checking...</Text>
                ) : paymentSummary ? (
                  <>
                    <Feather name="credit-card" size={20} color="#1C3301" />
                    <Text style={styles.checkPaymentButtonText}>💰 Payment Ready!</Text>
                  </>
                ) : (
                  <>
                    <Feather name="credit-card" size={20} color="#1C3301" />
                    <Text style={styles.checkPaymentButtonText}>💰 Check Payment</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
          


          {/* Payment Status Indicator */}
          {hasArrived && (
            <View style={styles.paymentStatusContainer}>
              <Text style={styles.paymentStatusText}>
                {paymentSummary 
                  ? '✅ Payment Summary Ready' 
                  : '⏳ Waiting for Payment Summary'
                }
              </Text>
              {paymentSummary && (
                <Text style={styles.paymentAmountText}>
                  Total Due: {paymentSummary.totalAmount}
                </Text>
              )}
            </View>
          )}
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/customer-screens/HomeScreen')}>
            <Feather name="home" size={28} color="#22330B" />
            <Text style={styles.navLabel}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/customer-screens/history')}>
            <Feather name="rotate-ccw" size={28} color="#22330B" />
            <Text style={styles.navLabel}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/user')}>
            <Feather name="user" size={28} color="#22330B" />
            <Text style={styles.navLabel}>User</Text>
          </TouchableOpacity>
        </View>

        {/* Payment Button (shown after arrival) */}
        {showPaymentButton && (
          <TouchableOpacity 
            style={styles.paymentButton}
            onPress={handleCheckPaymentDue}
          >
            <Feather name="credit-card" size={20} color={COLORS.white} />
            <Text style={styles.paymentButtonText}>Check Payment Due</Text>
          </TouchableOpacity>
        )}


      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGreen,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingText: {
    color: COLORS.darkGreen,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
     mapContainer: {
     backgroundColor: COLORS.lightGreen,
     borderRadius: 20,
     shadowColor: COLORS.black,
     shadowOpacity: 0.1,
     shadowRadius: 8,
     elevation: 5,
     minHeight: 500,
     marginBottom: 20,
   },
  mapHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  mapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 8,
    textAlign: 'center',
  },
  mapSubtitle: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  trackingMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  trackingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  trackingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginLeft: 10,
  },
  trackingDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    color: COLORS.secondary,
    marginLeft: 10,
  },
  trackingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 15,
    gap: 8,
  },
  actionButtonsContainer: {
    marginTop: 30,
    marginBottom: 15,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  checkPaymentRow: {
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C3301',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
    marginHorizontal: 4,
  },
  callButton: {
    backgroundColor: '#1C3301',
  },
  textButton: {
    backgroundColor: '#1C3301',
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 10,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flex: 1,
    marginHorizontal: 4,
  },
  cancelButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 10,
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 10,
    marginBottom: 10,
  },
  paymentButtonText: {
    color: '#1C3301',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 10,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGreen,
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.darkGreen,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 30,
    marginHorizontal: 40,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
  },
  modalBody: {
    marginBottom: 25,
  },
  modalText: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtext: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#1C3301',
    borderRadius: 15,
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  arrivalInfo: {
    marginTop: 15,
    marginBottom: 15,
    width: '100%',
    paddingHorizontal: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.darkGreen,
    fontWeight: 'bold',
  },
  modalInstructions: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 10,
  },
  arrivalOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
    zIndex: 1,
  },
  arrivalBadge: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  arrivalBadgeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  weightCalculationInfo: {
    marginTop: 15,
    marginBottom: 15,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    alignItems: 'center',
  },
  weightCalculationText: {
    fontSize: 16,
    color: COLORS.darkGreen,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  weightCalculationSubtext: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  checkPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 10,
    marginBottom: 10,
  },
  checkPaymentButtonActive: {
    backgroundColor: '#FFD700',
  },
  checkPaymentButtonText: {
    color: '#1C3301',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 10,
  },
  paymentStatusContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  paymentStatusText: {
    fontSize: 14,
    color: COLORS.darkGreen,
    fontWeight: '500',
  },
  paymentAmountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginTop: 5,
  },
  // Add missing styles that were referenced but not defined
  updateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  updateIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
    color: COLORS.darkGreen,
  },
  updateContent: {
    flex: 1,
  },
  updateMessage: {
    fontSize: 14,
    color: COLORS.darkGreen,
    marginBottom: 4,
  },
  updateTime: {
    fontSize: 12,
    color: COLORS.gray,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 20,
  },
  errorText: {
    color: COLORS.darkGreen,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.lightGreen,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  
     mapWrapper: {
     flex: 1,
     minHeight: 450,
   },
  mapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  mapFallbackText: {
    color: COLORS.darkGreen,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
     mapFallbackSubtext: {
     fontSize: 14,
     color: COLORS.secondary,
     textAlign: 'center',
   },
   
   // Debug styles
   debugInfo: {
     backgroundColor: 'rgba(0,0,0,0.7)',
     borderRadius: 8,
     padding: 8,
     marginBottom: 10,
   },
     debugText: {
    color: COLORS.white,
    fontSize: 12,
    marginBottom: 4,
  },
  
  // Scroll container styles
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  // Bottom Navigation styles
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: '#E3F0D5',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    color: '#22330B',
    fontSize: 13,
    marginTop: 2,
    fontWeight: 'bold',
  },
  
  // Movement indicator styles
  movementIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
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
}); 