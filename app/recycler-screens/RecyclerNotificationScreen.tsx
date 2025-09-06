import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../../constants';
import { useClearNotifications } from '../../hooks/useClearNotifications';
import { supabase } from '../../lib/supabase';
import CommonHeader from '../components/CommonHeader';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  created_at: string;
  is_read: boolean;
}

export default function RecyclerNotificationScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { handleClearNotifications: originalHandleClearNotifications } = useClearNotifications();
  
  // Custom clear handler that also refreshes local notifications
  const handleClearNotifications = async () => {
    await originalHandleClearNotifications();
    // Reload notifications to reflect the cleared state
    await loadNotifications();
  };

  // Load notifications
  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return;
      }

      // Update local state
      setNotifications(prev =>
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Handle notification press
  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    await markAsRead(notification.id);

    // Handle different notification types
    switch (notification.type) {
      case 'payment_rejected':
        handlePaymentRejected(notification);
        break;
      case 'payment_accepted':
        handlePaymentAccepted(notification);
        break;
      case 'new_request':
        handleNewRequest(notification);
        break;
      default:
        console.log('Unknown notification type:', notification.type);
    }
  };

  // Handle payment rejection
  const handlePaymentRejected = (notification: Notification) => {
    const data = notification.data;
    
    Alert.alert(
      'Payment Rejected',
      `Customer ${data.customer_name} has rejected your payment summary.\n\nReason: ${data.selected_reason}\n\nDetails: ${data.rejection_reason}`,
      [
        { text: 'View Details', style: 'cancel' },
        { 
          text: 'Edit & Resend', 
          onPress: () => {
            // Navigate to weight entry screen to edit
            router.push({
              pathname: '/recycler-screens/RecyclerWeightEntry',
              params: {
                requestId: data.request_id,
                isEdit: 'true',
                paymentSummaryId: data.payment_summary_id,
                rejectionReason: data.rejection_reason,
                selectedReason: data.selected_reason
              }
            });
          }
        }
      ]
    );
  };

  // Handle payment accepted
  const handlePaymentAccepted = (notification: Notification) => {
    Alert.alert(
      'Payment Accepted',
      'Customer has accepted your payment summary. You can now proceed with the collection.',
      [
        { text: 'OK', onPress: () => {
          // Navigate to payment summary or celebration screen
          router.push({
            pathname: '/recycler-screens/RecyclerPaymentSummary',
            params: {
              requestId: notification.data.request_id
            }
          });
        }}
      ]
    );
  };

  // Handle new request
  const handleNewRequest = (notification: Notification) => {
    router.push({
      pathname: '/recycler-screens/RecyclerTextUserScreen',
      params: {
        newRequest: 'true'
      }
    });
  };

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, []);

  // Real-time subscription for notifications
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

    // Subscribe to notifications for this recycler
    const subscription = supabase
      .channel('recycler-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New notification received:', payload);
          // Add new notification to the list
          setNotifications(prev => [payload.new as Notification, ...prev]);
          
          // Show alert for important notifications
          if (payload.new.type === 'payment_rejected') {
            Alert.alert(
              'Payment Rejected',
              'A customer has rejected your payment summary. Tap to view details.',
              [
                { text: 'View', onPress: () => handleNotificationPress(payload.new as Notification) },
                { text: 'Later', style: 'cancel' }
              ]
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
    };

    getUser();
  }, []);


  // Render notification item
  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.is_read && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationIcon}>
        <MaterialIcons 
          name={
            item.type === 'payment_rejected' ? 'cancel' :
            item.type === 'payment_accepted' ? 'check-circle' :
            item.type === 'new_request' ? 'add-circle' :
            'notifications'
          } 
          size={24} 
          color={
            item.type === 'payment_rejected' ? '#FF4444' :
            item.type === 'payment_accepted' ? '#4CAF50' :
            item.type === 'new_request' ? '#2196F3' :
            '#666'
          } 
        />
      </View>
      
      <View style={styles.notificationContent}>
        <Text style={[
          styles.notificationTitle,
          !item.is_read && styles.unreadText
        ]}>
          {item.title}
        </Text>
        <Text style={styles.notificationMessage}>
          {item.message}
        </Text>
        <Text style={styles.notificationTime}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>

      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CommonHeader />
      
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={handleClearNotifications} style={styles.clearButton}>
          <MaterialIcons name="clear" size={16} color="#fff" />
          <Text style={styles.clearButtonText}>CLEAR</Text>
        </TouchableOpacity>
      </View>

      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="notifications-none" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptyMessage}>
            You&apos;ll receive notifications about payment updates, new requests, and other important updates here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadNotifications();
              }}
            />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FFF0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FFF0',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerContent: {
    flex: 1,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.darkGreen,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  notificationItem: {
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
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.darkGreen,
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
  unreadText: {
    fontWeight: 'bold',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.darkGreen,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
});