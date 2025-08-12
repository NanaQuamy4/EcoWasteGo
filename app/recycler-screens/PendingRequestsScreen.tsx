import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Image, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, DIMENSIONS } from '../../constants';
import { apiService } from '../../services/apiService';
import CommonHeader from '../components/CommonHeader';

interface PendingRequest {
  id: string;
  customer_name: string;
  customer_phone: string;
  waste_type: string;
  weight: number;
  pickup_address: string;
  description?: string;
  created_at: string;
  distance?: string;
}

export default function PendingRequestsScreen() {
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get available collections (pending requests)
      const response = await apiService.getWasteCollections();
      
      if (response && Array.isArray(response)) {
        // Filter for pending requests and format them
        const pending = response
          .filter(collection => collection.status === 'pending')
          .map(collection => ({
            id: collection.id,
            customer_name: `Customer ${collection.customer_id.substring(0, 8)}`, // Placeholder
            customer_phone: '+233 XX XXX XXXX', // Placeholder
            waste_type: collection.waste_type,
            weight: collection.weight || 0,
            pickup_address: collection.pickup_address || 'Location not specified',
            description: collection.description,
            created_at: collection.created_at,
            distance: '2.3 km' // Mock distance
          }));
        
        setPendingRequests(pending);
      }
    } catch (err) {
      console.error('Error fetching pending requests:', err);
      setError('Failed to fetch pending requests');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPendingRequests();
    setRefreshing(false);
  };

  const handleAcceptRequest = async (requestId: string) => {
    Alert.alert(
      'Accept Request',
      'Are you sure you want to accept this pickup request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: async () => {
            try {
              const response = await apiService.updateWasteStatus(requestId, 'accepted');
              
              if (response) {
                Alert.alert('Request Accepted', 'You have successfully accepted this pickup request.');
                // Refresh the list
                fetchPendingRequests();
              } else {
                Alert.alert('Error', 'Failed to accept request');
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to accept request');
            }
          }
        }
      ]
    );
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
                Alert.alert('Request Rejected', `Request has been rejected${reason ? ` with reason: "${reason}"` : ''}.`);
                // Refresh the list
                fetchPendingRequests();
              } else {
                Alert.alert('Error', 'Failed to reject request');
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to reject request');
            }
          }
        }
      ],
      'plain-text',
      'Distance too far, unavailable resources, etc.'
    );
  };

  const handleViewDetails = (request: PendingRequest) => {
    // Navigate to request details screen
    router.push({
      pathname: '/recycler-screens/RequestDetails' as any,
      params: { requestId: request.id }
    });
  };

  const renderRequestItem = ({ item }: { item: PendingRequest }) => (
    <View style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.customerInfo}>
          <Image 
            source={require('../../assets/images/_MG_2771.jpg')} 
            style={styles.customerAvatar}
            defaultSource={require('../../assets/images/_MG_2771.jpg')}
          />
          <View style={styles.customerDetails}>
            <Text style={styles.customerName}>{item.customer_name}</Text>
            <Text style={styles.customerPhone}>{item.customer_phone}</Text>
          </View>
        </View>
        <View style={styles.distanceBadge}>
          <Text style={styles.distanceText}>{item.distance}</Text>
        </View>
      </View>

      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Waste Type:</Text>
          <Text style={styles.detailValue}>{item.waste_type}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Weight:</Text>
          <Text style={styles.detailValue}>{item.weight}kg</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Location:</Text>
          <Text style={styles.detailValue} numberOfLines={2}>{item.pickup_address}</Text>
        </View>
        {item.description && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Notes:</Text>
            <Text style={styles.detailValue} numberOfLines={2}>{item.description}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Requested:</Text>
          <Text style={styles.detailValue}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.viewButton} 
          onPress={() => handleViewDetails(item)}
        >
          <Text style={styles.viewButtonText}>VIEW DETAILS</Text>
        </TouchableOpacity>
        
        <View style={styles.decisionButtons}>
          <TouchableOpacity 
            style={[styles.decisionButton, styles.rejectButton]} 
            onPress={() => handleRejectRequest(item.id)}
          >
            <Text style={styles.rejectButtonText}>REJECT</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.decisionButton, styles.acceptButton]} 
            onPress={() => handleAcceptRequest(item.id)}
          >
            <Text style={styles.acceptButtonText}>ACCEPT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>📋</Text>
      <Text style={styles.emptyStateTitle}>No Pending Requests</Text>
      <Text style={styles.emptyStateMessage}>
        There are currently no pending waste collection requests in your area.
      </Text>
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
        <Text style={styles.refreshButtonText}>REFRESH</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <CommonHeader title="Pending Requests" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading pending requests...</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CommonHeader title="Pending Requests" />
      
      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchPendingRequests}>
            <Text style={styles.retryButtonText}>TRY AGAIN</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={pendingRequests}
          renderItem={renderRequestItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: DIMENSIONS.borderRadius,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: DIMENSIONS.cardBorderRadius,
    padding: 16,
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  customerDetails: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 2,
  },
  customerPhone: {
    fontSize: 14,
    color: COLORS.gray,
  },
  distanceBadge: {
    backgroundColor: COLORS.lightBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.darkBlue,
  },
  requestDetails: {
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.darkGreen,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  actionButtons: {
    gap: 12,
  },
  viewButton: {
    backgroundColor: COLORS.lightGreen,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: DIMENSIONS.borderRadius,
    alignItems: 'center',
  },
  viewButtonText: {
    color: COLORS.darkGreen,
    fontSize: 14,
    fontWeight: '600',
  },
  decisionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  decisionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: DIMENSIONS.borderRadius,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: COLORS.lightRed,
    borderWidth: 1,
    borderColor: COLORS.red,
  },
  rejectButtonText: {
    color: COLORS.red,
    fontSize: 14,
    fontWeight: 'bold',
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
  },
  acceptButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
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
    borderRadius: DIMENSIONS.borderRadius,
  },
  refreshButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
