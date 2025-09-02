import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { COLORS } from '../../constants';

// Simple notification interface
interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  created_at: string;
}

// Simple mock notifications
const mockNotifications: Notification[] = [
  {
    id: 'notif_001',
    title: '🎉 Pickup Completed!',
    message: 'Your waste pickup has been completed successfully. Weight: 8 kg, Total: GHS 15.75.',
    type: 'pickup_completed',
    isRead: false,
    created_at: '2024-01-15T14:30:00Z'
  },
  {
    id: 'notif_002',
    title: '⭐ Points Earned!',
    message: 'You\'ve earned 80 points for this pickup. Keep recycling to earn more rewards!',
    type: 'points_earned',
    isRead: false,
    created_at: '2024-01-15T14:30:00Z'
  },
  {
    id: 'notif_003',
    title: '🌱 Environmental Impact',
    message: 'You\'ve helped save 4.0 kg of CO2 emissions! Every pickup contributes to a cleaner planet.',
    type: 'system',
    isRead: true,
    created_at: '2024-01-15T14:30:00Z'
  },
  {
    id: 'notif_004',
    title: '📅 Schedule Next Pickup',
    message: 'Ready for your next recycling session? Schedule another pickup to continue earning points.',
    type: 'reminder',
    isRead: true,
    created_at: '2024-01-15T12:00:00Z'
  },
  {
    id: 'notif_005',
    title: '🚚 Recycler on the Way',
    message: 'Your recycler is 5 minutes away. Please be ready for pickup.',
    type: 'pickup_confirmed',
    isRead: true,
    created_at: '2024-01-15T10:00:00Z'
  }
];

export const config = {
  headerShown: false,
};

export default function CustomerNotificationScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setNotifications([...mockNotifications]);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications(mockNotifications);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, isRead: true }
          : notif
      )
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  // Handle notification tap
  const handleNotificationTap = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Simple navigation based on type
    switch (notification.type) {
      case 'pickup_completed':
      case 'pickup_confirmed':
        router.push('/customer-screens/history');
        break;
      case 'points_earned':
        router.push('/customer-screens/Rewards');
        break;
      default:
        // Just mark as read for other types
        break;
    }
  };

  // Get notification icon and color
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'pickup_completed': return 'checkmark-circle';
      case 'points_earned': return 'star';
      case 'pickup_confirmed': return 'car';
      case 'reminder': return 'time';
      default: return 'information-circle';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'pickup_completed': return COLORS.green;
      case 'points_earned': return '#FFD700';
      case 'pickup_confirmed': return COLORS.primary;
      case 'reminder': return COLORS.orange;
      default: return COLORS.blue;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    return date.toLocaleDateString();
  };

  // Render notification item
  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity 
      style={[
        styles.notificationCard,
        !item.isRead && styles.unreadNotification
      ]}
      onPress={() => handleNotificationTap(item)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(item.type) + '20' }]}>
        <Ionicons 
          name={getNotificationIcon(item.type) as any} 
          size={24} 
          color={getNotificationColor(item.type)} 
        />
      </View>
      
      <View style={styles.notificationContent}>
        <View style={styles.notificationHeader}>
          <Text style={[
            styles.notificationTitle,
            !item.isRead && styles.unreadTitle
          ]}>
            {item.title}
          </Text>
          <Text style={styles.notificationTime}>
            {formatDate(item.created_at)}
          </Text>
        </View>
        
        <Text style={styles.notificationMessage}>
          {item.message}
        </Text>
        
        {!item.isRead && (
          <View style={styles.unreadIndicator} />
        )}
      </View>
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-off" size={64} color={COLORS.lightGray} />
      <Text style={styles.emptyStateTitle}>No Notifications</Text>
      <Text style={styles.emptyStateMessage}>
        You're all caught up! Check back later for updates.
      </Text>
    </View>
  );

  // Refresh control
  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="refresh" size={64} color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Simple Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Notifications</Text>
        
        <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
          <Ionicons name="checkmark-done" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Simple Action Bar */}
      {notifications.filter(n => !n.isRead).length > 0 && (
        <View style={styles.actionBar}>
          <Text style={styles.unreadCount}>
            {notifications.filter(n => !n.isRead).length} unread
          </Text>
        </View>
      )}

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyListContent
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
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
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  markAllButton: {
    padding: 8,
  },
  actionBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  unreadCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  listContent: {
    padding: 20,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    backgroundColor: COLORS.primary + '05',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    flex: 1,
    marginRight: 12,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  notificationTime: {
    fontSize: 12,
    color: '#6C757D',
    fontWeight: '500',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  unreadIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  separator: {
    height: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6C757D',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#ADB5BD',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 24,
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
}); 