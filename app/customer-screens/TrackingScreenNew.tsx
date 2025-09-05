import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapComponent from '../../components/MapComponent';
import { COLORS } from '../../constants';
import { supabase } from '../../lib/supabase';

export default function TrackingScreenNew() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    requestId?: string;
    recyclerName?: string;
    pickup?: string;
  }>();

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [recyclerLocation, setRecyclerLocation] = useState<any>(null);
  const [customerLocation, setCustomerLocation] = useState<any>(null);
  const [hasReachedDestination, setHasReachedDestination] = useState(false);

  // Load tracking data
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
          waste_type,
          waste_quantity,
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
        setIsLoading(false);
        return;
      }
      
      if (requestData) {
        // Update tracking data with real data
        setTrackingData({
          requestId: requestData.id,
          customerName: (requestData.customers as any)?.full_name || 'Customer',
          customerPhone: (requestData.customers as any)?.phone || 'Unknown',
          recyclerName: (requestData.recyclers as any)?.full_name || 'Recycler',
          recyclerPhone: (requestData.recyclers as any)?.phone || 'Unknown',
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
        if ((requestData.recyclers as any)?.latitude && (requestData.recyclers as any)?.longitude) {
          setRecyclerLocation({
            latitude: (requestData.recyclers as any).latitude,
            longitude: (requestData.recyclers as any).longitude,
            heading: 45,
            speed: 25,
            lastUpdated: new Date().toISOString()
          });
        }
        
        setIsLoading(false);
        console.log('✅ Tracking data loaded successfully');
      }
    } catch (error) {
      console.error('Error loading tracking data:', error);
      setIsLoading(false);
    }
  }, [params.requestId]);

  // Check arrival status
  const checkArrivalStatus = useCallback(async () => {
    if (!params.requestId) return;
    
    try {
      // First get the customer ID from the request
      const { data: requestData, error: requestError } = await supabase
        .from('pickup_requests')
        .select('customer_id')
        .eq('id', params.requestId)
        .single();
      
      if (requestError || !requestData) {
        console.error('Error getting customer ID from request:', requestError);
        return;
      }
      
      // Get arrival status from database using customer ID
      const { data, error } = await supabase.rpc('get_customer_arrival_status', {
        p_customer_id: requestData.customer_id
      });
      
      if (error) {
        console.error('Error checking arrival status:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const arrivalData = data[0];
        
        // Update arrival status if recycler has arrived
        if (arrivalData.is_arrived && !hasReachedDestination) {
          setHasReachedDestination(true);
          console.log('🎯 Recycler has arrived at pickup location!');
        }
      }
    } catch (error) {
      console.error('Error in arrival status check:', error);
    }
  }, [params.requestId, hasReachedDestination]);

  // Load tracking data on mount
  useEffect(() => {
    loadTrackingData();
  }, [loadTrackingData]);

  // Check arrival status every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkArrivalStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [checkArrivalStatus]);

  // Action handlers
  const handleCall = () => {
    Alert.alert('Call', 'Calling recycler...');
  };
  
  const handleText = () => {
    router.push({
      pathname: '/customer-screens/TextRecyclerScreen',
      params: {
        requestId: trackingData?.requestId || 'req_001',
        recyclerName: trackingData?.recyclerName || 'GreenFleet GH',
        recyclerPhone: '+233241234567',
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading tracking information...</Text>
      </View>
    );
  }

  if (!trackingData || !recyclerLocation || !customerLocation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load tracking data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadTrackingData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Feather name="menu" size={24} color="#666" />
        </TouchableOpacity>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <MaterialIcons name="local-shipping" size={20} color="white" />
          </View>
          <View style={styles.logoText}>
            <Text style={styles.logoTitle}>EcoWasteGo</Text>
            <Text style={styles.logoSubtitle}>One Tap to a Greener Planet</Text>
          </View>
        </View>
      </View>

      {/* Track Your Recycler Card */}
      <View style={styles.trackCard}>
        <Text style={styles.trackCardText}>Track Your Recycler</Text>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <MapComponent
          markers={[
            {
              id: 'recycler',
              coordinate: recyclerLocation,
              title: trackingData?.recyclerName || 'Recycler',
              description: trackingData?.status === 'in_progress' 
                ? 'Moving towards you' 
                : 'Preparing to start navigation',
              type: 'recycler',
              isMoving: trackingData?.status === 'in_progress',
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
            color: COLORS.darkGreen,
          }}
          style={{ flex: 1 }}
          showUserLocation={true}
        />
      </View>

      {/* Bottom Status Card */}
      <View style={styles.bottomCard}>
        <View style={styles.statusRow}>
          <Text style={styles.statusText}>
            {hasReachedDestination 
              ? 'Recycler has arrived!' 
              : 'Recycler is on his way'
            }
          </Text>
          <View style={styles.truckIcon}>
            <MaterialIcons name="local-shipping" size={32} color="#4CAF50" />
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
            <Feather name="phone" size={16} color="#666" />
            <Text style={styles.actionButtonText}>Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleText}>
            <Feather name="message-circle" size={16} color="#666" />
            <Text style={styles.actionButtonText}>Text</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleCancel}>
            <Text style={styles.actionButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={[styles.navItem, styles.activeNavItem]} onPress={() => router.push('/customer-screens/HomeScreen')}>
          <Feather name="home" size={24} color="#4CAF50" />
          <Text style={[styles.navLabel, styles.activeNavLabel]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/customer-screens/history')}>
          <Feather name="clock" size={24} color="#666" />
          <Text style={styles.navLabel}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/user')}>
          <Feather name="user" size={24} color="#666" />
          <Text style={styles.navLabel}>User</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    flex: 1,
  },
  logoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  logoSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  // Track card styles
  trackCard: {
    backgroundColor: '#E8F5E8',
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  trackCardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  // Map container styles
  mapContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  // Bottom card styles
  bottomCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 10,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  truckIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    fontWeight: '500',
  },
  // Bottom navigation styles
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  activeNavItem: {
    // Active state styling
  },
  navLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontWeight: '500',
  },
  activeNavLabel: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
});
