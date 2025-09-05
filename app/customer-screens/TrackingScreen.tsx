import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppHeader from '../../components/AppHeader';
import MapComponent from '../../components/MapComponent';
import { COLORS } from '../../constants';
import { supabase } from '../../lib/supabase';

// Notification component that matches the main notification UI
interface NotificationProps {
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
  onClose: () => void;
  onAction?: () => void;
  actionText?: string;
  showClose?: boolean;
}

const NotificationCard = ({ title, message, type, onClose, onAction, actionText, showClose = true }: NotificationProps) => {
  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { icon: 'check-circle' as const, color: '#4CAF50' };
      case 'info':
        return { icon: 'info' as const, color: '#2196F3' };
      case 'warning':
        return { icon: 'warning' as const, color: '#FF9800' };
      case 'error':
        return { icon: 'error' as const, color: '#F44336' };
      default:
        return { icon: 'notifications' as const, color: '#666' };
    }
  };

  const { icon, color } = getIconAndColor();

  return (
    <View style={styles.notificationCard}>
      <View style={styles.notificationIcon}>
        <MaterialIcons name={icon} size={24} color={color} />
      </View>
      
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{title}</Text>
        <Text style={styles.notificationMessage}>{message}</Text>
      </View>

      {showClose && (
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={20} color="#999" />
        </TouchableOpacity>
      )}

      {onAction && actionText && (
        <TouchableOpacity onPress={onAction} style={styles.notificationActionButton}>
          <Text style={styles.notificationActionButtonText}>{actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default function TrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    requestId?: string;
    recyclerName?: string;
    pickup?: string;
  }>();

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [recyclerLocation, setRecyclerLocation] = useState<any>(null);
  const [customerLocation, setCustomerLocation] = useState<any>(null);
  const [hasReachedDestination, setHasReachedDestination] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    title: string;
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
    onAction?: () => void;
    actionText?: string;
  }>>([]);

  // Helper functions for notifications
  const addNotification = (notification: {
    title: string;
    message: string;
    type: 'success' | 'info' | 'warning' | 'error';
    onAction?: () => void;
    actionText?: string;
  }) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { ...notification, id }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Load tracking data
  const loadTrackingData = useCallback(async () => {
    if (!params.requestId) return;
    
    try {
      console.log('📋 Loading tracking data for request:', params.requestId);
      
      // Get pickup request with recycler details including real-time location
      const { data: requestData, error: requestError } = await supabase
        .from('pickup_requests')
        .select(`
          id,
          customer_id,
          recycler_id,
          pickup_address,
          pickup_latitude,
          pickup_longitude,
          recycler_latitude,
          recycler_longitude,
          recycler_location_updated_at,
          status,
          created_at,
          waste_type,
          waste_quantity,
          customers!inner(
            id,
            full_name,
            phone
          ),
          recyclers!inner(
            id,
            full_name,
            phone,
            latitude,
            longitude
          )
        `)
        .eq('id', params.requestId)
        .single();
      
      if (requestError) {
        console.error('Error loading tracking data:', requestError);
        setIsLoading(false);
        return;
      }
      
      if (requestData) {
        // Update tracking data with real data
        setTrackingData({
          requestId: requestData.id,
          customerName: (requestData.customers as any)?.full_name || 'Customer',
          customerPhone: (requestData.customers as any)?.phone || 'Unknown',
          recyclerName: (requestData.recyclers as any)?.full_name || 'Recycler',
          recyclerPhone: (requestData.recyclers as any)?.phone || 'Unknown',
          pickupAddress: requestData.pickup_address,
          status: requestData.status
        });
        
        // Update customer location with real coordinates
        if (requestData.pickup_latitude && requestData.pickup_longitude) {
          setCustomerLocation({
            latitude: requestData.pickup_latitude,
            longitude: requestData.pickup_longitude,
            address: requestData.pickup_address
          });
        }
        
        // Update recycler location with real-time tracking coordinates
        if (requestData.recycler_latitude && requestData.recycler_longitude) {
          // Use real-time tracking location if available
          setRecyclerLocation({
            latitude: requestData.recycler_latitude,
            longitude: requestData.recycler_longitude,
            heading: 45,
            speed: 25,
            lastUpdated: requestData.recycler_location_updated_at || new Date().toISOString()
          });
        } else if ((requestData.recyclers as any)?.latitude && (requestData.recyclers as any)?.longitude) {
          // Fallback to recycler's general location
          setRecyclerLocation({
            latitude: (requestData.recyclers as any).latitude,
            longitude: (requestData.recyclers as any).longitude,
            heading: 45,
            speed: 25,
            lastUpdated: new Date().toISOString()
          });
        }
        
        setIsLoading(false);
        console.log('✅ Tracking data loaded successfully');
      }
    } catch (error) {
      console.error('Error loading tracking data:', error);
      setIsLoading(false);
    }
  }, [params.requestId]);

  // Check arrival status
  const checkArrivalStatus = useCallback(async () => {
    if (!params.requestId) return;
    
    try {
      // First get the customer ID from the request
      const { data: requestData, error: requestError } = await supabase
        .from('pickup_requests')
        .select('customer_id')
        .eq('id', params.requestId)
        .single();
      
      if (requestError || !requestData) {
        console.error('Error getting customer ID from request:', requestError);
        return;
      }
      
      // Get arrival status from database using customer ID
      const { data, error } = await supabase.rpc('get_customer_arrival_status', {
        p_customer_id: requestData.customer_id
      });
      
      if (error) {
        console.error('Error checking arrival status:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const arrivalData = data[0];
        
        // Update arrival status if recycler has arrived
        if (arrivalData.is_arrived && !hasReachedDestination) {
          setHasReachedDestination(true);
          console.log('🎯 Recycler has arrived at pickup location!');
          
          // Show arrival alert to customer
          Alert.alert(
            '🎯 Recycler Has Arrived!',
            'Your recycler has arrived at your pickup location. Please prepare your waste for collection.',
            [
              {
                text: 'OK',
                onPress: () => console.log('Customer acknowledged recycler arrival')
              }
            ]
          );

          // Also add notification card
          addNotification({
            title: '🎯 Recycler Has Arrived!',
            message: 'Your recycler has arrived at your pickup location. Please prepare your waste for collection.',
            type: 'success',
            actionText: 'OK',
            onAction: () => console.log('Customer acknowledged recycler arrival')
          });
        }
      }
    } catch (error) {
      console.error('Error in arrival status check:', error);
    }
  }, [params.requestId, hasReachedDestination]);

  // Load tracking data on mount
  useEffect(() => {
    loadTrackingData();
  }, [loadTrackingData]);

  // Check arrival status every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      checkArrivalStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [checkArrivalStatus]);

  // Real-time subscription for recycler location updates
  useEffect(() => {
    if (!params.requestId) return;

    console.log('🔄 Setting up real-time subscription for recycler location updates...');

    const subscription = supabase
      .channel('recycler-location-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'pickup_requests',
          filter: `id=eq.${params.requestId}`,
        },
        (payload) => {
          console.log('📍 Real-time recycler location update received:', payload);
          
          const newData = payload.new as any;
          
          // Update recycler location if new coordinates are available
          if (newData.recycler_latitude && newData.recycler_longitude) {
            setRecyclerLocation((prev: any) => ({
              ...prev,
              latitude: newData.recycler_latitude,
              longitude: newData.recycler_longitude,
              lastUpdated: newData.recycler_location_updated_at || new Date().toISOString()
            }));
            
            console.log('✅ Recycler location updated in real-time:', {
              latitude: newData.recycler_latitude,
              longitude: newData.recycler_longitude,
              updatedAt: newData.recycler_location_updated_at
            });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('🔄 Cleaning up real-time subscription...');
      subscription.unsubscribe();
    };
  }, [params.requestId]);

  // Periodic refresh of tracking data as fallback
  useEffect(() => {
    if (!params.requestId) return;

    const interval = setInterval(() => {
      console.log('🔄 Periodic refresh of tracking data...');
      loadTrackingData();
    }, 10000); // Refresh every 10 seconds as fallback

    return () => clearInterval(interval);
  }, [params.requestId, loadTrackingData]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!trackingData?.requestId) return;
    
    try {
      // Get customer ID from the request
      const { data: requestData, error: requestError } = await supabase
        .from('pickup_requests')
        .select('customer_id')
        .eq('id', trackingData.requestId)
        .single();
      
      if (requestError || !requestData) return;
      
      // Get unread notification count
      const { data: unreadData, error: unreadError } = await supabase.rpc('get_unread_notification_count', {
        p_customer_id: requestData.customer_id
      });
      
      if (!unreadError && unreadData !== null) {
        setNotificationCount(unreadData);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [trackingData?.requestId]);

  // Fetch notifications when tracking data is loaded
  useEffect(() => {
    if (trackingData) {
      fetchNotifications();
    }
  }, [trackingData, fetchNotifications]);

  // Real-time payment summary monitoring
  useEffect(() => {
    if (!params.requestId || !hasReachedDestination) return;

    console.log('💰 Setting up real-time payment summary monitoring...');

    const subscription = supabase
      .channel(`payment-summary-${params.requestId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payment_summaries',
          filter: `request_id=eq.${params.requestId}`
        },
        (payload) => {
          console.log('💰 New payment summary received:', payload.new);
          
          // Auto-open payment summary when received
          Alert.alert(
            'Payment Summary Ready!',
            'The recycler has sent the payment summary. Would you like to view it now?',
            [
              { text: 'View Later', style: 'cancel' },
              { 
                text: 'View Now', 
                onPress: () => {
                  // Navigate to payment summary with real data
                  router.push({
                    pathname: '/customer-screens/PaymentSummary',
                    params: {
                      requestId: params.requestId,
                      recyclerId: payload.new.recycler_id,
                      recyclerName: trackingData?.recyclerName || 'Recycler',
                      recyclerPhone: trackingData?.recyclerPhone || '+233000000000',
                      pickup: trackingData?.pickupAddress || 'Pickup Location',
                      weight: payload.new.weight,
                      wasteType: payload.new.waste_type,
                      rate: payload.new.rate,
                      subtotal: payload.new.subtotal,
                      environmentalTax: payload.new.environmental_tax,
                      totalAmount: payload.new.total_amount,
                      paymentSummaryId: payload.new.id
                    }
                  });
                }
              }
            ]
          );

          // Also add notification card
          addNotification({
            title: 'Payment Summary Ready!',
            message: 'The recycler has sent the payment summary. Would you like to view it now?',
            type: 'info',
            actionText: 'View Now',
            onAction: () => {
              // Navigate to payment summary with real data
              router.push({
                pathname: '/customer-screens/PaymentSummary',
                params: {
                  requestId: params.requestId,
                  recyclerId: payload.new.recycler_id,
                  recyclerName: trackingData?.recyclerName || 'Recycler',
                  recyclerPhone: trackingData?.recyclerPhone || '+233000000000',
                  pickup: trackingData?.pickupAddress || 'Pickup Location',
                  weight: payload.new.weight,
                  wasteType: payload.new.waste_type,
                  rate: payload.new.rate,
                  subtotal: payload.new.subtotal,
                  environmentalTax: payload.new.environmental_tax,
                  totalAmount: payload.new.total_amount,
                  paymentSummaryId: payload.new.id
                }
              });
            }
          });
        }
      )
      .subscribe();

    return () => {
      console.log('💰 Cleaning up payment summary subscription');
      subscription.unsubscribe();
    };
  }, [params.requestId, hasReachedDestination, trackingData, router]);

  // Action handlers
  const handleCall = () => {
    if (trackingData?.recyclerPhone) {
      // Use Linking to initiate phone call
      const phoneNumber = trackingData.recyclerPhone.startsWith('+') 
        ? trackingData.recyclerPhone 
        : `+${trackingData.recyclerPhone}`;
      
      Linking.openURL(`tel:${phoneNumber}`).catch(err => {
        console.error('Error opening phone dialer:', err);
        Alert.alert('Error', 'Unable to open phone dialer. Please try calling manually.');
      });
    } else {
      Alert.alert('No Contact', 'Recycler contact number not available');
    }
  };
  
  const handleText = () => {
    router.push({
      pathname: '/customer-screens/TextRecyclerScreen',
      params: {
        requestId: trackingData?.requestId || 'req_001',
        recyclerName: trackingData?.recyclerName || 'Recycler',
        recyclerPhone: trackingData?.recyclerPhone || '+233000000000',
        pickup: trackingData?.pickupAddress || 'Pickup Location'
      }
    });
  };
  
  const handleCancel = () => {
    Alert.alert('Cancel Pickup', 'Are you sure you want to cancel this pickup?', [
      { text: 'No', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: () => router.back() }
    ]);
  };

  const handleCheckPayment = async () => {
    if (!trackingData?.requestId) {
      Alert.alert('Error', 'Unable to load payment information');
      return;
    }

    try {
      // Check if payment summary exists in database
      const { data: paymentSummary, error } = await supabase
        .from('payment_summaries')
        .select('*')
        .eq('request_id', trackingData.requestId)
        .eq('status', 'pending')
        .single();

      if (error || !paymentSummary) {
        // No payment summary found - recycler hasn't sent it yet
        Alert.alert(
          'Payment Summary Not Ready',
          'The recycler has not yet sent the payment summary. Please wait a few more minutes for them to complete the weight entry and send the bill.',
          [
            { text: 'OK', style: 'default' },
            { 
              text: 'Check Again', 
              onPress: () => handleCheckPayment() 
            }
          ]
        );
        return;
      }

      // Payment summary found - navigate to payment screen
      router.push({
        pathname: '/customer-screens/PaymentSummary',
        params: {
          requestId: trackingData.requestId,
          recyclerId: paymentSummary.recycler_id,
          recyclerName: trackingData.recyclerName || 'Recycler',
          recyclerPhone: trackingData.recyclerPhone || '+233000000000',
          pickup: trackingData.pickupAddress || 'Pickup Location',
          weight: paymentSummary.weight,
          wasteType: paymentSummary.waste_type,
          rate: paymentSummary.rate,
          subtotal: paymentSummary.subtotal,
          environmentalTax: paymentSummary.environmental_tax,
          totalAmount: paymentSummary.total_amount,
          paymentSummaryId: paymentSummary.id
        }
      });
    } catch (error) {
      console.error('Error checking payment summary:', error);
      Alert.alert(
        'Error',
        'Unable to check payment status. Please try again.',
        [
          { text: 'OK', style: 'default' },
          { 
            text: 'Retry', 
            onPress: () => handleCheckPayment() 
          }
        ]
      );
    }
  };

  // Header action handlers
  const handleMenuPress = () => {
    Alert.alert(
      'Navigation Menu',
      'Choose where you want to go:',
      [
        { 
          text: '🏠 Home', 
          onPress: () => router.push('/customer-screens/HomeScreen') 
        },
        { 
          text: '🕒 History', 
          onPress: () => router.push('/customer-screens/history') 
        },
        { 
          text: '👤 User Profile', 
          onPress: () => router.push('/(tabs)/user') 
        },
        { 
          text: 'Cancel', 
          style: 'cancel',
          onPress: () => {
            // Stay on current tracking screen - no action needed
          }
        }
      ]
    );
  };

  const handleNotificationPress = async () => {
    if (!trackingData?.requestId) return;
    
    try {
      // Get customer ID from the request
      const { data: requestData, error: requestError } = await supabase
        .from('pickup_requests')
        .select('customer_id')
        .eq('id', trackingData.requestId)
        .single();
      
      if (requestError || !requestData) return;
      
      // Get recent notifications
      const { data: notifications, error: notificationsError } = await supabase.rpc('get_customer_notifications', {
        p_customer_id: requestData.customer_id,
        p_limit: 5
      });
      
      if (notificationsError) {
        Alert.alert('Error', 'Failed to load notifications');
        return;
      }
      
      if (notifications && notifications.length > 0) {
        const notificationList = notifications.map((n: any, index: number) => 
          `${index + 1}. ${n.title}\n   ${n.message}\n   ${new Date(n.created_at).toLocaleString()}`
        ).join('\n\n');
        
        Alert.alert(
          'Recent Notifications',
          notificationList,
          [
            { text: 'OK', style: 'default' },
            { text: 'Mark All Read', onPress: () => {
              // Mark all notifications as read
              notifications.forEach(async (notification: any) => {
                await supabase.rpc('mark_notification_read', {
                  p_customer_id: requestData.customer_id,
                  p_notification_id: notification.id
                });
              });
              setNotificationCount(0);
            }}
          ]
        );
      } else {
        Alert.alert('Notifications', 'No new notifications');
      }
    } catch (error) {
      console.error('Error handling notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading tracking information...</Text>
      </View>
    );
  }

  if (!trackingData || !recyclerLocation || !customerLocation) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load tracking data</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadTrackingData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader 
        onMenuPress={handleMenuPress}
        onNotificationPress={handleNotificationPress}
        notificationCount={notificationCount}
      />

      {/* Notifications */}
      {notifications.length > 0 && (
        <View style={styles.notificationsContainer}>
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              title={notification.title}
              message={notification.message}
              type={notification.type}
              onClose={() => removeNotification(notification.id)}
              onAction={notification.onAction}
              actionText={notification.actionText}
            />
          ))}
        </View>
      )}

      {/* Track Your Recycler Card */}
      <View style={styles.trackCard}>
        <Text style={styles.trackCardText}>Track Your Recycler</Text>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        <MapComponent
          markers={[
            {
              id: 'recycler',
              coordinate: recyclerLocation,
              title: trackingData?.recyclerName || 'Recycler',
              description: trackingData?.status === 'in_progress' 
                ? 'Moving towards you' 
                : 'Preparing to start navigation',
              type: 'recycler',
              isMoving: trackingData?.status === 'in_progress',
            },
            {
              id: 'destination',
              coordinate: customerLocation,
              title: 'Your Location',
              description: customerLocation.address,
              type: 'destination',
            },
          ]}
          route={{
            coordinates: [recyclerLocation, customerLocation],
            color: COLORS.darkGreen,
          }}
          style={{ flex: 1 }}
          showUserLocation={true}
        />
      </View>

      {/* Bottom Status Card */}
      <View style={styles.bottomCard}>
        <View style={styles.statusRow}>
          <Text style={[
            styles.statusText,
            hasReachedDestination && styles.arrivedStatusText
          ]}>
            {hasReachedDestination 
              ? '🎉 Recycler has arrived!' 
              : 'Recycler is on his way'
            }
          </Text>
          <View style={[
            styles.truckIcon,
            hasReachedDestination && styles.arrivedTruckIcon
          ]}>
            <MaterialIcons 
              name={hasReachedDestination ? "check-circle" : "local-shipping"} 
              size={32} 
              color={hasReachedDestination ? "#FF6B35" : "#4CAF50"} 
            />
          </View>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {hasReachedDestination ? (
            // Show Check Payment button when recycler has arrived
            <TouchableOpacity style={styles.checkPaymentButton} onPress={handleCheckPayment}>
              <MaterialIcons name="payment" size={20} color="#fff" />
              <Text style={styles.checkPaymentButtonText}>Check Payment</Text>
            </TouchableOpacity>
          ) : (
            // Show regular action buttons when recycler is on the way
            <>
              <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
                <Feather name="phone" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Call</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton} onPress={handleText}>
                <Feather name="message-circle" size={16} color="#fff" />
                <Text style={styles.actionButtonText}>Text</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton} onPress={handleCancel}>
                <Text style={styles.actionButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Track card styles
  trackCard: {
    backgroundColor: '#E8F5E8',
    marginHorizontal: 20,
    marginTop: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  trackCardText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  // Map container styles
  mapContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  // Bottom card styles
  bottomCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  truckIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrivedStatusText: {
    color: '#FF6B35',
    fontWeight: 'bold',
    fontSize: 18,
  },
  arrivedTruckIcon: {
    backgroundColor: '#FFF0E6',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  checkPaymentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  checkPaymentButtonText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
    fontWeight: 'bold',
  },
  // Notification styles
  notificationsContainer: {
    padding: 16,
    backgroundColor: '#F8FFF0',
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  notificationIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  notificationActionButton: {
    backgroundColor: COLORS.darkGreen,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  notificationActionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});