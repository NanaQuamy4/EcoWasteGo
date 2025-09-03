import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants';

// ===== MOCK DATA FOR PENDING REQUESTS SCREEN =====
// This replaces the backend API calls with local mock data
// In a real app, this would come from a database or waste collection service

// Mock pending waste collection requests
const mockPendingRequests = [
  {
    id: "req_001",
    customer_id: "user_001",
    customer_name: "John Doe",
    customer_phone: "+233241234567",
    customer_address: "123 Main Street, Accra Central",
    waste_type: "Mixed Waste",
    weight: 8,
    special_instructions: "Please call before arrival",
    status: "pending",
    created_at: "2024-01-15T10:30:00Z",
    estimated_pickup_time: "15:30",
    distance: "2.3 km",
    customer_rating: 4.8
  },
  {
    id: "req_002",
    customer_id: "user_002",
    customer_name: "Jane Smith",
    customer_phone: "+233241234568",
    customer_address: "456 Oak Avenue, Accra Central",
    waste_type: "Plastic",
    weight: 5,
    special_instructions: "Gate code: 1234",
    status: "pending",
    created_at: "2024-01-15T11:15:00Z",
    estimated_pickup_time: "16:00",
    distance: "3.1 km",
    customer_rating: 4.6
  },
  {
    id: "req_003",
    customer_id: "user_003",
    customer_name: "Mike Johnson",
    customer_phone: "+233241234569",
    customer_address: "789 Pine Road, Accra Central",
    waste_type: "Paper & Cardboard",
    weight: 12,
    special_instructions: "Large quantity, need truck",
    status: "pending",
    created_at: "2024-01-15T12:00:00Z",
    estimated_pickup_time: "16:30",
    distance: "1.8 km",
    customer_rating: 4.9
  },
  {
    id: "req_004",
    customer_id: "user_004",
    customer_name: "Sarah Wilson",
    customer_phone: "+233241234570",
    customer_address: "321 Elm Street, Accra Central",
    waste_type: "Glass & Metal",
    weight: 6,
    special_instructions: "Fragile items, handle carefully",
    status: "pending",
    created_at: "2024-01-15T12:45:00Z",
    estimated_pickup_time: "17:00",
    distance: "4.2 km",
    customer_rating: 4.7
  }
];

