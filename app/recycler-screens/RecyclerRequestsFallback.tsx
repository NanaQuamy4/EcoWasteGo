// Fallback version of RecyclerRequests that works without customers table
// Copy this content to RecyclerRequests.tsx if you want to use it without the customers table

import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { COLORS } from '../../constants';
import { supabase } from '../../lib/supabase';

// Simple distance calculation utility (placeholder - in real app would use actual GPS coordinates)
const calculateDistance = (location: string): string => {
  // This is a placeholder - in a real app, you would:
  // 1. Get the recycler's current GPS coordinates
  // 2. Get the customer's GPS coordinates from their address
  // 3. Use Haversine formula to calculate actual distance
  
  // For now, return a random distance between 0.5 and 5 km
  const distance = (Math.random() * 4.5 + 0.5).toFixed(1);
  return `${distance} km`;
};

interface PickupRequest {
  id: string;
  customer_id: string;
  recycler_id: string | null;
  pickup_address: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  pickup_notes?: string;
  waste_type: string;
  waste_quantity: string;
  estimated_weight?: number;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  preferred_pickup_date?: string;
  preferred_pickup_time?: string;
  estimated_price?: number;
  final_price?: number;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  pickup_started_at?: string;
  pickup_completed_at?: string;
  customer_rating?: number;
  customer_feedback?: string;
  recycler_notes?: string;
  created_at: string;
  updated_at: string;
  
  // Computed fields for UI
  userName?: string;
  phone?: string;
  distance?: string;
  isNew?: boolean;
}

