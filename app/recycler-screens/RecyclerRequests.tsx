import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import { COLORS } from '../../constants';

// ===== MOCK DATA FOR RECYCLER REQUESTS =====
// This replaces the backend API calls with local mock data
// In a real app, this would come from a database or real-time service
const mockPickupRequests: PickupRequest[] = [
  {
    id: "req_001",
    userName: "John Doe",
    location: "Accra Central, Ghana",
    phone: "+233241234567",
    wasteType: "Plastic & Paper",
    distance: "2.3 km",
    status: "pending",
    createdAt: "2024-01-15T10:30:00Z",
    customer_id: "user_001",
    recycler_id: null,
    waste_type: "Plastic & Paper",
    pickup_address: "123 Main Street, Accra Central",
    special_instructions: "Please call before arrival",
    weight: 5,
    isNew: true
  },
  {
    id: "req_002",
    userName: "Jane Smith", 
    location: "Kumasi, Ghana",
    phone: "+233241234569",
    wasteType: "Mixed Waste",
    distance: "1.8 km",
    status: "accepted",
    createdAt: "2024-01-15T09:15:00Z",
    customer_id: "user_003",
    recycler_id: "user_002",
    waste_type: "Mixed Waste",
    pickup_address: "456 Oak Avenue, Kumasi",
    special_instructions: "Gate code: 1234",
    weight: 8,
    isNew: false
  },
  {
    id: "req_003",
    userName: "Michael Afia",
    location: "Komfo Anokye, Ghana", 
    phone: "+233546732719",
    wasteType: "Plastic",
    distance: "3.1 km",
    status: "in_progress",
    createdAt: "2024-01-15T08:00:00Z",
    customer_id: "cust_004",
    recycler_id: "user_002",
    waste_type: "Plastic",
    pickup_address: "Gold hostel - Komfo Anokye",
    special_instructions: "Call when at gate",
    weight: 10,
    isNew: false
  },
  {
    id: "req_004",
    userName: "Sarah Johnson",
    location: "Tema, Ghana",
    phone: "+233241234570",
    wasteType: "Electronic Waste",
    distance: "4.2 km",
    status: "pending",
    createdAt: "2024-01-15T11:00:00Z",
    customer_id: "cust_005",
    recycler_id: null,
    waste_type: "Electronic Waste",
    pickup_address: "789 Industrial Road, Tema",
    special_instructions: "Large items, need truck",
    weight: 15,
    isNew: true
  }
];

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
  status: string;
  createdAt: string;
  customer_id: string;
  recycler_id: string | null;
  waste_type: string;
  pickup_address: string;
  special_instructions?: string;
  weight: number;
  isNew?: boolean; // Track if this is a new request
}

