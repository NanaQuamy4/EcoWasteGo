import { FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import DrawerMenu from '../../components/DrawerMenu';
import MapComponent from '../../components/MapComponent';
import { COLORS } from '../../constants';
// import { useAutoOfflineManager } from '../../hooks/useAutoOfflineManager'; // Disabled - recycler has manual control
import { useNotificationCountSimple as useNotificationCount } from '../../hooks/useNotificationCountSimple';
import { useRecyclerHeartbeat } from '../../hooks/useRecyclerHeartbeat';
import { useCurrentRecyclerStatus } from '../../hooks/useRecyclerOnlineStatus';
import { useRecyclerVerification } from '../../hooks/useRecyclerVerification';
import { supabase } from '../../lib/supabase';

// ===== REAL DATA INTERFACES =====
interface PickupRequest {
  id: string;
  customer_id: string;
  recycler_id: string | null;
  pickup_address: string;
  waste_type: string;
  weight: number;
  status: 'pending' | 'confirmed' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  special_instructions?: string;
}

interface RecyclerStats {
  totalRequests: number;
  activePickups: number;
  todayEarnings: number;
  totalEarnings: number;
}

export default function RecyclerHomeTab() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [requests, setRequests] = useState(0);
  const [recyclerStats, setRecyclerStats] = useState<RecyclerStats>({
    totalRequests: 0,
    activePickups: 0,
    todayEarnings: 0,
    totalEarnings: 0
  });
  const [mapMarkers, setMapMarkers] = useState<Array<{
    id: string;
    coordinate: { latitude: number; longitude: number };
    title: string;
    description: string;
    type: 'pickup' | 'recycler' | 'destination';
  }>>([]);

  // Use real data hooks
  const {
    verificationData,
    isLoading: isLoadingVerification,
    error: verificationError,
    isVerified,
    verificationStatus,
    refreshVerification
  } = useRecyclerVerification();

  const { notificationCount, loading: notificationLoading } = useNotificationCount();
  
  // New online status tracking
  const { status: onlineStatus, loading: statusLoading, refetch: refetchStatus } = useCurrentRecyclerStatus();
  
  // Force refresh status when component mounts or when verification changes
  useEffect(() => {
    if (isVerified && verificationData?.id) {
      // Force refresh the status after a short delay to ensure database is updated
      const refreshTimer = setTimeout(() => {
        console.log('Force refreshing recycler status...');
        refetchStatus();
      }, 1000);
      
      return () => clearTimeout(refreshTimer);
    }
  }, [isVerified, verificationData?.id, refetchStatus]);
  const { startHeartbeat, stopHeartbeat, setOffline, getStatus } = useRecyclerHeartbeat();
  
  // Auto-offline manager disabled - recycler has full manual control
  // useAutoOfflineManager();

  // Create recycler object from real data
  const recycler = {
    name: verificationData?.full_name || 'Recycler',
    email: verificationData?.email || '',
    phone: verificationData?.phone || '',
    status: verificationStatus || 'unverified',
    type: 'recycler' as const,
    totalPickups: isVerified ? 156 : 0, // TODO: Fetch real pickup count
    totalEarnings: isVerified ? '₵2,450.80' : '₵0.00', // TODO: Fetch real earnings
    memberSince: verificationData?.created_at ? new Date(verificationData.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Unknown',
  };

  // Fetch real pickup requests and stats
  const fetchRecyclerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found in fetchRecyclerData');
        return;
      }
      
      console.log('Fetching recycler data for user:', user.id);

      // Fetch pickup requests for this recycler
      const { data: pickupRequests, error: requestsError } = await supabase
        .from('pickup_requests')
        .select('*')
        .eq('recycler_id', user.id)
        .in('status', ['pending', 'confirmed', 'accepted', 'in_progress'])
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching pickup requests:', requestsError);
      } else {
        const requestCount = pickupRequests?.length || 0;
        console.log('Fetched pickup requests:', requestCount, 'requests');
        console.log('Request details:', pickupRequests);
        setRequests(requestCount);
      }

      // Fetch recycler stats (mock for now - would need actual tables)
      const stats: RecyclerStats = {
        totalRequests: pickupRequests?.length || 0,
        activePickups: pickupRequests?.filter(r => r.status === 'in_progress').length || 0,
        todayEarnings: 45.80, // TODO: Calculate from actual earnings
        totalEarnings: 2450.80 // TODO: Calculate from actual earnings
      };
      setRecyclerStats(stats);

    } catch (error) {
      console.error('Error fetching recycler data:', error);
    }
  };

  // Update counts from real data
  useEffect(() => {
    if (isVerified && verificationData?.id) {
      console.log('Recycler verified, fetching data...');
      fetchRecyclerData();
      
      // Update counts every 30 seconds
      const interval = setInterval(fetchRecyclerData, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isVerified, verificationData?.id]);

  // Debug log for requests state changes
  useEffect(() => {
    console.log('Requests state updated:', requests);
  }, [requests]);

  // Check for subscription payment requirement (disabled for now)
  // useEffect(() => {
  //   // TODO: Implement subscription check when subscription system is ready
  // }, []);

  // Start heartbeat when verified
  useEffect(() => {
    if (isVerified && verificationData?.id) {
      startHeartbeat();
    } else {
      stopHeartbeat();
    }
  }, [isVerified, verificationData?.id, startHeartbeat, stopHeartbeat]);

  const handleOfflineToggle = async () => {
    // Don't allow toggle if not verified
    if (!isVerified) {
      Alert.alert(
        'Verification Required',
        'You need to complete your registration before you can change your online status.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (!onlineStatus) return;

    const newOnlineStatus = !onlineStatus.isOnline;
    
    console.log('Toggle clicked - Current status:', onlineStatus);
    console.log('Toggle clicked - New status:', { isOnline: newOnlineStatus });
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (newOnlineStatus) {
        // Going online - check pending requests first
        const { data: pendingRequests, error: requestsError } = await supabase
          .from('pickup_requests')
          .select('id')
          .eq('recycler_id', user.id)
          .in('status', ['pending', 'confirmed', 'accepted', 'in_progress']);

        if (requestsError) {
          console.error('Error checking pending requests:', requestsError);
          Alert.alert('Error', 'Failed to check your request status. Please try again.');
          return;
        }

        const pendingCount = pendingRequests?.length || 0;
        const shouldBeAvailable = pendingCount < 5; // Available if less than 5 pending requests
        
        console.log(`Going online - Pending requests: ${pendingCount}, Will be available: ${shouldBeAvailable}`);
        
        // Get current location with better error handling
        let currentLocation = null;
        try {
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status === 'granted') {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 5000,
              distanceInterval: 10,
            });
            currentLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude
            };
            console.log('Current location obtained:', currentLocation);
          } else {
            console.log('Location permission denied, using default location');
            // Use default Kumasi location as fallback
            currentLocation = {
              latitude: 6.6885,
              longitude: -1.6244
            };
          }
        } catch (locationError) {
          console.error('Error getting location:', locationError);
          console.log('Using default location as fallback');
          // Use default Kumasi location as fallback
          currentLocation = {
            latitude: 6.6885,
            longitude: -1.6244
          };
        }

        // Start heartbeat and set online status with location
        startHeartbeat();
        const updateData: any = { 
          is_online: true,
          is_available: shouldBeAvailable, // Set availability based on pending requests
          last_seen_at: new Date().toISOString()
        };

        // Add location if available
        if (currentLocation) {
          updateData.latitude = currentLocation.latitude;
          updateData.longitude = currentLocation.longitude;
        }

        const { error } = await supabase
          .from('recyclers')
          .update(updateData)
          .eq('id', user.id);

        if (error) {
          console.error('Error going online:', error);
          Alert.alert('Error', 'Failed to go online. Please try again.');
          return;
        }
        
        console.log('Successfully went online');
        
        // Show appropriate message based on availability
        const statusMessage = shouldBeAvailable 
          ? 'online and available for new requests'
          : `online but busy (${pendingCount} pending requests) - you'll be available when you complete some requests`;
        
        Alert.alert(
          'Status Updated',
          `You are now ${statusMessage}.`,
          [{ text: 'OK' }]
        );
      } else {
        // Going offline - stop heartbeat and set as unavailable
        stopHeartbeat();
        setOffline();
        const { error } = await supabase
          .from('recyclers')
          .update({ 
            is_online: false,
            is_available: false,
            session_id: null
          })
          .eq('id', user.id);

        if (error) {
          console.error('Error going offline:', error);
          Alert.alert('Error', 'Failed to go offline. Please try again.');
          return;
        }
        
        console.log('Successfully went offline');
        Alert.alert(
          'Status Updated',
          'You are now offline and not available for pickup requests.',
          [{ text: 'OK' }]
        );
      }
      
      // Refresh the status to get the latest data
      setTimeout(() => {
        refetchStatus();
      }, 500);
      
    } catch (error) {
      console.error('Error updating online status:', error);
      Alert.alert('Error', 'Failed to update online status. Please try again.');
    }
  };

  const handleRequestsPress = () => {
    router.push('/recycler-screens/RecyclerRequests' as any);
  };

  const handleNotificationPress = () => {
    // Navigate to notifications screen
    router.push('/recycler-screens/RecyclerNotificationScreen' as any);
  };

  // Generate mock pickup requests for map
  const generateMockPickups = () => {
    if (isVerified && requests > 0) {
      const mockPickups = [];
      for (let i = 0; i < Math.min(requests, 5); i++) {
        mockPickups.push({
          id: `pickup-${i}`,
          coordinate: {
            latitude: 6.6734 + (Math.random() - 0.5) * 0.01, // Ghana coordinates with random offset
            longitude: -1.5714 + (Math.random() - 0.5) * 0.01,
          },
          title: `Pickup Request #${i + 1}`,
          description: `Waste pickup request - ${Math.floor(Math.random() * 50) + 10}kg`,
          type: 'pickup' as const,
        });
      }
      setMapMarkers(mockPickups);
    } else {
      setMapMarkers([]);
    }
  };

  // Update map markers when requests change
  useEffect(() => {
    generateMockPickups();
  }, [requests, isVerified]);

  // Show loading state while fetching verification data
  if (isLoadingVerification) {
    return (
      <View style={styles.container}>
        <AppHeader 
          onMenuPress={() => setDrawerOpen(true)} 
          onNotificationPress={handleNotificationPress}
          notificationCount={0}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading recycler data...</Text>
        </View>
      </View>
    );
  }

  // Show error state if verification failed
  if (verificationError) {
    return (
      <View style={styles.container}>
        <AppHeader 
          onMenuPress={() => setDrawerOpen(true)} 
          onNotificationPress={handleNotificationPress}
          notificationCount={0}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading data: {verificationError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refreshVerification}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader 
        onMenuPress={() => setDrawerOpen(true)} 
        onNotificationPress={handleNotificationPress}
        notificationCount={notificationCount}
      />
      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      
      {/* Verification Prompt for Unverified Recyclers */}
      {!isVerified && (
        <View style={styles.verificationPrompt}>
          <View style={styles.verificationPromptHeader}>
            <MaterialIcons name="warning" size={24} color={COLORS.orange} />
            <Text style={styles.verificationPromptTitle}>Complete Registration Required</Text>
          </View>
          <Text style={styles.verificationPromptText}>
            You need to complete your registration to start receiving pickup requests and earning money.
          </Text>
          <TouchableOpacity 
            style={styles.verificationPromptButton}
            onPress={() => router.push('/recycler-screens/RecyclerRegistrationScreen' as any)}
          >
            <MaterialIcons name="assignment" size={20} color={COLORS.white} />
            <Text style={styles.verificationPromptButtonText}>Complete Registration</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Status Bar with Requests and Offline Toggle */}
      <View style={styles.statusBar}>
        <TouchableOpacity style={styles.statusItem} onPress={handleRequestsPress}>
          <View style={styles.statusIconContainer}>
            <FontAwesome5 name="truck" size={20} color={COLORS.darkGreen} />
            {requests > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{requests}</Text>
              </View>
            )}
            {/* Debug: Always show badge for testing */}
            {__DEV__ && (
              <View style={[styles.badge, { backgroundColor: 'blue' }]}>
                <Text style={styles.badgeText}>{requests}</Text>
              </View>
            )}
          </View>
          <Text style={styles.statusText}>Requests</Text>
        </TouchableOpacity>

        <View style={styles.offlineContainer}>
          <View style={styles.statusIndicatorRow}>
            <View style={[
              styles.statusDot, 
              !onlineStatus?.isOnline && styles.statusDotOffline, 
              !isVerified && styles.statusDotDisabled
            ]} />
            <Text style={[
              styles.offlineText, 
              !onlineStatus?.isOnline && styles.offlineTextActive, 
              !isVerified && styles.offlineTextDisabled
            ]}>
              {!onlineStatus ? 'Loading...' : onlineStatus.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          <TouchableOpacity 
            style={[
              styles.toggle, 
              onlineStatus?.isOnline && styles.toggleActive, 
              !isVerified && styles.toggleDisabled
            ]} 
            onPress={isVerified ? handleOfflineToggle : undefined}
            disabled={!isVerified || !onlineStatus}
          >
            <View style={[
              styles.toggleThumb, 
              onlineStatus?.isOnline && styles.toggleThumbActive, 
              !isVerified && styles.toggleThumbDisabled
            ]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <View style={styles.mapHeader}>
          <Text style={styles.mapTitle}>Recycler Dashboard</Text>
          <Text style={styles.mapSubtitle}>
            {isVerified ? `Track your ${requests} pickup requests` : 'Complete registration to see pickup requests'}
          </Text>
          {onlineStatus && (
            <View style={styles.statusInfo}>
              <Text style={styles.statusInfoText}>
                {onlineStatus.isOnline ? '🟢 Connected' : '🔴 Disconnected'} • 
                {onlineStatus.isAvailable ? ' Available' : ' Busy'} • 
                Last seen: {onlineStatus.lastSeenAt ? new Date(onlineStatus.lastSeenAt).toLocaleTimeString() : 'Never'}
              </Text>
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={() => {
                  console.log('Manual refresh triggered');
                  refetchStatus();
                }}
              >
                <Text style={styles.refreshButtonText}>🔄 Refresh Status</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <MapComponent
          markers={mapMarkers}
          showUserLocation={true}
          onMarkerPress={(markerId) => {
            Alert.alert(
              'Pickup Request',
              `You selected pickup request: ${markerId}`,
              [
                { text: 'Accept', onPress: () => console.log('Accepted pickup:', markerId) },
                { text: 'Cancel', style: 'cancel' }
              ]
            );
          }}
          style={styles.mapComponent}
        />
      </View>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{requests}</Text>
          <Text style={styles.statLabel}>Available Requests</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{recyclerStats.activePickups}</Text>
          <Text style={styles.statLabel}>Active Pickups</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>₵{recyclerStats.todayEarnings.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Today&apos;s Earnings</Text>
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
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.lightGreen,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  statusItem: {
    alignItems: 'center',
    marginRight: 40,
  },
  statusIconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#f44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  offlineContainer: {
    alignItems: 'center',
    marginLeft: 'auto',
  },
  offlineText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 4,
  },
  offlineTextActive: {
    color: COLORS.gray,
  },
  offlineTextDisabled: {
    color: '#b0b0b0',
  },
  toggle: {
    width: 40,
    height: 20,
    backgroundColor: '#ccc',
    borderRadius: 10,
    padding: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.darkGreen,
  },
  toggleDisabled: {
    backgroundColor: '#e0e0e0',
    opacity: 0.6,
  },
  toggleThumb: {
    width: 16,
    height: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  toggleThumbDisabled: {
    backgroundColor: '#f0f0f0',
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  mapComponent: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapHeader: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 8,
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.lightGreen,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 4,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.darkGreen,
    marginRight: 8,
  },
  statusDotOffline: {
    backgroundColor: COLORS.gray,
  },
  statusDotDisabled: {
    backgroundColor: '#e0e0e0',
  },
  verificationPrompt: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  verificationPromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  verificationPromptTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.orange,
    marginLeft: 8,
  },
  verificationPromptText: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 16,
  },
  verificationPromptButton: {
    backgroundColor: COLORS.darkGreen,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  verificationPromptButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.darkGreen,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.orange,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.darkGreen,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusInfo: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 6,
  },
  statusInfoText: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginTop: 4,
    alignSelf: 'center',
  },
  refreshButtonText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
});