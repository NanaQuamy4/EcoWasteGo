import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants';
import { supabase } from '../../lib/supabase';

interface RecyclerInfo {
  id: string;
  name: string;
  rating: number;
  distance: string;
  phone: string;
  vehicleType: string;
  estimatedPrice?: string;
  estimatedArrival?: string;
}

interface PickupRequest {
  id: string;
  status: string;
  pickup_address: string;
  waste_type: string;
  estimated_weight: number;
  recycler_id?: string;
  created_at: string;
}

export default function WaitingForRecycler() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    requestId?: string;
    recyclerId?: string;
    recyclerName?: string;
    recyclerRating?: string;
    recyclerDistance?: string;
    recyclerPhone?: string;
    estimatedPrice?: string;
    estimatedArrival?: string;
  }>();

  const [recyclerInfo, setRecyclerInfo] = useState<RecyclerInfo | null>(null);
  const [pickupRequest, setPickupRequest] = useState<PickupRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isRejected, setIsRejected] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to prevent infinite loops
  const confirmationTimerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const statusCheckIntervalRef = useRef<number | null>(null);
  const isCheckingStatus = useRef<boolean>(false);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load recycler info from params
      const recyclerData: RecyclerInfo = {
        id: params.recyclerId || 'recycler_001',
        name: params.recyclerName || 'GreenFleet GH',
        rating: parseFloat(params.recyclerRating || '4.8'),
        distance: params.recyclerDistance || '0.5 km',
        phone: params.recyclerPhone || '+233241234568',
        vehicleType: 'Big Truck',
        estimatedPrice: params.estimatedPrice,
        estimatedArrival: params.estimatedArrival
      };
      
      setRecyclerInfo(recyclerData);

      // Load pickup request from database
      if (params.requestId) {
        const { data: requestData, error } = await supabase
          .from('pickup_requests')
          .select('*')
          .eq('id', params.requestId)
          .single();

        if (error) throw error;
        setPickupRequest(requestData);
      }

    } catch (err) {
      console.error('Error loading initial data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [params.recyclerId, params.recyclerName, params.recyclerRating, params.recyclerDistance, params.recyclerPhone, params.estimatedPrice, params.estimatedArrival, params.requestId]);

  // Check pickup request status
  const checkRequestStatus = useCallback(async () => {
    if (!params.requestId || isCheckingStatus.current) return;

    try {
      isCheckingStatus.current = true;
      
      const { data: requestData, error } = await supabase
        .from('pickup_requests')
        .select('*')
        .eq('id', params.requestId)
        .single();

      if (error) throw error;

      setPickupRequest(requestData);

      // Check if recycler has accepted the request
      if (requestData.status === 'accepted' || requestData.status === 'in_progress') {
        setShowConfirmation(true);
        // Clear status check interval since request is accepted
        if (statusCheckIntervalRef.current) {
          clearInterval(statusCheckIntervalRef.current);
          statusCheckIntervalRef.current = null;
        }
      } else if (requestData.status === 'cancelled' || requestData.status === 'rejected') {
        // Handle cancellation or rejection
        const requestRejected = requestData.status === 'rejected';
        const reason = requestData.recycler_notes || 'No reason provided';
        
        // Set rejection state
        if (requestRejected) {
          setIsRejected(true);
          setRejectionReason(reason);
        }
        
        Alert.alert(
          requestRejected ? 'Request Rejected' : 'Request Cancelled',
          requestRejected 
            ? `Unfortunately, your pickup request was rejected.\n\nReason: "${reason}"\n\nYou can try requesting from a different recycler.`
            : `This pickup request has been cancelled.`,
          [
            { 
              text: 'Try Different Recycler', 
              onPress: () => {
                // Navigate back to select truck screen to try again
                router.push('/customer-screens/SelectTruck');
              }
            },
            { 
              text: 'Go Home', 
              onPress: () => router.push('/customer-screens/HomeScreen')
            }
          ]
        );
      }

    } catch (err) {
      console.error('Error checking request status:', err);
    } finally {
      isCheckingStatus.current = false;
    }
  }, [params.requestId, router]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Timer effect and status checking
  useEffect(() => {
    if (!recyclerInfo || !pickupRequest) return; // Don't start until data is loaded
    
    // Start timer
    intervalRef.current = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Check request status every 3 seconds
    statusCheckIntervalRef.current = setInterval(() => {
      checkRequestStatus();
    }, 3000);

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }
    };
  }, [recyclerInfo, pickupRequest, checkRequestStatus]); // Added checkRequestStatus back but it's memoized with useCallback

  // Format time display
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle cancel request
  const handleCancelRequest = () => {
    Alert.alert(
      'Cancel Pickup',
      'Are you sure you want to cancel this pickup request?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes, Cancel', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (params.requestId) {
                // Update pickup request status to 'cancelled' in database
                await supabase
                  .from('pickup_requests')
                  .update({
                    status: 'cancelled',
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', params.requestId);
              }
              router.back();
            } catch (error) {
              console.error('Error cancelling request:', error);
              router.back(); // Still go back even if database update fails
            }
          }
        }
      ]
    );
  };

  // Handle contact recycler
  const handleContactRecycler = () => {
    if (recyclerInfo?.phone) {
      Alert.alert(
        'Contact Recycler',
        `Call ${recyclerInfo?.name || 'Recycler'} at ${recyclerInfo?.phone || 'Unknown'}`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Call', 
            onPress: () => {
              console.log('Calling recycler:', recyclerInfo?.phone);
              Alert.alert('Call Recycler', 'Phone call functionality would be implemented here.');
            }
          }
        ]
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="refresh" size={64} color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading pickup request...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!recyclerInfo || !pickupRequest) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load pickup request information</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pickup Request</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Status */}
        <View style={styles.card}>
          <Ionicons 
            name={isRejected ? "close-circle" : showConfirmation ? "checkmark-circle" : "time"} 
            size={40} 
            color={isRejected ? COLORS.red : showConfirmation ? COLORS.green : COLORS.orange} 
          />
          <Text style={styles.title}>
            {isRejected ? 'Request Rejected' : showConfirmation ? 'Request Accepted!' : 'Waiting for Response...'}
          </Text>
          <Text style={styles.subtitle}>
            {isRejected 
              ? `Unfortunately, your request was rejected. Reason: "${rejectionReason}"`
              : showConfirmation 
                ? `${recyclerInfo?.name || 'Recycler'} accepted your request and will start moving to your location soon`
                : `Sent to ${recyclerInfo?.name || 'recycler'}`
            }
          </Text>
        </View>

        {/* Time */}
        <View style={styles.card}>
          <Text style={styles.timeText}>{formatTime(timeElapsed)}</Text>
          <Text style={styles.timeLabel}>Time elapsed</Text>
        </View>

        {/* Details */}
        <View style={styles.card}>
          <Text style={styles.detailText}>
            📍 {pickupRequest?.pickup_address || 'Loading...'}
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          {isRejected ? (
            <>
              <TouchableOpacity 
                style={styles.trackButton}
                onPress={() => {
                  router.push('/customer-screens/SelectTruck');
                }}
              >
                <Text style={styles.trackButtonText}>Try Different Recycler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => router.push('/customer-screens/HomeScreen')}
              >
                <Text style={styles.cancelButtonText}>Go Home</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {showConfirmation && recyclerInfo && (
                <TouchableOpacity 
                  style={styles.trackButton}
                  onPress={() => {
                    router.push({
                      pathname: '/customer-screens/TrackingScreen',
                      params: { 
                        requestId: params.requestId || 'req_001',
                        recyclerName: recyclerInfo.name,
                        recyclerPhone: recyclerInfo.phone,
                        pickup: pickupRequest?.pickup_address || 'Loading...',
                        estimatedPrice: recyclerInfo.estimatedPrice,
                        estimatedArrival: recyclerInfo.estimatedArrival
                      }
                    });
                  }}
                >
                  <Text style={styles.trackButtonText}>Track Pickup</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRequest}>
                <Text style={styles.cancelButtonText}>Cancel Request</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  timeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  timeLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
  },
  detailText: {
    fontSize: 16,
    color: COLORS.primary,
    marginBottom: 8,
  },
  buttons: {
    gap: 12,
  },
  trackButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  trackButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.red,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.red,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.primary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: COLORS.red,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
}); 