export default function RecyclerRequests() {
  const params = useLocalSearchParams();
  
  // ===== LOCAL STATE MANAGEMENT =====
  const [notificationCount, setNotificationCount] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [acceptedRequests, setAcceptedRequests] = useState<Set<string>>(new Set());
  const [completedRequests, setCompletedRequests] = useState<Set<string>>(new Set());
  const [pickupRequests, setPickupRequests] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRequestCount, setLastRequestCount] = useState(0);
  
  // Animation for new request indicator
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const [hasNewRequests, setHasNewRequests] = useState(false);

  // ===== REAL DATA LOADING FUNCTION =====
  const loadPickupRequests = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error getting user:', userError);
        setLoading(false);
        return;
      }

      // Fetch pickup requests that are pending or assigned to this recycler
      // Using simple select without joins
      const { data: requests, error } = await supabase
        .from('pickup_requests')
        .select('*')
        .or(`status.eq.pending,recycler_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pickup requests:', error);
        Alert.alert('Error', 'Failed to load pickup requests. Please try again.');
        setLoading(false);
        return;
      }

      // Transform the data with placeholder customer information
      const transformedRequests: PickupRequest[] = (requests || []).map(request => ({
        ...request,
        userName: `Customer ${request.customer_id.slice(0, 8)}`, // Use first 8 chars of customer ID
        phone: '+233 XX XXX XXXX', // Placeholder phone
        distance: calculateDistance(request.pickup_address),
        isNew: new Date(request.created_at) > new Date(Date.now() - 5 * 60 * 1000)
      }));

      setPickupRequests(transformedRequests);
      setLastRequestCount(transformedRequests.length);
      
      // Check for new requests
      const newRequests = transformedRequests.filter(req => req.isNew);
      setHasNewRequests(newRequests.length > 0);
      
      console.log('Loaded pickup requests:', transformedRequests.length);
    } catch (error) {
      console.error('Error loading pickup requests:', error);
      Alert.alert('Error', 'Failed to load pickup requests. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ===== INITIALIZATION EFFECT =====
  useEffect(() => {
    loadPickupRequests();
  }, [loadPickupRequests]);

  // ===== REAL-TIME SUBSCRIPTION EFFECT =====
  useEffect(() => {
    const channel = supabase
      .channel('pickup_requests_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pickup_requests'
        },
        (payload) => {
          console.log('Pickup request change detected:', payload);
          
          // Reload data when there are changes
          loadPickupRequests();
          
          // Vibrate for new requests
          if (payload.eventType === 'INSERT') {
            Vibration.vibrate(500);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadPickupRequests]);

  // ===== ANIMATION EFFECT =====
  useEffect(() => {
    if (hasNewRequests) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [hasNewRequests, pulseAnimation]);

  // ===== REFRESH HANDLER =====
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadPickupRequests();
    setRefreshing(false);
  };

  // ===== REQUEST ACTION HANDLERS =====
  const handleAcceptRequest = async (requestId: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert('Error', 'Please log in to accept requests.');
        return;
      }

      const { error } = await supabase
        .from('pickup_requests')
        .update({
          status: 'accepted',
          recycler_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error accepting request:', error);
        Alert.alert('Error', 'Failed to accept request. Please try again.');
        return;
      }

      setAcceptedRequests(prev => new Set(prev).add(requestId));
      
      const request = pickupRequests.find(r => r.id === requestId);
      Alert.alert(
        "Request Accepted!",
        `You've accepted the pickup request from ${request?.userName || 'Customer'}. Navigate to start pickup.`,
        [
          {
            text: "Navigate",
            onPress: () => {
              router.push({
                pathname: '/recycler-screens/RecyclerNavigation',
                params: { requestId }
              });
            }
          },
          { text: "Later", style: "cancel" }
        ]
      );
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept request. Please try again.');
    }
  };

  const handleCompleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('pickup_requests')
        .update({
          status: 'completed',
          pickup_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error completing request:', error);
        Alert.alert('Error', 'Failed to complete request. Please try again.');
        return;
      }

      setCompletedRequests(prev => new Set(prev).add(requestId));
      
      const request = pickupRequests.find(r => r.id === requestId);
      Alert.alert(
        "Pickup Completed!",
        `Great job! You've completed the pickup for ${request?.userName || 'Customer'}.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error('Error completing request:', error);
      Alert.alert('Error', 'Failed to complete request. Please try again.');
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('pickup_requests')
        .update({
          status: 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) {
        console.error('Error rejecting request:', error);
        Alert.alert('Error', 'Failed to reject request. Please try again.');
        return;
      }

      const request = pickupRequests.find(r => r.id === requestId);
      Alert.alert(
        "Request Rejected",
        `You've rejected the pickup request from ${request?.userName || 'Customer'}.`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', 'Failed to reject request. Please try again.');
    }
  };

  // ===== FILTERING LOGIC =====
  const getFilteredRequests = () => {
    const activeRequests = pickupRequests.filter(req => req.status !== 'cancelled' && req.status !== 'rejected');
    
    switch (selectedFilter) {
      case 'pending':
        return activeRequests.filter(req => req.status === 'pending');
      case 'accepted':
        return activeRequests.filter(req => req.status === 'accepted');
      case 'in_progress':
        return activeRequests.filter(req => req.status === 'in_progress');
      case 'completed':
        return activeRequests.filter(req => req.status === 'completed');
      default:
        return activeRequests;
    }
  };

  // ===== RENDER FUNCTIONS =====
  const renderRequestItem = (request: PickupRequest) => {
    const isAccepted = acceptedRequests.has(request.id);
    const isCompleted = completedRequests.has(request.id);
    const isNew = request.isNew;

    return (
      <View key={request.id} style={[styles.requestCard, isNew && styles.newRequestCard]}>
        {/* Request Header */}
        <View style={styles.requestHeader}>
          <View style={styles.userInfo}>
            <View style={styles.userIconContainer}>
              <MaterialIcons name="person" size={20} color={COLORS.gray} />
            </View>
            <Text style={styles.userName}>{request.userName}</Text>
          </View>
        </View>

        {/* Request Details */}
        <View style={styles.requestDetails}>
          <View style={styles.detailRow}>
            <MaterialIcons name="location-on" size={16} color={COLORS.gray} />
            <Text style={styles.detailText}>{request.pickup_address}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="phone" size={16} color={COLORS.gray} />
            <Text style={styles.detailText}>{request.phone}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="recycling" size={16} color={COLORS.gray} />
            <Text style={styles.detailText}>{request.waste_type} • {request.waste_quantity}</Text>
          </View>
          {request.estimated_weight && (
            <View style={styles.detailRow}>
              <MaterialIcons name="scale" size={16} color={COLORS.gray} />
              <Text style={styles.detailText}>~{request.estimated_weight}kg</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {request.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleAcceptRequest(request.id)}
              >
                <Text style={styles.actionButtonText}>Accept</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleCancelRequest(request.id)}
              >
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>
            </>
          )}

          {(request.status === 'accepted' || request.status === 'in_progress') && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => handleCompleteRequest(request.id)}
              >
                <Text style={styles.actionButtonText}>Complete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.routeButton]}
                onPress={() => {
                  router.push({
                    pathname: '/recycler-screens/RecyclerNavigation',
                    params: { requestId: request.id }
                  });
                }}
              >
                <Text style={styles.actionButtonText}>Route</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading pickup requests...</Text>
          <Text style={styles.loadingSubtext}>Fetching from server...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.customHeader}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(recycler-tabs)')}>
            <Ionicons name="arrow-back" size={24} color={COLORS.darkGreen} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Image 
              source={require('../../assets/images/logo landscape.png')} 
              style={styles.logoLandscape} 
            />
          </View>
        </View>
      </View>
      
      {/* Pickups Banner */}
      <View style={styles.pickupsBanner}>
        <TouchableOpacity style={styles.pickupsButton}>
          <Text style={styles.pickupsButtonText}>Pickups</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'all' && styles.filterButtonTextActive]}>
            All Pickups
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'pending' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('pending')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'pending' && styles.filterButtonTextActive]}>
            Active Pickups
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'completed' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('completed')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'completed' && styles.filterButtonTextActive]}>
            Completed Pickups
          </Text>
        </TouchableOpacity>
      </View>

      {/* Pickup Requests */}
      <ScrollView 
        style={styles.requestsContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {getFilteredRequests().length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {selectedFilter === 'all' 
                ? 'No pickup requests available at the moment'
                : selectedFilter === 'pending'
                ? 'No pending pickup requests'
                : 'No completed pickup requests'
              }
            </Text>
            {selectedFilter === 'all' && (
              <Text style={styles.emptyStateSubtext}>
                New requests will appear here automatically
              </Text>
            )}
          </View>
        ) : (
          getFilteredRequests().map(request => renderRequestItem(request))
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(recycler-tabs)')}>
          <Ionicons name="home" size={24} color={COLORS.darkGreen} />
          <Text style={styles.tabLabel}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(recycler-tabs)/history')}>
          <Ionicons name="time" size={24} color={COLORS.gray} />
          <Text style={styles.tabLabel}>History</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => router.push('/(recycler-tabs)/user')}>
          <Ionicons name="person" size={24} color={COLORS.gray} />
          <Text style={styles.tabLabel}>User</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Styles remain the same as the original file
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  customHeader: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E3E3E3',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLandscape: {
    width: 200,
    height: 70,
    resizeMode: 'contain',
  },
  pickupsBanner: {
    backgroundColor: COLORS.lightGreen,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  pickupsButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  pickupsButtonText: {
    color: COLORS.darkGreen,
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 10,
  },
  filterButton: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.darkGreen,
  },
  filterButtonText: {
    color: COLORS.darkGreen,
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  requestsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  newRequestCard: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  userIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.lightGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  requestDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.darkGreen,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  acceptButton: {
    backgroundColor: COLORS.darkGreen,
  },
  rejectButton: {
    backgroundColor: COLORS.red,
  },
  completeButton: {
    backgroundColor: COLORS.darkGreen,
  },
  routeButton: {
    backgroundColor: COLORS.darkGreen,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 18,
    color: COLORS.darkGreen,
  },
  loadingSubtext: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 18,
    color: COLORS.gray,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E3E3E3',
    paddingBottom: 5,
    paddingTop: 5,
    height: 60,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginTop: 2,
  },
});
