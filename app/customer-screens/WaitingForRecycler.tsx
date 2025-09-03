import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to prevent infinite loops
  const confirmationTimerRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const statusCheckIntervalRef = useRef<number | null>(null);

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
  }, [params]);

  // Check pickup request status
  const checkRequestStatus = useCallback(async () => {
    if (!params.requestId) return;

    try {
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
        Alert.alert(
          'Request Cancelled',
          `This pickup request has been ${requestData.status === 'rejected' ? 'rejected by the recycler' : 'cancelled'}.`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }

    } catch (err) {
      console.error('Error checking request status:', err);
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
  }, [recyclerInfo, pickupRequest, checkRequestStatus]); // Run when data changes

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Waiting for Recycler</Text>
        
        <View style={styles.placeholder} />
      </View>

      {/* Background Image with Status Banner */}
      <View style={styles.bannerContainer}>
        <Image
          source={require('../../assets/images/blend.jpg')}
          style={styles.bannerImage}
          resizeMode="cover"
        />
        
        <View style={styles.statusBanner}>
          <Text style={styles.statusTitle}>
            {showConfirmation ? 'Request Accepted! 🎉' : 'Waiting for Response...'}
          </Text>
          <Text style={styles.statusSubtitle}>
            {showConfirmation 
              ? `${recyclerInfo?.name || 'Recycler'} has accepted your pickup request and will be on their way soon!`
              : `Your request has been sent to ${recyclerInfo?.name || 'the recycler'}. Waiting for their response...`
            }
          </Text>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Recycler Profile Card - Only show when confirmed */}
        {showConfirmation && recyclerInfo ? (
          <View style={styles.recyclerCard}>
            <View style={styles.recyclerHeader}>
              <Image 
                source={require('../../assets/images/_MG_2771.jpg')} 
                style={styles.recyclerImage} 
              />
              <View style={styles.recyclerInfo}>
                <Text style={styles.recyclerName}>{recyclerInfo?.name || 'Recycler'}</Text>
                <View style={styles.ratingContainer}>
                  <Text style={styles.ratingText}>⭐ {recyclerInfo?.rating || 0}</Text>
                  <Text style={styles.distanceText}>{recyclerInfo?.distance || '0 km'}</Text>
                </View>
              </View>
              {recyclerInfo?.phone && (
                <TouchableOpacity 
                  style={styles.contactButton}
                  onPress={handleContactRecycler}
                >
                  <Ionicons name="call" size={20} color={COLORS.white} />
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.vehicleInfo}>
              <Image 
                source={require('../../assets/images/truck.png')} 
                style={styles.vehicleIcon} 
              />
              <Text style={styles.vehicleText}>{recyclerInfo?.vehicleType || 'Vehicle'}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.waitingCard}>
            <View style={styles.waitingIcon}>
              <Ionicons name="hourglass" size={64} color={COLORS.primary} />
            </View>
            <Text style={styles.waitingTitle}>Request Sent to Recycler</Text>
            <Text style={styles.waitingSubtitle}>
              {recyclerInfo?.name || 'The recycler'} will review your pickup request and respond shortly...
            </Text>
          </View>
        )}

        {/* Time Elapsed Card */}
        <View style={styles.timeCard}>
          <View style={styles.timeHeader}>
            <Ionicons name="time" size={24} color={COLORS.primary} />
            <Text style={styles.timeTitle}>Time Elapsed</Text>
          </View>
          <Text style={styles.timeValue}>{formatTime(timeElapsed)}</Text>
          <Text style={styles.timeSubtitle}>
            {showConfirmation ? 'Recycler accepted - waiting for arrival' : 'Waiting for recycler response'}
          </Text>
        </View>

        {/* Pickup Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Pickup Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="location" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Pickup Location</Text>
              <Text style={styles.detailValue}>
                {pickupRequest?.pickup_address || 'Loading...'}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="leaf" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Waste Type</Text>
              <Text style={styles.detailValue}>
                {pickupRequest ? `${pickupRequest.waste_type} • ${pickupRequest.estimated_weight}kg` : 'Loading...'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {showConfirmation && recyclerInfo ? (
            <>
              <TouchableOpacity 
                style={[
                  styles.trackButton,
                  !recyclerInfo && styles.trackButtonDisabled
                ]}
                onPress={() => {
                  if (recyclerInfo) {
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
                  }
                }}
                disabled={!recyclerInfo}
              >
                <Ionicons name="navigate" size={20} color={COLORS.white} />
                <Text style={styles.trackButtonText}>
                  {recyclerInfo ? 'Track Pickup' : 'Loading...'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancelRequest}
              >
                <Ionicons name="close-circle" size={20} color={COLORS.red} />
                <Text style={styles.cancelButtonText}>Cancel Request</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancelRequest}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.red} />
              <Text style={styles.cancelButtonText}>Cancel Request</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Status Message */}
        <View style={styles.statusMessage}>
          <Ionicons name="information-circle" size={20} color={COLORS.gray} />
          <Text style={styles.statusMessageText}>
            {showConfirmation 
              ? 'The recycler will contact you when they arrive at your location'
              : `Your request is now with ${recyclerInfo?.name || 'the recycler'}. They will accept or reject it soon.`
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
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  placeholder: {
    width: 40,
  },
  bannerContainer: {
    position: 'relative',
    height: 140,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 30,
    borderRadius: 20,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  statusBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  recyclerCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  recyclerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recyclerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  recyclerInfo: {
    flex: 1,
  },
  recyclerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingText: {
    fontSize: 16,
    color: COLORS.gray,
    fontWeight: '600',
  },
  distanceText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
  },
  contactButton: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactButtonDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 0.6,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  vehicleIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  vehicleText: {
    fontSize: 16,
    color: COLORS.gray,
    fontWeight: '600',
  },
  timeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginLeft: 8,
  },
  timeValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  timeSubtitle: {
    fontSize: 14,
    color: COLORS.gray,
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '600',
    lineHeight: 22,
  },
  actionButtons: {
    gap: 16,
    marginBottom: 30,
  },
  trackButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  trackButtonDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 0.6,
  },
  trackButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.red,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButtonText: {
    color: COLORS.red,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  statusMessageText: {
    fontSize: 14,
    color: COLORS.gray,
    marginLeft: 8,
    lineHeight: 20,
    flex: 1,
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
  waitingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 40,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  waitingIcon: {
    marginBottom: 20,
  },
  waitingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  waitingSubtitle: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
}); 