export default function RecyclerRequests() {
  const params = useLocalSearchParams();
  
  // ===== LOCAL STATE MANAGEMENT =====
  // These state variables manage the UI state and data
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

  // ===== INITIALIZATION EFFECT =====
  // This effect runs when the component first loads
  useEffect(() => {
    // Load initial mock data
    loadMockData();
  }, []);

  // ===== REAL-TIME SIMULATION EFFECT =====
  // This simulates real-time updates by polling every 10 seconds
  // In a real app, this would be WebSocket or push notifications
  useEffect(() => {
    const pollInterval = setInterval(() => {
      simulateRealTimeUpdates();
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, []);

  // ===== ANIMATION EFFECT =====
  // This effect animates the new request indicator when there are new requests
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

  // ===== MOCK DATA LOADING FUNCTION =====
  // This replaces the backend API call to fetch pickup requests
  // It loads data from our mock data array
  const loadMockData = () => {
    setLoading(true);
    
    // Simulate network delay
    setTimeout(() => {
      setPickupRequests([...mockPickupRequests]);
      setLastRequestCount(mockPickupRequests.length);
      
      // Check for new requests (requests created in the last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const newRequests = mockPickupRequests.filter(req => 
        new Date(req.createdAt) > fiveMinutesAgo
      );
      
      setHasNewRequests(newRequests.length > 0);
      setLoading(false);
    }, 1000);
  };

  // ===== REAL-TIME UPDATE SIMULATION =====
  // This simulates real-time updates by occasionally adding new mock requests
  const simulateRealTimeUpdates = () => {
    // 10% chance of getting a new request
    if (Math.random() < 0.1) {
      const newRequest: PickupRequest = {
        id: `req_${Date.now()}`,
        userName: `Customer ${Math.floor(Math.random() * 1000)}`,
        location: "Random Location, Ghana",
        phone: `+23324${Math.floor(Math.random() * 900000 + 100000)}`,
        wasteType: "Mixed Waste",
        distance: calculateDistance("Random Location"),
        status: "pending",
        createdAt: new Date().toISOString(),
        customer_id: `cust_${Date.now()}`,
        recycler_id: null,
        waste_type: "Mixed Waste",
        pickup_address: "Random Address",
        special_instructions: "No special instructions",
        weight: Math.floor(Math.random() * 20) + 1,
        isNew: true
      };
      
      // Add to mock data and update state
      const updatedRequests = [newRequest, ...mockPickupRequests];
      mockPickupRequests.length = 0;
      mockPickupRequests.push(...updatedRequests);
      setPickupRequests(updatedRequests);
      setHasNewRequests(true);
      
      // Vibrate to notify recycler of new request
      Vibration.vibrate(500);
    }
  };

  // ===== REFRESH HANDLER =====
  // This handles pull-to-refresh functionality
  const handleRefresh = () => {
    setRefreshing(true);
    loadMockData();
    
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  // ===== REQUEST ACTION HANDLERS =====
  // These functions handle different actions on pickup requests
  
  // Accept a pickup request
  const handleAcceptRequest = (requestId: string) => {
    const request = pickupRequests.find(r => r.id === requestId);
    if (request) {
      request.status = "accepted";
      request.recycler_id = "current_recycler_id"; // In real app, this would be the logged-in recycler's ID
      setAcceptedRequests(prev => new Set(prev).add(requestId));
      
      // Update the mock data
      const mockRequest = mockPickupRequests.find(r => r.id === requestId);
      if (mockRequest) {
        mockRequest.status = "accepted";
        mockRequest.recycler_id = "current_recycler_id";
      }
      
      setPickupRequests([...pickupRequests]);
      
      Alert.alert(
        "Request Accepted!",
        `You've accepted the pickup request from ${request.userName}. Navigate to start pickup.`,
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
    }
  };

  // Complete a pickup request
  const handleCompleteRequest = (requestId: string) => {
    const request = pickupRequests.find(r => r.id === requestId);
    if (request) {
      request.status = "completed";
      setCompletedRequests(prev => new Set(prev).add(requestId));
      
      // Update the mock data
      const mockRequest = mockPickupRequests.find(r => r.id === requestId);
      if (mockRequest) {
        mockRequest.status = "completed";
      }
      
      setPickupRequests([...pickupRequests]);
      
      Alert.alert(
        "Pickup Completed!",
        `Great job! You've completed the pickup for ${request.userName}.`,
        [{ text: "OK" }]
      );
    }
  };

  // Reject a pickup request
  const handleCancelRequest = (requestId: string) => {
    const request = pickupRequests.find(r => r.id === requestId);
    if (request) {
      request.status = "rejected";
      
      // Update the mock data
      const mockRequest = mockPickupRequests.find(r => r.id === requestId);
      if (mockRequest) {
        mockRequest.status = "rejected";
      }
      
      setPickupRequests([...pickupRequests]);
      
      Alert.alert(
        "Request Rejected",
        `You've rejected the pickup request from ${request.userName}.`,
        [{ text: "OK" }]
      );
    }
  };

  // ===== FILTERING LOGIC =====
  // This filters the pickup requests based on the selected filter
  // Rejected/cancelled requests are filtered out completely from recycler view
  const getFilteredRequests = () => {
    // First, filter out rejected/cancelled requests completely
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
  // These functions render different parts of the UI
  
  // Render a single pickup request item
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
            <MaterialIcons name="search" size={16} color={COLORS.gray} />
            <Text style={styles.detailText}>{request.pickup_address}</Text>
          </View>
          <View style={styles.detailRow}>
            <MaterialIcons name="phone" size={16} color={COLORS.gray} />
            <Text style={styles.detailText}>{request.phone}</Text>
          </View>
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

      {/* Bottom Navigation - Keep unchanged */}
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