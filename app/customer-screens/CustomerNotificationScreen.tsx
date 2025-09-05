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
import { useNotificationCountSimple as useNotificationCount } from '../../hooks/useNotificationCountSimple';
import { supabase } from '../../lib/supabase';

// Notification interface matching database schema
interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'general' | 'verification' | 'pickup' | 'request_confirmed' | 'request_accepted' | 'request_rejected' | 'request_completed' | 'request_cancelled' | 'pickup_started' | 'pickup_completed' | 'help_response' | 'recycler_started_navigation' | 'message_received' | 'new_message' | 'recycler_location_update' | 'navigation_started' | 'recycler_started' | 'recycler_arrived' | 'request_pending' | 'request_assigned' | 'request_in_progress' | 'request_failed' | 'payment_received' | 'payment_failed' | 'rating_submitted' | 'feedback_received' | 'system_announcement' | 'maintenance_notice' | 'admin_action' | 'verification_request' | 'user_registration' | 'help_message';
  is_read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read_at?: string;
  created_at: string;
  updated_at: string;
  related_request_id?: string;
  related_user_id?: string;
}

// Removed mock notifications - now using real data from database

export const config = {
  headerShown: false,
};

type FilterType = 'all' | 'unread' | 'read';

export default function CustomerNotificationScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const { refetch: refetchNotificationCount } = useNotificationCount();

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getCurrentUser();
  }, []);

  // Load notifications from database
  const loadNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading notifications:', error);
        setNotifications([]);
      } else {
        setNotifications(data || []);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
      } else {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, is_read: true, read_at: new Date().toISOString() }
              : notif
          )
        );
        // Refetch notification count to update the badge
        refetchNotificationCount();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
      } else {
        setNotifications(prev => 
          prev.map(notif => ({ 
            ...notif, 
            is_read: true, 
            read_at: new Date().toISOString() 
          }))
        );
        // Refetch notification count to update the badge
        refetchNotificationCount();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Handle notification tap
  const handleNotificationTap = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    // Navigation based on type
    switch (notification.type) {
      case 'request_completed':
      case 'pickup_completed':
        router.push('/(tabs)/history');
        break;
      case 'request_confirmed':
      case 'request_accepted':
      case 'recycler_started_navigation':
        router.push({
          pathname: '/customer-screens/TrackingScreen',
          params: {
            requestId: notification.related_request_id
          }
        });
        break;
      case 'help_response':
        router.push('/customer-screens/Help');
        break;
      default:
        // Just mark as read for other types
        break;
    }
  };

  // Get notification icon and color
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'request_completed':
      case 'pickup_completed': return 'checkmark-circle';
      case 'request_confirmed':
      case 'request_accepted': return 'car';
      case 'recycler_started_navigation': return 'navigate';
      case 'request_rejected': return 'close-circle';
      case 'help_response': return 'chatbubble';
      case 'verification': return 'shield-checkmark';
      case 'general': return 'information-circle';
      case 'message_received':
      case 'new_message': return 'chatbubble-ellipses';
      case 'recycler_location_update': return 'location';
      case 'navigation_started': return 'navigate-circle';
      case 'recycler_started': return 'play-circle';
      case 'recycler_arrived': return 'checkmark-circle-outline';
      case 'request_pending': return 'time';
      case 'request_assigned': return 'person-add';
      case 'request_in_progress': return 'refresh-circle';
      case 'request_failed': return 'alert-circle';
      case 'payment_received': return 'card';
      case 'payment_failed': return 'card-outline';
      case 'rating_submitted': return 'star';
      case 'feedback_received': return 'thumbs-up';
      case 'system_announcement': return 'megaphone';
      case 'maintenance_notice': return 'construct';
      case 'admin_action': return 'shield';
      case 'verification_request': return 'document-text';
      case 'user_registration': return 'person-add';
      case 'help_message': return 'help-circle';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'request_completed':
      case 'pickup_completed': return COLORS.green;
      case 'request_confirmed':
      case 'request_accepted': return COLORS.primary;
      case 'recycler_started_navigation': return COLORS.darkGreen;
      case 'request_rejected': return COLORS.red;
      case 'help_response': return COLORS.blue;
      case 'verification': return COLORS.purple;
      case 'general': return COLORS.darkBlue;
      case 'message_received':
      case 'new_message': return COLORS.blue;
      case 'recycler_location_update': return COLORS.primary;
      case 'navigation_started': return COLORS.darkGreen;
      case 'recycler_started': return COLORS.orange;
      case 'recycler_arrived': return COLORS.green;
      case 'request_pending': return COLORS.orange;
      case 'request_assigned': return COLORS.primary;
      case 'request_in_progress': return COLORS.blue;
      case 'request_failed': return COLORS.red;
      case 'payment_received': return COLORS.green;
      case 'payment_failed': return COLORS.red;
      case 'rating_submitted': return COLORS.orange;
      case 'feedback_received': return COLORS.blue;
      case 'system_announcement': return COLORS.purple;
      case 'maintenance_notice': return COLORS.orange;
      case 'admin_action': return COLORS.purple;
      case 'verification_request': return COLORS.blue;
      case 'user_registration': return COLORS.green;
      case 'help_message': return COLORS.blue;
      default: return COLORS.orange;
    }
  };

  // Format date with better time calculation
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    
    // Convert to different time units
    const diffInSeconds = Math.floor(diffInMs / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInWeeks = Math.floor(diffInDays / 7);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInDays / 365);
    
    // Return appropriate time format
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays}d ago`;
    } else if (diffInWeeks < 4) {
      return `${diffInWeeks}w ago`;
    } else if (diffInMonths < 12) {
      return `${diffInMonths}mo ago`;
    } else {
      return `${diffInYears}y ago`;
    }
  };

  // Render notification item
  const renderItem = ({ item }: { item: Notification }) => (
    <View style={[
      styles.notificationCard,
      !item.is_read && styles.unreadNotification
    ]}>
      <TouchableOpacity 
        style={styles.notificationMainContent}
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
              !item.is_read && styles.unreadTitle
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
          
          {!item.is_read && (
            <View style={styles.unreadIndicator} />
          )}
        </View>
      </TouchableOpacity>
      
      {!item.is_read && (
        <TouchableOpacity 
          style={styles.markAsReadButton}
          onPress={() => markAsRead(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="checkmark" size={16} color={COLORS.white} />
          <Text style={styles.markAsReadText}>Mark as Read</Text>
        </TouchableOpacity>
      )}
    </View>
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

  // Filter notifications based on selected filter
  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(notif => !notif.is_read);
      case 'read':
        return notifications.filter(notif => notif.is_read);
      case 'all':
      default:
        return notifications;
    }
  };

  const filteredNotifications = getFilteredNotifications();

  // Load notifications when user is available
  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  // Refresh notification count when screen is focused
  useEffect(() => {
    // Use useFocusEffect from React Navigation instead of router.addListener
    const handleFocus = () => {
      refetchNotificationCount();
    };

    // Call immediately when component mounts
    handleFocus();
  }, [refetchNotificationCount]);

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

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text style={[styles.filterButtonText, filter === 'all' && styles.filterButtonTextActive]}>
            All ({notifications.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'unread' && styles.filterButtonActive]}
          onPress={() => setFilter('unread')}
        >
          <Text style={[styles.filterButtonText, filter === 'unread' && styles.filterButtonTextActive]}>
            Unread ({notifications.filter(n => !n.is_read).length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'read' && styles.filterButtonActive]}
          onPress={() => setFilter('read')}
        >
          <Text style={[styles.filterButtonText, filter === 'read' && styles.filterButtonTextActive]}>
            Read ({notifications.filter(n => n.is_read).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          filteredNotifications.length === 0 && styles.emptyListContent
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
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off" size={64} color={COLORS.lightGray} />
            <Text style={styles.emptyStateTitle}>
              {filter === 'all' ? 'No Notifications' : 
               filter === 'unread' ? 'No Unread Notifications' : 
               'No Read Notifications'}
            </Text>
            <Text style={styles.emptyStateMessage}>
              {filter === 'all' ? 'You\'re all caught up! Check back later for updates.' :
               filter === 'unread' ? 'All your notifications have been read.' :
               'You haven\'t read any notifications yet.'}
            </Text>
          </View>
        }
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.lightGreen,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  markAllButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.lightGreen,
  },
  actionBar: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  unreadCount: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F3F4',
    overflow: 'hidden',
  },
  notificationMainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    backgroundColor: COLORS.lightGreen + '20',
    borderColor: COLORS.primary + '30',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    flex: 1,
    marginRight: 12,
    lineHeight: 22,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  notificationTime: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '500',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  notificationMessage: {
    fontSize: 14,
    color: COLORS.darkGreen,
    lineHeight: 20,
    marginBottom: 4,
  },
  unreadIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  separator: {
    height: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 16,
    color: COLORS.lightGray,
    textAlign: 'center',
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
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterButtonTextActive: {
    color: COLORS.white,
  },
  markAsReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
  },
  markAsReadText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});