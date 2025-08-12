import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, DIMENSIONS } from '../../constants';
import { formatSecondsToTime } from '../../constants/helpers';
import { apiService } from '../../services/apiService';
import CommonHeader from '../components/CommonHeader';

interface RequestStatus {
  id: string;
  status: 'pending' | 'accepted' | 'rejected' | 'in_progress' | 'completed' | 'cancelled';
  recycler_id?: string;
  recycler_name?: string;
  recycler_phone?: string;
  pickup_address: string;
  waste_type: string;
  weight: number;
  created_at: string;
  accepted_at?: string;
  rejection_reason?: string;
}

export default function WaitingForRecyclerScreen() {
  const params = useLocalSearchParams();
  const requestId = params.requestId as string;
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [requestStatus, setRequestStatus] = useState<RequestStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Animation for the loading indicator
  const spinValue = useMemo(() => new Animated.Value(0), []);
  
  useEffect(() => {
    if (!requestId) {
      setError('No request ID provided');
      setIsLoading(false);
      return;
    }

    // Start spinning animation
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    );
    spinAnimation.start();

    // Timer to track elapsed time
    const timer = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // Fetch initial request status
    fetchRequestStatus();

    // Poll for status updates every 10 seconds
    const statusPolling = setInterval(() => {
      fetchRequestStatus();
    }, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(statusPolling);
      spinAnimation.stop();
    };
  }, [requestId, spinValue]);

  const fetchRequestStatus = async () => {
    try {
      const response = await apiService.getWasteCollection(requestId);
      
      if (response) {
        const status: RequestStatus = {
          id: response.id,
          status: response.status,
          recycler_id: response.recycler_id,
          recycler_name: response.recycler_id ? 'Recycler' : undefined, // Placeholder since we don't have recycler details
          recycler_phone: undefined, // We don't have this in the current interface
          pickup_address: response.pickup_address || '',
          waste_type: response.waste_type,
          weight: response.weight || 0,
          created_at: response.created_at,
          accepted_at: undefined, // Not in current interface
          rejection_reason: undefined // Not in current interface
        };

        setRequestStatus(status);
        setIsLoading(false);

        // Stop animation if request is no longer pending
        if (status.status !== 'pending') {
          spinValue.stopAnimation();
        }
      }
    } catch (err) {
      console.error('Error in fetchRequestStatus:', err);
      setError('Network error occurred');
    }
  };

  const handleCancel = async () => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this pickup request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.updateWasteStatus(requestId, 'cancelled');
              
              if (response) {
                Alert.alert('Request Cancelled', 'Your pickup request has been cancelled successfully.');
                router.back();
              } else {
                Alert.alert('Error', 'Failed to cancel request');
              }
            } catch (err) {
              Alert.alert('Error', 'Failed to cancel request');
            }
          }
        }
      ]
    );
  };

  const handleConfirmed = () => {
    if (!requestStatus) return;
    
    // Navigate to tracking screen
    router.push({
      pathname: '/customer-screens/TrackingScreen' as any,
      params: { 
        requestId: requestId,
        recyclerName: requestStatus.recycler_name || 'Recycler',
        pickup: requestStatus.pickup_address
      }
    });
  };

  const handleRejected = () => {
    router.back();
  };

  const handleSelectNewRecycler = () => {
    router.push({
      pathname: '/customer-screens/SelectTruckScreen' as any,
      params: { requestId: requestId }
    });
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <CommonHeader title="Loading..." />
        <View style={styles.content}>
          <Text style={styles.subtitle}>Loading request details...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <CommonHeader title="Error" />
        <View style={styles.content}>
          <Text style={styles.errorText}>❌</Text>
          <Text style={styles.subtitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.confirmButton} onPress={() => router.back()}>
            <Text style={styles.confirmButtonText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!requestStatus) {
    return (
      <View style={styles.container}>
        <CommonHeader title="Request Not Found" />
        <View style={styles.content}>
          <Text style={styles.errorText}>❌</Text>
          <Text style={styles.subtitle}>Request not found</Text>
          <TouchableOpacity style={styles.confirmButton} onPress={() => router.back()}>
            <Text style={styles.confirmButtonText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show different UI based on status
  switch (requestStatus.status) {
    case 'accepted':
      return (
        <View style={styles.container}>
          <CommonHeader title="Pickup Confirmed!" />

          <View style={styles.bannerBg}>
            <Image
              source={require('../../assets/images/blend.jpg')}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={styles.headerCard}>
              <Text style={styles.header}>Pickup Confirmed!</Text>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.successIcon}>
              <Text style={styles.successText}>✅</Text>
            </View>
            <Text style={styles.subtitle}>
              {requestStatus.recycler_name || 'A recycler'} has confirmed your pickup request
            </Text>
            
            {requestStatus.recycler_phone && (
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Recycler Contact:</Text>
                <Text style={styles.contactValue}>{requestStatus.recycler_phone}</Text>
              </View>
            )}
            
            <Text style={styles.locationText}>
              Pickup at: <Text style={styles.boldText}>{requestStatus.pickup_address}</Text>
            </Text>
            
            <Text style={styles.wasteInfo}>
              {requestStatus.waste_type} • {requestStatus.weight}kg
            </Text>
            
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmed}>
              <Text style={styles.confirmButtonText}>TRACK PICKUP</Text>
            </TouchableOpacity>
          </View>
        </View>
      );

    case 'rejected':
      return (
        <View style={styles.container}>
          <CommonHeader title="Request Rejected" />

          <View style={styles.bannerBg}>
            <Image
              source={require('../../assets/images/blend.jpg')}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={styles.headerCard}>
              <Text style={styles.header}>Request Rejected</Text>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.errorIcon}>
              <Text style={styles.errorText}>❌</Text>
            </View>
            <Text style={styles.subtitle}>
              Your pickup request was not accepted by the recycler
            </Text>
            
            {requestStatus.rejection_reason && (
              <View style={styles.rejectionContainer}>
                <Text style={styles.rejectionLabel}>Reason:</Text>
                <Text style={styles.rejectionReason}>{requestStatus.rejection_reason}</Text>
              </View>
            )}
            
            <Text style={styles.locationText}>
              Location: <Text style={styles.boldText}>{requestStatus.pickup_address}</Text>
            </Text>
            
            <Text style={styles.wasteInfo}>
              {requestStatus.waste_type} • {requestStatus.weight}kg
            </Text>
            
            <View style={styles.rejectionActions}>
              <TouchableOpacity style={styles.selectNewRecyclerButton} onPress={handleSelectNewRecycler}>
                <Text style={styles.selectNewRecyclerButtonText}>SELECT NEW RECYCLER</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.tryAgainButton} onPress={handleRejected}>
                <Text style={styles.tryAgainButtonText}>TRY AGAIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );

    case 'in_progress':
      return (
        <View style={styles.container}>
          <CommonHeader title="Pickup In Progress" />

          <View style={styles.bannerBg}>
            <Image
              source={require('../../assets/images/blend.jpg')}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={styles.headerCard}>
              <Text style={styles.header}>Pickup In Progress</Text>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.successIcon}>
              <Text style={styles.successText}>🚚</Text>
            </View>
            <Text style={styles.subtitle}>
              {requestStatus.recycler_name || 'The recycler'} is on their way
            </Text>
            
            <Text style={styles.locationText}>
              Pickup at: <Text style={styles.boldText}>{requestStatus.pickup_address}</Text>
            </Text>
            
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmed}>
              <Text style={styles.confirmButtonText}>TRACK PICKUP</Text>
            </TouchableOpacity>
          </View>
        </View>
      );

    case 'completed':
      return (
        <View style={styles.container}>
          <CommonHeader title="Pickup Completed" />

          <View style={styles.bannerBg}>
            <Image
              source={require('../../assets/images/blend.jpg')}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={styles.headerCard}>
              <Text style={styles.header}>Pickup Completed!</Text>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.successIcon}>
              <Text style={styles.successText}>🎉</Text>
            </View>
            <Text style={styles.subtitle}>
              Your waste pickup has been completed successfully!
            </Text>
            
            <Text style={styles.locationText}>
              Location: <Text style={styles.boldText}>{requestStatus.pickup_address}</Text>
            </Text>
            
            <Text style={styles.wasteInfo}>
              {requestStatus.waste_type} • {requestStatus.weight}kg
            </Text>
            
            <TouchableOpacity style={styles.confirmButton} onPress={() => router.back()}>
              <Text style={styles.confirmButtonText}>VIEW HISTORY</Text>
            </TouchableOpacity>
          </View>
        </View>
      );

    default: // pending status
      return (
        <View style={styles.container}>
          <CommonHeader title="Waiting for Recycler" />

          <View style={styles.bannerBg}>
            <Image
              source={require('../../assets/images/blend.jpg')}
              style={styles.bannerImage}
              resizeMode="cover"
            />
            <View style={styles.headerCard}>
              <Text style={styles.header}>Waiting for Recycler</Text>
            </View>
          </View>

          <View style={styles.content}>
            {/* Loading Animation */}
            <Animated.View style={[styles.loadingContainer, { transform: [{ rotate: spin }] }]}>
              <Image 
                source={require('../../assets/images/truck.png')} 
                style={styles.loadingTruck}
              />
            </Animated.View>

            {/* Status Text */}
            <Text style={styles.subtitle}>
              Sending pickup request to recyclers...
            </Text>
            
            {/* Time Elapsed */}
            <View style={styles.timeContainer}>
              <Text style={styles.timeLabel}>Time elapsed:</Text>
              <Text style={styles.timeText}>{formatSecondsToTime(timeElapsed)}</Text>
            </View>

            {/* Request Details */}
            <View style={styles.requestDetails}>
              <Text style={styles.detailLabel}>Waste Type:</Text>
              <Text style={styles.detailValue}>{requestStatus.waste_type}</Text>
            </View>
            
            <View style={styles.requestDetails}>
              <Text style={styles.detailLabel}>Weight:</Text>
              <Text style={styles.detailValue}>{requestStatus.weight}kg</Text>
            </View>

            {/* Location Info */}
            <Text style={styles.locationText}>
              Pickup at: <Text style={styles.boldText}>{requestStatus.pickup_address}</Text>
            </Text>

            {/* Cancel Button */}
            <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>CANCEL REQUEST</Text>
            </TouchableOpacity>

            {/* Status Message */}
            <Text style={styles.statusMessage}>
              Please wait while recyclers review your request...
            </Text>
          </View>
        </View>
      );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  bannerBg: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20, // Increased spacing
    marginTop: 20, // Added top margin for better spacing
    position: 'relative',
    // Removed marginHorizontal to center properly
  },
  bannerImage: {
    width: '100%',
    height: 100, // Increased height for better visual impact
    borderRadius: 20, // Full rounded corners for modern look
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5, // Android shadow
  },
  headerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
    position: 'absolute',
    left: 70,
    right: 0,
    top: 25,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '70%',
    height: '50%',
    alignSelf: 'center',
   
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24, // Increased horizontal padding
    paddingTop: 20, // Added top padding
  },
  loadingContainer: {
    marginBottom: 40, // Increased spacing
    alignItems: 'center',
  },
  loadingTruck: {
    width: 100, // Increased size
    height: 80, // Increased size
    resizeMode: 'contain',
  },
  successIcon: {
    marginBottom: 30, // Increased spacing
    alignItems: 'center',
  },
  successText: {
    fontSize: 80, // Increased size for better impact
  },
  subtitle: {
    fontSize: 18, // Increased font size
    color: COLORS.darkGreen,
    textAlign: 'center',
    marginBottom: 25, // Increased spacing
    lineHeight: 24, // Increased line height
    fontWeight: '500', // Added medium weight
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20, // Increased spacing
    backgroundColor: COLORS.lightGreen,
    paddingHorizontal: 20, // Increased padding
    paddingVertical: 12, // Increased padding
    borderRadius: DIMENSIONS.borderRadius,
    shadowColor: COLORS.black,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timeLabel: {
    fontSize: 16, // Increased font size
    color: COLORS.darkGreen,
    marginRight: 10, // Increased spacing
    fontWeight: '500', // Added medium weight
  },
  timeText: {
    fontSize: 18, // Increased font size
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  locationText: {
    fontSize: 16, // Increased font size
    color: COLORS.darkGreen,
    textAlign: 'center',
    marginBottom: 35, // Increased spacing
    fontWeight: '500', // Added medium weight
  },
  boldText: {
    fontWeight: 'bold',
    color: COLORS.darkGreen,
  },
  cancelButton: {
    backgroundColor: COLORS.red,
    paddingHorizontal: 35, // Increased padding
    paddingVertical: 15, // Increased padding
    borderRadius: DIMENSIONS.borderRadius,
    marginBottom: 25, // Increased spacing
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButtonText: {
    color: COLORS.white,
    fontSize: 16, // Increased font size
    fontWeight: 'bold',
    letterSpacing: 0.5, // Better text spacing
  },
  confirmButton: {
    backgroundColor: '#1C3301', // Updated to specific green color
    paddingHorizontal: 45, // Increased padding
    paddingVertical: 18, // Increased padding
    borderRadius: DIMENSIONS.borderRadius,
    marginTop: 15, // Increased spacing
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 18, // Increased font size
    fontWeight: 'bold',
    letterSpacing: 0.5, // Better text spacing
  },
  statusMessage: {
    fontSize: 14, // Increased font size
    color: COLORS.gray,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 25, // Increased spacing
    lineHeight: 18, // Added line height
  },
  errorText: {
    fontSize: 80,
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 20,
  },
  contactInfo: {
    marginTop: 10,
    marginBottom: 20,
  },
  contactLabel: {
    fontSize: 16,
    color: COLORS.darkGreen,
    fontWeight: '500',
  },
  contactValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  errorIcon: {
    marginBottom: 10,
  },
  rejectionContainer: {
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: COLORS.lightRed,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: DIMENSIONS.borderRadius,
    borderWidth: 1,
    borderColor: COLORS.red,
  },
  rejectionLabel: {
    fontSize: 16,
    color: COLORS.red,
    fontWeight: '500',
    marginBottom: 5,
  },
  rejectionReason: {
    fontSize: 14,
    color: COLORS.red, // Using red instead of darkRed
    fontStyle: 'italic',
  },
  wasteInfo: {
    fontSize: 16,
    color: COLORS.darkGreen,
    marginTop: 10,
    marginBottom: 30,
  },
  requestDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  detailLabel: {
    fontSize: 16,
    color: COLORS.darkGreen,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  rejectionActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
  },
  selectNewRecyclerButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: DIMENSIONS.borderRadius,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectNewRecyclerButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  tryAgainButton: {
    backgroundColor: COLORS.red,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: DIMENSIONS.borderRadius,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tryAgainButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
}); 