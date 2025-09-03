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
import { useNotificationCount } from '../../hooks/useNotificationCount';
import { supabase } from '../../lib/supabase';

// Notification interface matching database schema
interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'general' | 'verification' | 'pickup' | 'request_confirmed' | 'request_accepted' | 'request_rejected' | 'request_completed' | 'request_cancelled' | 'pickup_started' | 'pickup_completed' | 'help_response';
  is_read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  read_at?: string;
  created_at: string;
  updated_at: string;
}

// Removed mock notifications - now using real data from database

export const config = {
  headerShown: false,
};

export default function CustomerNotificationScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
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
        router.push('/customer-screens/TrackingScreen');
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
      case 'request_rejected': return 'close-circle';
      case 'help_response': return 'chatbubble';
      case 'verification': return 'shield-checkmark';
      case 'general': return 'information-circle';
      default: return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'request_completed':
      case 'pickup_completed': return COLORS.green;
      case 'request_confirmed':
      case 'request_accepted': return COLORS.primary;
      case 'request_rejected': return COLORS.red;
      case 'help_response': return COLORS.blue;
      case 'verification': return COLORS.purple;
      case 'general': return COLORS.darkBlue;
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
    <TouchableOpacity 
      style={[
        styles.notificationCard,
        !item.is_read && styles.unreadNotification
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

      {/* Simple Action Bar */}
      {notifications.filter(n => !n.is_read).length > 0 && (
        <View style={styles.actionBar}>
          <Text style={styles.unreadCount}>
            {notifications.filter(n => !n.is_read).length} unread
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F3F4',
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
});