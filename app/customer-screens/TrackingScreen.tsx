import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapComponent from '../../components/MapComponent';
import { COLORS, DIMENSIONS } from '../../constants';
import { apiService } from '../../services/apiService';
import CommonHeader from '../components/CommonHeader';

interface TrackingData {
  requestId: string;
  recyclerId: string;
  recyclerName: string;
  recyclerPhone: string;
  pickupAddress: string;
  wasteType: string;
  weight: number;
  status: string;
}

interface PaymentSummary {
  id: string;
  requestId: string;
  weight: string;
  wasteType: string;
  rate: string;
  subtotal: string;
  environmentalTax: string;
  totalAmount: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export default function TrackingScreen() {
  const params = useLocalSearchParams();
  const requestId = params.requestId as string;
  const recyclerName = params.recyclerName as string;
  const pickup = params.pickup as string;
  
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [hasReachedDestination, setHasReachedDestination] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showPaymentButton, setShowPaymentButton] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [recyclerLocation, setRecyclerLocation] = useState({
    latitude: 6.6734,
    longitude: -1.5714,
  });
  const [destinationLocation, setDestinationLocation] = useState({
    latitude: 6.6834,
    longitude: -1.5814,
  });
  const [routeCoordinates, setRouteCoordinates] = useState<Array<{latitude: number, longitude: number}>>([]);
  const [distanceToCustomer, setDistanceToCustomer] = useState(0);
  const [etaToCustomer, setEtaToCustomer] = useState(0);
  const [isTrackingActive, setIsTrackingActive] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [isWeightCalculation, setIsWeightCalculation] = useState(false);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);

  // Get tracking data when component mounts
  useEffect(() => {
    if (requestId) {
      fetchTrackingData();
      startTrackingUpdates();
      startStatusPolling(); // Start polling for status updates
      startPaymentPolling(); // Start polling for payment summary
    }
  }, [requestId]);

  // Timer for elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Simulate arrival after 10 seconds (for demo purposes)
  useEffect(() => {
    const destinationTimer = setTimeout(() => {
      setHasReachedDestination(true);
      setShowPopup(true);
    }, 10000);

    return () => clearTimeout(destinationTimer);
  }, []);

  // Poll for payment summary updates
  const startPaymentPolling = () => {
    const paymentInterval = setInterval(async () => {
      if (hasArrived && !paymentSummary) {
        await checkPaymentSummary();
      }
    }, 5000); // Check every 5 seconds after arrival

    return () => clearInterval(paymentInterval);
  };

  // Check if payment summary has been sent by recycler
  const checkPaymentSummary = async () => {
    try {
      setIsLoadingPayment(true);
      // In a real app, this would call an API to check for payment summary
      // For now, we'll simulate the check with mock data
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock payment summary data (in real app, this comes from backend)
      const mockPaymentSummary: PaymentSummary = {
        id: 'payment-1',
        requestId: requestId,
        weight: '8.5 kg',
        wasteType: 'Plastic',
        rate: 'GHS 1.20/kg',
        subtotal: 'GHS 10.20',
        environmentalTax: 'GHS 0.51',
        totalAmount: 'GHS 10.71',
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      
      setPaymentSummary(mockPaymentSummary);
      setIsLoadingPayment(false);
    } catch (error) {
      console.error('Error checking payment summary:', error);
      setIsLoadingPayment(false);
    }
  };

  // Poll for status updates to detect arrival
  const startStatusPolling = () => {
    const statusInterval = setInterval(async () => {
      try {
        const response = await apiService.getWasteCollection(requestId);
        if (response && response.status === 'in_progress' && !hasReachedDestination) {
          // Recycler has arrived (status changed to 'in_progress')
          setHasReachedDestination(true);
          setShowPopup(true);
          setIsTrackingActive(false);
          
          // Show arrival notification
          Alert.alert(
            '🚚 Recycler Has Arrived!',
            `${trackingData?.recyclerName || 'Your recycler'} has reached your location and is ready to collect your waste.\n\nPlease prepare your waste for pickup.`,
            [
              { 
                text: 'OK', 
                onPress: () => {
                  console.log('Customer acknowledged recycler arrival via status polling');
                }
              }
            ]
          );
          
          clearInterval(statusInterval); // Stop polling once arrived
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(statusInterval);
  };

  const fetchTrackingData = async () => {
    try {
      const response = await apiService.getWasteCollection(requestId);
      if (response) {
        setTrackingData({
          requestId: response.id,
          recyclerId: response.recycler_id || 'mock-recycler-id', // Assuming recycler_id is available in the response
          recyclerName: recyclerName || 'Recycler',
          recyclerPhone: '+233 XX XXX XXXX', // In real app, get from recycler profile
          pickupAddress: pickup || response.pickup_address || 'Location not specified',
          wasteType: response.waste_type,
          weight: response.weight || 0,
          status: response.status
        });
      }
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      // Use fallback data
      setTrackingData({
        requestId: requestId || 'mock-id',
        recyclerId: 'mock-recycler-id', // Mock for recyclerId
        recyclerName: recyclerName || 'Recycler',
        recyclerPhone: '+233 XX XXX XXXX',
        pickupAddress: pickup || 'Location not specified',
        wasteType: 'Plastic',
        weight: 10,
        status: 'in_progress'
      });
    }
  };

  const startTrackingUpdates = () => {
    setIsTrackingActive(true);
    
    // Simulate real-time location updates from recycler
    // In a real app, this would come from WebSockets or real-time API calls
    const trackingInterval = setInterval(() => {
      // Simulate recycler moving towards customer
      setRecyclerLocation(prev => {
        const newLat = prev.latitude + (Math.random() - 0.5) * 0.001; // Small random movement
        const newLng = prev.longitude + (Math.random() - 0.5) * 0.001;
        
        const newLocation = {
          latitude: newLat,
          longitude: newLng,
        };
        
        // Update route coordinates
        setRouteCoordinates(prev => [...prev, newLocation]);
        
        // Calculate distance and ETA
        const distance = calculateDistance(newLocation, destinationLocation);
        setDistanceToCustomer(distance);
        
        const etaMinutes = Math.round((distance / 30) * 60); // Assuming 30 km/h average speed
        setEtaToCustomer(etaMinutes);
        
        // Check if recycler has arrived (within 50 meters)
        checkArrival(distance);
        
        return newLocation;
      });
    }, 3000); // Update every 3 seconds
    
    // Cleanup interval on unmount
    return () => clearInterval(trackingInterval);
  };

  const calculateDistance = (point1: {latitude: number, longitude: number}, point2: {latitude: number, longitude: number}) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.latitude - point1.latitude) * Math.PI / 180;
    const dLon = (point2.longitude - point1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1.latitude * Math.PI / 180) * Math.cos(point2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const checkArrival = (dist: number) => {
    if (dist < 0.05 && !hasArrived) { // Within 50 meters
      setHasArrived(true);
      setIsTrackingActive(false);
      
      // Show arrival notification
      Alert.alert(
        '🎉 Recycler Arrived!',
        'The recycler has reached your location. They will now collect and weigh your waste to calculate the payment.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Update status to indicate weight calculation phase
              setIsWeightCalculation(true);
            }
          }
        ]
      );
    }
  };

  const handleCall = () => {
    if (!trackingData) return;
    
    // Navigate to CallRecyclerScreen
    router.push({
      pathname: '/customer-screens/CallRecyclerScreen' as any,
      params: { 
        requestId: requestId,
        recyclerName: trackingData.recyclerName,
        recyclerPhone: trackingData.recyclerPhone,
        pickup: trackingData.pickupAddress 
      }
    });
  };
  
  const handleText = () => {
    if (!trackingData) return;
    
    // Navigate to TextRecyclerScreen
    router.push({
      pathname: '/customer-screens/TextRecyclerScreen' as any,
      params: { 
        requestId: requestId,
        recyclerName: trackingData.recyclerName,
        recyclerPhone: trackingData.recyclerPhone,
        pickup: trackingData.pickupAddress 
      }
    });
  };
  
  const handleCancel = () => {
    Alert.alert(
      'Cancel Pickup',
      'Are you sure you want to cancel your pickup?',
      [
        {
          text: 'No',
          style: 'cancel',
          onPress: () => {
            // Stay on tracking screen - do nothing
          }
        },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              // Update status to cancelled
              await apiService.updateWasteStatus(requestId, 'cancelled');
              
              // Navigate back to SelectTruck screen with pickup parameter
              router.push({
                pathname: '/customer-screens/SelectTruck' as any,
                params: { pickup: pickup }
              });
            } catch (error) {
              console.error('Error cancelling pickup:', error);
              Alert.alert('Error', 'Failed to cancel pickup. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleCheckPaymentDue = async () => {
    if (!paymentSummary) {
      // No payment summary yet - show waiting message
      Alert.alert(
        '⏳ Payment Summary Not Ready',
        'Your recycler is still calculating the weight and preparing your payment summary. Please wait a moment and try again.',
        [
          { text: 'OK' },
          { 
            text: 'Check Again', 
            onPress: async () => {
              setIsLoadingPayment(true);
              await checkPaymentSummary();
              setIsLoadingPayment(false);
            }
          }
        ]
      );
      return;
    }

    // Payment summary exists - navigate to payment summary screen
    router.push({
      pathname: '/customer-screens/PaymentSummary' as any,
      params: { 
        requestId: requestId,
        recyclerId: trackingData?.recyclerId || 'mock-recycler-id',
        recyclerName: trackingData?.recyclerName || recyclerName,
        pickup: trackingData?.pickupAddress || pickup,
        paymentSummaryId: paymentSummary.id,
        weight: paymentSummary.weight,
        wasteType: paymentSummary.wasteType,
        rate: paymentSummary.rate,
        subtotal: paymentSummary.subtotal,
        environmentalTax: paymentSummary.environmentalTax,
        totalAmount: paymentSummary.totalAmount
      }
    });
  };

  const handlePopupOK = () => {
    setShowPopup(false);
    setShowPaymentButton(true);
  };

  if (!trackingData) {
    return (
      <View style={styles.container}>
        <CommonHeader title="Loading..." />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading tracking information...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CommonHeader title="Track Pickup" />
      
      <View style={styles.content}>
        {/* Arrival Notification Modal */}
        <Modal
          visible={showPopup}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>🎉 Recycler Has Arrived!</Text>
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.modalText}>
                  {trackingData?.recyclerName || 'Your recycler'} has reached your location and is ready to collect your waste.
                </Text>
                <Text style={styles.modalSubtext}>
                  Please prepare your waste for pickup. The recycler will collect it from your specified location.
                </Text>
                
                {/* Additional arrival information */}
                <View style={styles.arrivalInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>📍 Location:</Text>
                    <Text style={styles.infoValue}>{trackingData?.pickupAddress}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>🗑️ Waste Type:</Text>
                    <Text style={styles.infoValue}>{trackingData?.wasteType} • {trackingData?.weight}kg</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>⏰ Time:</Text>
                    <Text style={styles.infoValue}>{new Date().toLocaleTimeString()}</Text>
                  </View>
                </View>
                
                <Text style={styles.modalInstructions}>
                  💡 Tip: Have your waste ready and accessible for quick collection.
                </Text>
              </View>
              <TouchableOpacity style={styles.modalButton} onPress={handlePopupOK}>
                <Text style={styles.modalButtonText}>Got It!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Live Tracking Map */}
        <View style={styles.mapContainer}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>
              {hasReachedDestination 
                ? '🎯 Recycler Has Arrived!' 
                : isTrackingActive 
                ? '🚚 Live Tracking' 
                : '📍 Pickup Location'
              }
            </Text>
            <Text style={styles.mapSubtitle}>
              {hasReachedDestination
                ? 'Ready for waste collection • Navigation completed'
                : isTrackingActive 
                ? `${trackingData?.recyclerName || 'Recycler'} is on the way • ${distanceToCustomer.toFixed(1)} km away`
                : 'Recycler location will appear here'
              }
            </Text>
          </View>
          
          <MapComponent
            markers={[
              {
                id: 'recycler',
                coordinate: recyclerLocation,
                title: hasReachedDestination 
                  ? `${trackingData?.recyclerName || 'Recycler'} - Arrived!` 
                  : trackingData?.recyclerName || 'Recycler',
                description: hasReachedDestination 
                  ? 'Ready to collect waste' 
                  : 'Recycler current location',
                type: 'recycler',
              },
              {
                id: 'destination',
                coordinate: destinationLocation,
                title: 'Your Location',
                description: trackingData?.pickupAddress,
                type: 'destination',
              },
            ]}
            route={{
              coordinates: routeCoordinates.length > 0 ? routeCoordinates : [recyclerLocation, destinationLocation],
              color: hasReachedDestination ? COLORS.green : COLORS.darkGreen,
            }}
            style={styles.trackingMap}
            showUserLocation={true}
          />
          
          {/* Arrival Indicator Overlay */}
          {hasReachedDestination && (
            <View style={styles.arrivalOverlay}>
              <View style={styles.arrivalBadge}>
                <Text style={styles.arrivalBadgeText}>🎯 ARRIVED</Text>
              </View>
            </View>
          )}
        </View>

        {/* Tracking Information Card */}
        <View style={styles.trackingCard}>
          <View style={styles.trackingHeader}>
            <Feather name="truck" size={24} color={COLORS.darkGreen} />
            <Text style={styles.trackingTitle}>Pickup Progress</Text>
          </View>
          
          <View style={styles.trackingDetails}>
            <View style={styles.detailRow}>
              <Feather name="user" size={20} color={COLORS.gray} />
              <Text style={styles.detailText}>{trackingData.recyclerName}</Text>
            </View>
            <View style={styles.detailRow}>
              <Feather name="map-pin" size={20} color={COLORS.gray} />
              <Text style={styles.detailText}>{trackingData.pickupAddress}</Text>
            </View>
            <View style={styles.detailRow}>
              <Feather name="package" size={20} color={COLORS.gray} />
              <Text style={styles.detailText}>{trackingData.wasteType} • {trackingData.weight}kg</Text>
            </View>
          </View>
          
          <View style={styles.trackingStats}>
            <View style={styles.statItem}>
              <Feather name="clock" size={20} color={COLORS.darkGreen} />
              <Text style={styles.statValue}>{Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</Text>
              <Text style={styles.statLabel}>Time Elapsed</Text>
            </View>
            <View style={styles.statItem}>
              <Feather name="navigation" size={20} color={COLORS.darkGreen} />
              <Text style={styles.statValue}>
                {isTrackingActive ? `${distanceToCustomer.toFixed(1)} km` : '--'}
              </Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statItem}>
              <Feather name="target" size={20} color={COLORS.darkGreen} />
              <Text style={styles.statValue}>
                {isTrackingActive ? `${etaToCustomer} min` : '--'}
              </Text>
              <Text style={styles.statLabel}>ETA</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {!hasArrived ? (
            <>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleCall}
              >
                <Text style={styles.actionButtonText}>📞 Call Recycler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={handleText}
              >
                <Text style={styles.actionButtonText}>💬 Text Recycler</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.weightCalculationInfo}>
              <Text style={styles.weightCalculationText}>
                ⚖️ The recycler is now weighing your waste to calculate the payment amount.
              </Text>
              <Text style={styles.weightCalculationSubtext}>
                You'll receive a payment summary shortly.
              </Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={[
              styles.checkPaymentButton, 
              paymentSummary && styles.checkPaymentButtonActive
            ]} 
            onPress={handleCheckPaymentDue}
            disabled={isLoadingPayment}
          >
            {isLoadingPayment ? (
              <Text style={styles.checkPaymentButtonText}>⏳ Checking...</Text>
            ) : paymentSummary ? (
              <>
                <Feather name="credit-card" size={20} color="#1C3301" />
                <Text style={styles.checkPaymentButtonText}>💰 Payment Ready!</Text>
              </>
            ) : (
              <>
                <Feather name="credit-card" size={20} color="#1C3301" />
                <Text style={styles.checkPaymentButtonText}>💰 Check Payment</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Payment Status Indicator */}
          {hasArrived && (
            <View style={styles.paymentStatusContainer}>
              <Text style={styles.paymentStatusText}>
                {paymentSummary 
                  ? '✅ Payment Summary Ready' 
                  : '⏳ Waiting for Payment Summary'
                }
              </Text>
              {paymentSummary && (
                <Text style={styles.paymentAmountText}>
                  Total Due: {paymentSummary.totalAmount}
                </Text>
              )}
            </View>
          )}
        </View>

        {/* Cancel Button */}
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={handleCancel}
        >
          <Feather name="x-circle" size={20} color={COLORS.white} />
          <Text style={styles.cancelButtonText}>Cancel Pickup</Text>
        </TouchableOpacity>

        {/* Payment Button (shown after arrival) */}
        {showPaymentButton && (
          <TouchableOpacity 
            style={styles.paymentButton}
            onPress={handleCheckPaymentDue}
          >
            <Feather name="credit-card" size={20} color={COLORS.white} />
            <Text style={styles.paymentButtonText}>Check Payment Due</Text>
          </TouchableOpacity>
        )}

        {/* Status Indicator */}
        <View style={styles.statusIndicator}>
          <View style={[styles.statusDot, { backgroundColor: isTrackingActive ? COLORS.darkGreen : COLORS.gray }]} />
          <Text style={styles.statusText}>
            {hasArrived 
              ? (isWeightCalculation ? '⚖️ Calculating Weight...' : '🎯 Recycler Arrived!')
              : isTrackingActive 
                ? '🚚 Recycler En Route' 
                : '⏳ Waiting for Recycler'
            }
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGreen,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingText: {
    color: COLORS.darkGreen,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: DIMENSIONS.margin,
    marginTop: 10,
    marginBottom: 20,
  },
  mapContainer: {
    backgroundColor: COLORS.lightGreen,
    borderRadius: 20,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 300,
    marginBottom: 20,
  },
  mapHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  mapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 8,
    textAlign: 'center',
  },
  mapSubtitle: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  trackingMap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  trackingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  trackingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginLeft: 10,
  },
  trackingDetails: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 16,
    color: COLORS.secondary,
    marginLeft: 10,
  },
  trackingStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.secondary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C3301',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  callButton: {
    backgroundColor: '#1C3301',
  },
  textButton: {
    backgroundColor: '#1C3301',
  },
  actionButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 10,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 10,
    marginBottom: 10,
  },
  cancelButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 10,
  },
  paymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 10,
    marginBottom: 10,
  },
  paymentButtonText: {
    color: '#1C3301',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 10,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightGreen,
    borderRadius: 16,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginTop: 10,
    marginBottom: 10,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.darkGreen,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 30,
    marginHorizontal: 40,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    textAlign: 'center',
  },
  modalBody: {
    marginBottom: 25,
  },
  modalText: {
    fontSize: 16,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtext: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#1C3301',
    borderRadius: 15,
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  modalButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  arrivalInfo: {
    marginTop: 15,
    marginBottom: 15,
    width: '100%',
    paddingHorizontal: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: COLORS.darkGreen,
    fontWeight: 'bold',
  },
  modalInstructions: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
    marginTop: 10,
  },
  arrivalOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 10,
    zIndex: 1,
  },
  arrivalBadge: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  arrivalBadgeText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  weightCalculationInfo: {
    marginTop: 15,
    marginBottom: 15,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: COLORS.lightGray,
    borderRadius: 10,
    alignItems: 'center',
  },
  weightCalculationText: {
    fontSize: 16,
    color: COLORS.darkGreen,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  weightCalculationSubtext: {
    fontSize: 14,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  checkPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: COLORS.black,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 10,
    marginBottom: 10,
  },
  checkPaymentButtonActive: {
    backgroundColor: '#FFD700',
  },
  checkPaymentButtonText: {
    color: '#1C3301',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 10,
  },
  paymentStatusContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  paymentStatusText: {
    fontSize: 14,
    color: COLORS.darkGreen,
    fontWeight: '500',
  },
  paymentAmountText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginTop: 5,
  },
}); 