export default function PendingRequestsScreen() {
  const router = useRouter();

  // ===== LOCAL STATE MANAGEMENT =====
  // These state variables manage the UI state and data
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ===== INITIALIZATION EFFECT =====
  // This effect runs when the component first loads
  useEffect(() => {
    loadMockData();
  }, []);

  // ===== MOCK DATA LOADING FUNCTION =====
  // This replaces the backend API call to fetch pending requests
  // It loads data from our mock data arrays
  const loadMockData = async () => {
    try {
      setIsLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Load mock pending requests
      setPendingRequests([...mockPendingRequests]);
      
      console.log('PendingRequestsScreen: Mock data loaded successfully');
    } catch (error) {
      console.error('PendingRequestsScreen: Error loading mock data:', error);
      // Fallback to default mock data
      setPendingRequests(mockPendingRequests);
    } finally {
      setIsLoading(false);
    }
  };

  // ===== MOCK ACTION HANDLERS =====
  // These functions handle user actions
  
  // Accept a pending request
  const handleAcceptRequest = async (requestId: string) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update mock data status
      const updatedRequests = pendingRequests.map(request => 
        request.id === requestId 
          ? { ...request, status: 'accepted' }
          : request
      );
      
      setPendingRequests(updatedRequests);
      
      console.log('PendingRequestsScreen: Request accepted successfully');
      
      Alert.alert(
        'Request Accepted!',
        'You have accepted this waste collection request. The customer will be notified.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept request. Please try again.');
    }
  };

  // Reject a pending request
  const handleRejectRequest = async (requestId: string, reason: string) => {
    if (!reason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for rejection.');
      return;
    }

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update mock data status
      const updatedRequests = pendingRequests.map(request => 
        request.id === requestId 
          ? { ...request, status: 'rejected', rejection_reason: reason }
          : request
      );
      
      setPendingRequests(updatedRequests);
      
      console.log('PendingRequestsScreen: Request rejected successfully');
      
      Alert.alert(
        'Request Rejected',
        'You have rejected this waste collection request. The customer will be notified.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error rejecting request:', error);
      Alert.alert('Error', 'Failed to reject request. Please try again.');
    }
  };

  // Show rejection reason input
  const showRejectionDialog = (requestId: string) => {
    Alert.prompt(
      'Rejection Reason',
      'Please provide a reason for rejecting this request:',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          onPress: (reason) => {
            if (reason) {
              handleRejectRequest(requestId, reason);
            }
          }
        }
      ],
      'plain-text'
    );
  };

  // Call customer
  const handleCallCustomer = (customerPhone: string, customerName: string) => {
    Alert.alert(
      'Call Customer',
      `Call ${customerName} at ${customerPhone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Call', 
          onPress: () => {
            // In a real app, this would use Linking to make a phone call
            console.log('Calling customer:', customerPhone);
            Alert.alert('Call Customer', 'Phone call functionality would be implemented here.');
          }
        }
      ]
    );
  };

  // View request details
  const handleViewRequestDetails = (request: any) => {
    // In a real app, this would navigate to a detailed view
    Alert.alert(
      'Request Details',
      `Customer: ${request.customer_name}\nAddress: ${request.customer_address}\nWaste Type: ${request.waste_type}\nWeight: ${request.weight} kg\nSpecial Instructions: ${request.special_instructions}`,
      [{ text: 'OK' }]
    );
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadMockData();
    setRefreshing(false);
  };

  // ===== UTILITY FUNCTIONS =====
  // Format timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Get status color for display
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return COLORS.orange || '#FF9800';
      case 'accepted':
        return COLORS.green;
      case 'rejected':
        return COLORS.red;
      default:
        return COLORS.gray;
    }
  };

  // ===== UI RENDER FUNCTIONS =====
  // These functions render different parts of the UI
  
  // Render a single pending request item
  const renderPendingRequest = ({ item }: { item: any }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.customerInfo}>
          <Text style={styles.customerName}>{item.customer_name}</Text>
          <View style={styles.ratingContainer}>
            <MaterialIcons name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{item.customer_rating}</Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="location-on" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>{item.customer_address}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="recycling" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>{item.waste_type} • {item.weight} kg</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="access-time" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>Requested: {formatTimestamp(item.created_at)}</Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="directions-car" size={16} color={COLORS.gray} />
          <Text style={styles.detailText}>{item.distance} away</Text>
        </View>
        {item.special_instructions && (
          <View style={styles.detailRow}>
            <MaterialIcons name="info" size={16} color={COLORS.gray} />
            <Text style={styles.detailText}>{item.special_instructions}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.callButton}
          onPress={() => handleCallCustomer(item.customer_phone, item.customer_name)}
        >
          <MaterialIcons name="phone" size={20} color={COLORS.white} />
          <Text style={styles.callButtonText}>Call</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.detailsButton}
          onPress={() => handleViewRequestDetails(item)}
        >
          <MaterialIcons name="info" size={20} color={COLORS.darkGreen} />
          <Text style={styles.detailsButtonText}>Details</Text>
        </TouchableOpacity>
        
        {item.status === 'pending' && (
          <>
            <TouchableOpacity 
              style={styles.rejectButton}
              onPress={() => showRejectionDialog(item.id)}
            >
              <MaterialIcons name="close" size={20} color={COLORS.white} />
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={() => handleAcceptRequest(item.id)}
            >
              <MaterialIcons name="check" size={20} color={COLORS.white} />
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading pending requests...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Pending Requests</Text>
      </View>
      
      {pendingRequests.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📋</Text>
          <Text style={styles.emptyStateTitle}>No Pending Requests</Text>
          <Text style={styles.emptyStateMessage}>
            There are currently no pending waste collection requests in your area.
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
            <Text style={styles.refreshButtonText}>REFRESH</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={pendingRequests}
          renderItem={renderPendingRequest}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginRight: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginLeft: 4,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  requestDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '45%',
  },
  callButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGreen,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '45%',
  },
  detailsButtonText: {
    color: COLORS.darkGreen,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightRed,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '45%',
  },
  rejectButtonText: {
    color: COLORS.red,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '45%',
  },
  acceptButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  refreshButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});