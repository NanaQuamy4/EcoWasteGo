import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import { COLORS } from '../../constants';
import { WasteCollection } from '../../constants/api';
import { apiService } from '../../services/apiService';

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
  userName: string;
  location: string;
  phone: string;
  wasteType: string;
  distance: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  createdAt: string;
  customer_id: string;
  recycler_id?: string;
  waste_type: string;
  pickup_address: string;
  special_instructions?: string;
  isNew?: boolean; // Track if this is a new request
}

// Extended interface for API response
interface WasteCollectionWithCustomer extends WasteCollection {
  customers?: {
    id: string;
    username: string;
    phone: string;
    address?: string;
  };
  recyclers?: {
    id: string;
    username: string;
    phone: string;
  };
}

export default function RecyclerRequests() {
  const params = useLocalSearchParams();
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

  // Initialize component state
  useEffect(() => {
    // Fetch initial data
    fetchPickupRequests();
  }, []);

  // Real-time notification polling
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetchPickupRequests();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, []);

  // Animate new request indicator
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
    } else {
      pulseAnimation.setValue(1);
    }
  }, [hasNewRequests, pulseAnimation]);

  // Fetch pickup requests from API
  const fetchPickupRequests = async () => {
    try {
      setLoading(true);
      console.log('🔄 Attempting to fetch pickup requests...');
      
      const response = await apiService.getWasteCollectionsForRecycler();
      
      if (response.success && response.data && Array.isArray(response.data)) {
        console.log('✅ Successfully fetched', response.data.length, 'pickup requests');
        
        // Transform the API response to match our interface
        const transformedRequests: PickupRequest[] = response.data.map(collection => ({
          id: collection.id,
          userName: collection.customer?.username || 'Unknown Customer',
          location: collection.pickup_address || 'Location not specified',
          phone: collection.customer?.phone || 'Contact customer',
          wasteType: collection.waste_type || 'Mixed',
          distance: calculateDistance(collection.pickup_address || ''),
          status: collection.status,
          createdAt: collection.created_at,
          customer_id: collection.customer_id,
          recycler_id: collection.recycler_id,
          waste_type: collection.waste_type,
          pickup_address: collection.pickup_address || 'Location not specified',
          special_instructions: collection.pickup_notes,
          isNew: false
        }));
        
        // Check for new requests
        const currentPendingCount = transformedRequests.filter(req => req.status === 'pending').length;
        if (currentPendingCount > lastRequestCount) {
          // Mark new requests as new
          const newRequests = transformedRequests.filter(req => 
            req.status === 'pending' && 
            !pickupRequests.some(existing => existing.id === req.id)
          );
          newRequests.forEach(req => req.isNew = true);
          setHasNewRequests(true);
          
          // Add haptic feedback for new requests
          Vibration.vibrate(500); // Vibrate for 500ms
          
          // Show notification alert for new requests
          if (newRequests.length > 0) {
            Alert.alert(
              'New Pickup Request! 🚛',
              `You have ${newRequests.length} new pickup request${newRequests.length > 1 ? 's' : ''} available.`,
              [{ text: 'View Now', onPress: () => setHasNewRequests(false) }]
            );
          }
        }
        
        setPickupRequests(transformedRequests);
        setLastRequestCount(currentPendingCount);
        
        // Update notification count for pending requests
        setNotificationCount(currentPendingCount);
        
        // Stop pulsing after a few seconds
        if (hasNewRequests) {
          setTimeout(() => setHasNewRequests(false), 5000);
        }
      } else {
        console.log('⚠️ Empty or invalid response from API');
        // Handle empty response
        setPickupRequests([]);
        setNotificationCount(0);
        setLastRequestCount(0);
      }
    } catch (error) {
      console.error('❌ Error fetching pickup requests:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to fetch pickup requests.';
      if (error instanceof Error) {
        if (error.message.includes('Network request failed')) {
          errorMessage = 'Network connection failed. Please check your internet connection.';
        } else if (error.message.includes('Request timed out')) {
          errorMessage = 'Request timed out. The server may be slow or unavailable.';
        } else if (error.message.includes('Already read')) {
          errorMessage = 'API communication error. Please try again.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      // Show error state with retry option
      setPickupRequests([]);
      setNotificationCount(0);
      setLastRequestCount(0);
      
      // Show fallback data for demo purposes
      const fallbackData: PickupRequest[] = [
        {
          id: 'demo-1',
          userName: 'Demo Customer 1',
          location: 'Demo Location - Backend Unavailable',
          phone: 'Demo Phone',
          wasteType: 'Mixed Waste',
          distance: '2.1 km',
          status: 'pending',
          createdAt: new Date().toISOString(),
          customer_id: 'demo-1',
          waste_type: 'mixed',
          pickup_address: 'Demo Location - Backend Unavailable',
          isNew: true
        },
        {
          id: 'demo-2',
          userName: 'Demo Customer 2',
          location: 'Demo Location - Backend Unavailable',
          phone: 'Demo Phone',
          wasteType: 'Plastic',
          distance: '1.8 km',
          status: 'pending',
          createdAt: new Date().toISOString(),
          customer_id: 'demo-2',
          waste_type: 'plastic',
          pickup_address: 'Demo Location - Backend Unavailable',
          isNew: false
        }
      ];
      
      setPickupRequests(fallbackData);
      setNotificationCount(2);
      setLastRequestCount(2);
      
      Alert.alert(
        'Connection Error',
        `${errorMessage}\n\nShowing demo data for now.`,
        [
          { text: 'OK' },
          { text: 'Retry', onPress: () => fetchPickupRequests() }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  // Refresh data
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPickupRequests();
    setRefreshing(false);
  };

  // Fetch requests on component mount
  useEffect(() => {
    fetchPickupRequests();
  }, []);

  // Handle completed pickup from celebration screen
  useEffect(() => {
    if (params.completedPickup === 'true') {
      const pickupId = params.pickupId as string;
      const userName = params.userName as string;
      const location = params.location as string;
      const totalAmount = params.totalAmount as string;

      // Add to completed requests
      setCompletedRequests(prev => new Set([...prev, pickupId]));
      
              // Update local state only
      
      // Remove from accepted requests if it was there
      setAcceptedRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(pickupId);
        return newSet;
      });
      
      // Update pickup requests status
      setPickupRequests(prev => 
        prev.map(req => 
          req.id === pickupId 
            ? { ...req, status: 'completed' as const }
            : req
        )
      );
      
      // Update notification count
      const pendingCount = pickupRequests.filter(req => req.status === 'pending').length;
      setNotificationCount(pendingCount);
    }
  }, [params.completedPickup, params.pickupId, params.userName, params.location, params.totalAmount]);

  const handleNotificationPress = () => {
    setNotificationCount(0);
    setHasNewRequests(false);
    // Navigate to notifications screen
    router.push('/recycler-screens/RecyclerNotificationScreen' as any);
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      // Accept the request via API
      const response = await apiService.updateWasteStatus(requestId, 'accepted');
      
      if (response) {
        setAcceptedRequests(prev => new Set([...prev, requestId]));
        
        // Update local state only
        
        // Update local state
        setPickupRequests(prev => 
          prev.map(req => 
            req.id === requestId 
              ? { ...req, status: 'accepted' as const }
              : req
          )
        );
        
        // Update notification count
        const pendingCount = pickupRequests.filter(req => req.status === 'pending').length;
        setNotificationCount(pendingCount);
        
        // Remove NEW badge
        setPickupRequests(prev => 
          prev.map(req => 
            req.id === requestId 
              ? { ...req, isNew: false }
              : req
          )
        );
        
        Alert.alert(
          'Request Accepted! 🎉',
          'You have successfully accepted this pickup request. It has been added to your active pickups.',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Failed to accept request');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert(
        'Error',
        'Failed to accept request. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    Alert.prompt(
      'Reject Request',
      'Please provide a reason for rejection:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          style: 'destructive',
          onPress: async (reason) => {
            try {
              // Reject the request via API with rejection reason
              const response = await apiService.updateWasteStatus(requestId, 'cancelled', reason);
              
              if (response) {
                        // Update local state only
                
                // Remove from accepted requests if it was there
                setAcceptedRequests(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(requestId);
                  return newSet;
                });
                
                // Update local state
                setPickupRequests(prev => 
                  prev.map(req => 
                    req.id === requestId 
                      ? { ...req, status: 'cancelled' as const, isNew: false }
                      : req
                  )
                );
                
                // Update notification count
                const pendingCount = pickupRequests.filter(req => req.status === 'pending').length;
                setNotificationCount(pendingCount);
                
                Alert.alert(
                  'Request Rejected', 
                  `The request has been rejected${reason ? ` with reason: "${reason}"` : ''}. The customer has been notified.`,
                  [{ text: 'OK' }]
                );
              } else {
                throw new Error('Failed to reject request');
              }
            } catch (error) {
              console.error('Error rejecting request:', error);
              Alert.alert(
                'Error',
                'Failed to reject request. Please try again.',
                [{ text: 'OK' }]
              );
            }
          }
        }
      ],
      'plain-text',
      'Distance too far, unavailable resources, etc.'
    );
  };

  const handleRouteRequest = (requestId: string) => {
    // Update status to in_progress when starting route
    apiService.updateWasteStatus(requestId, 'in_progress').then(() => {
      // Update local state
      setPickupRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'in_progress' as const }
            : req
        )
      );
    }).catch(error => {
      console.error('Error updating status to in_progress:', error);
    });
    
    // Navigate to navigation screen with requestId
    router.push({
      pathname: '/recycler-screens/RecyclerNavigation' as any,
      params: { requestId: requestId }
    });
  };

  const handleCompleteRequest = async (requestId: string) => {
    try {
      // Complete the request via API
      const response = await apiService.updateWasteStatus(requestId, 'completed');
      
      if (response) {
        setCompletedRequests(prev => new Set([...prev, requestId]));
        setAcceptedRequests(prev => {
          const newSet = new Set(prev);
          newSet.delete(requestId);
          return newSet;
        });
        
        // Update local state
        setPickupRequests(prev => 
          prev.map(req => 
            req.id === requestId 
              ? { ...req, status: 'completed' as const }
              : req
          )
        );
        
        // Update local state only
        
        // Update notification count (though completed requests don't affect pending count)
        const pendingCount = pickupRequests.filter(req => req.status === 'pending').length;
        setNotificationCount(pendingCount);
        
        Alert.alert(
          'Pickup Completed! 🎉',
          'This pickup has been marked as completed successfully.',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error('Failed to complete request');
      }
    } catch (error) {
      console.error('Error completing request:', error);
      Alert.alert(
        'Error',
        'Failed to complete request. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // Filter requests based on selected filter
  const getFilteredRequests = () => {
    switch (selectedFilter) {
      case 'active':
        return pickupRequests.filter(request => acceptedRequests.has(request.id));
      case 'completed':
        return pickupRequests.filter(request => completedRequests.has(request.id));
      default:
        return pickupRequests; // Show all requests
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <AppHeader 
          onNotificationPress={handleNotificationPress}
          notificationCount={notificationCount}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading pickup requests...</Text>
          <Text style={styles.loadingSubtext}>Fetching from server...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader 
        onNotificationPress={handleNotificationPress}
        notificationCount={notificationCount}
      />
      
      {/* Pickups Banner */}
      <View style={styles.pickupsBanner}>
        <TouchableOpacity style={styles.pickupsButton}>
          <Text style={styles.pickupsButtonText}>Pickups</Text>
        </TouchableOpacity>
        
        {/* Connection Test Button */}
        <TouchableOpacity 
          style={styles.connectionTestButton}
          onPress={async () => {
            try {
              console.log('🧪 Testing backend connection...');
              
              // First test basic health endpoint
              const healthResponse = await fetch('http://10.132.144.9:3000/health');
              console.log('🏥 Health check status:', healthResponse.status);
              
              // Then test the specific endpoint
              const response = await apiService.getWasteCollectionsForRecycler();
              console.log('✅ Backend connection successful:', response.success);
              
              Alert.alert(
                'Connection Test',
                `Health: ${healthResponse.status === 200 ? 'OK' : 'Failed'}\nAPI: ${response.success ? 'Connected' : 'Errors'}`,
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('❌ Backend connection failed:', error);
              Alert.alert(
                'Connection Test',
                `Backend connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                [
                  { text: 'OK' },
                  { 
                    text: 'Try Localhost', 
                    onPress: async () => {
                      try {
                        const switched = await apiService.switchToFallbackURL();
                        if (switched) {
                          Alert.alert('Success', 'Switched to localhost. Please try again.');
                        } else {
                          Alert.alert('Failed', 'Could not switch to localhost.');
                        }
                      } catch (switchError) {
                        Alert.alert('Error', 'Failed to switch URLs.');
                      }
                    }
                  }
                ]
              );
            }
          }}
        >
          <Text style={styles.connectionTestButtonText}>🧪 Test Connection</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'all' && styles.filterButtonTextActive]}>
            All Pickups ({pickupRequests.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'active' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('active')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'active' && styles.filterButtonTextActive]}>
            Active Pickups ({acceptedRequests.size})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.filterButton, selectedFilter === 'completed' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('completed')}
        >
          <Text style={[styles.filterButtonText, selectedFilter === 'completed' && styles.filterButtonTextActive]}>
            Completed Pickups ({completedRequests.size})
          </Text>
        </TouchableOpacity>
      </View>

      {/* New Requests Notification Banner */}
      {hasNewRequests && (
        <Animated.View 
          style={[
            styles.newRequestsBanner,
            { transform: [{ scale: pulseAnimation }] }
          ]}
        >
          <MaterialIcons name="notifications-active" size={20} color={COLORS.white} />
          <Text style={styles.newRequestsBannerText}>
            You have new pickup requests! Tap to view them.
          </Text>
          <TouchableOpacity 
            style={styles.newRequestsBannerButton}
            onPress={() => setHasNewRequests(false)}
          >
            <Text style={styles.newRequestsBannerButtonText}>Dismiss</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Pickup Requests */}
      <ScrollView 
        style={styles.requestsContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {getFilteredRequests().length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {selectedFilter === 'all' 
                ? 'No pickup requests available at the moment'
                : selectedFilter === 'active'
                ? 'No active pickups'
                : 'No completed pickups'
              }
            </Text>
            {selectedFilter === 'all' && (
              <Text style={styles.emptyStateSubtext}>
                New requests will appear here automatically
              </Text>
            )}
          </View>
        ) : (
          getFilteredRequests().map((request) => (
            <Animated.View 
              key={request.id} 
              style={[
                styles.requestCard,
                request.isNew && { transform: [{ scale: pulseAnimation }] }
              ]}
            >
              {/* NEW badge for new requests */}
              {request.isNew && (
                <View style={styles.newBadge}>
                  <Text style={styles.newBadgeText}>NEW</Text>
                </View>
              )}
              
              <View style={styles.requestContent}>
                <View style={styles.userInfo}>
                  <MaterialIcons name="person" size={20} color={COLORS.black} />
                  <Text style={styles.userName}>{request.userName}</Text>
                </View>
                
                <View style={styles.locationInfo}>
                  <MaterialIcons name="search" size={20} color={COLORS.black} />
                  <Text style={styles.locationText}>{request.location}</Text>
                </View>
                
                <View style={styles.phoneInfo}>
                  <MaterialIcons name="phone" size={20} color={COLORS.black} />
                  <Text style={styles.phoneText}>{request.phone}</Text>
                </View>

                <View style={styles.requestDetails}>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="category" size={16} color={COLORS.gray} />
                    <Text style={styles.detailText}>{request.wasteType}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <MaterialIcons name="directions-car" size={16} color={COLORS.gray} />
                    <Text style={styles.detailText}>{request.distance}</Text>
                  </View>
                </View>
                
                {/* Show special instructions if available */}
                {request.special_instructions && (
                  <View style={styles.specialInstructions}>
                    <MaterialIcons name="info" size={16} color={COLORS.primary} />
                    <Text style={styles.specialInstructionsText}>{request.special_instructions}</Text>
                  </View>
                )}
              </View>
              
              {/* Show different buttons based on request status */}
              {completedRequests.has(request.id) ? (
                <View style={styles.completedBadge}>
                  <Text style={styles.completedText}>✅ Completed</Text>
                </View>
              ) : request.status === 'in_progress' ? (
                <View style={styles.inProgressBadge}>
                  <Text style={styles.inProgressText}>🚚 In Progress</Text>
                </View>
              ) : acceptedRequests.has(request.id) ? (
                <View style={styles.activeButtons}>
                  <TouchableOpacity 
                    style={styles.routeButton}
                    onPress={() => handleRouteRequest(request.id)}
                  >
                    <Text style={styles.routeButtonText}>🗺️ Route</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.completeButton}
                    onPress={() => handleCompleteRequest(request.id)}
                  >
                    <Text style={styles.completeButtonText}>✅ Complete</Text>
                  </TouchableOpacity>
                </View>
              ) : request.status === 'cancelled' ? (
                <View style={styles.cancelledBadge}>
                  <Text style={styles.cancelledText}>❌ Cancelled</Text>
                </View>
              ) : (
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={styles.rejectButton}
                    onPress={() => handleRejectRequest(request.id)}
                  >
                    <Text style={styles.rejectButtonText}>❌ Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.acceptButton}
                    onPress={() => handleAcceptRequest(request.id)}
                  >
                    <Text style={styles.acceptButtonText}>✅ Accept</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>
          ))
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pickupsBanner: {
    backgroundColor: COLORS.lightGreen,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  pickupsButton: {
    backgroundColor: COLORS.darkGreen,
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  pickupsButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  connectionTestButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 10,
  },
  connectionTestButtonText: {
    color: COLORS.white,
    fontSize: 14,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  requestContent: {
    flex: 1,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginLeft: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: COLORS.darkGreen,
    marginLeft: 8,
  },
  phoneInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneText: {
    fontSize: 14,
    color: COLORS.darkGreen,
    marginLeft: 8,
  },
  routeButton: {
    backgroundColor: COLORS.darkGreen,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  routeButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  rejectButton: {
    backgroundColor: COLORS.red,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  rejectButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  acceptButton: {
    backgroundColor: COLORS.green,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  acceptButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  requestDetails: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: COLORS.gray,
    marginLeft: 4,
  },
  completedBadge: {
    backgroundColor: COLORS.green,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  completedText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  completeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  completeButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  specialInstructions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: COLORS.lightGray,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  specialInstructionsText: {
    fontSize: 12,
    color: COLORS.darkGreen,
    marginLeft: 8,
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
  newBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  newBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  newRequestsBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  newRequestsBannerText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 10,
  },
  newRequestsBannerButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  newRequestsBannerButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  inProgressBadge: {
    backgroundColor: COLORS.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  inProgressText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  cancelledBadge: {
    backgroundColor: COLORS.red,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  cancelledText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});