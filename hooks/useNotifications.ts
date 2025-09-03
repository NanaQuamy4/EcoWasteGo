import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  type: 'general' | 'verification' | 'pickup' | 'request_confirmed' | 'request_accepted' | 'request_rejected' | 'request_completed' | 'request_cancelled' | 'pickup_started' | 'pickup_completed';
  title: string;
  message: string;
  related_request_id?: string;
  related_user_id?: string;
  is_read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  read_at?: string;
  action_data?: any; // JSONB field for action buttons, deep links, etc.
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user notifications
  const fetchNotifications = useCallback(async (limit: number = 50, offset: number = 0) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_user_notifications', {
        p_user_id: null, // Will use auth.uid() in the function
        p_limit: limit,
        p_offset: offset
      });

      if (error) {
        console.error('Error fetching notifications:', error);
        setError(error.message);
        return;
      }

      if (data) {
        const formattedNotifications: Notification[] = data.map((notification: any) => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          related_request_id: notification.related_request_id,
          related_user_id: notification.related_user_id,
          is_read: notification.is_read,
          priority: notification.priority || 'medium',
          created_at: notification.created_at,
          read_at: notification.read_at,
          action_data: notification.action_data
        }));

        setNotifications(formattedNotifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_unread_notification_count', {
        p_user_id: null // Will use auth.uid() in the function
      });

      if (error) {
        console.error('Error fetching unread count:', error);
        return;
      }

      setUnreadCount(data || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId
      });

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));

      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      // Mark each unread notification as read
      await Promise.all(
        unreadNotifications.map(notification => markAsRead(notification.id))
      );

      return true;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  }, [notifications, markAsRead]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await Promise.all([
      fetchNotifications(),
      fetchUnreadCount()
    ]);
  }, [fetchNotifications, fetchUnreadCount]);

  // Set up real-time subscription
  useEffect(() => {
    // Initial fetch
    refreshNotifications();

    // Set up real-time subscription for notifications
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${supabase.auth.getUser().then(u => u.data.user?.id)}`
        },
        () => {
          // Refresh notifications when any change occurs
          refreshNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshNotifications]);

  // Helper functions
  const getNotificationsByType = useCallback((type: Notification['type']) => {
    return notifications.filter(notification => notification.type === type);
  }, [notifications]);

  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notification => !notification.is_read);
  }, [notifications]);

  const getHighPriorityNotifications = useCallback(() => {
    return notifications.filter(notification => 
      notification.priority === 'high' || notification.priority === 'urgent'
    );
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    getNotificationsByType,
    getUnreadNotifications,
    getHighPriorityNotifications
  };
}


export interface Notification {
  id: string;
  type: 'general' | 'verification' | 'pickup' | 'request_confirmed' | 'request_accepted' | 'request_rejected' | 'request_completed' | 'request_cancelled' | 'pickup_started' | 'pickup_completed';
  title: string;
  message: string;
  related_request_id?: string;
  related_user_id?: string;
  is_read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  read_at?: string;
  action_data?: any; // JSONB field for action buttons, deep links, etc.
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user notifications
  const fetchNotifications = useCallback(async (limit: number = 50, offset: number = 0) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.rpc('get_user_notifications', {
        p_user_id: null, // Will use auth.uid() in the function
        p_limit: limit,
        p_offset: offset
      });

      if (error) {
        console.error('Error fetching notifications:', error);
        setError(error.message);
        return;
      }

      if (data) {
        const formattedNotifications: Notification[] = data.map((notification: any) => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          related_request_id: notification.related_request_id,
          related_user_id: notification.related_user_id,
          is_read: notification.is_read,
          priority: notification.priority || 'medium',
          created_at: notification.created_at,
          read_at: notification.read_at,
          action_data: notification.action_data
        }));

        setNotifications(formattedNotifications);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_unread_notification_count', {
        p_user_id: null // Will use auth.uid() in the function
      });

      if (error) {
        console.error('Error fetching unread count:', error);
        return;
      }

      setUnreadCount(data || 0);
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const { error } = await supabase.rpc('mark_notification_read', {
        p_notification_id: notificationId
      });

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, is_read: true, read_at: new Date().toISOString() }
            : notification
        )
      );

      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));

      return true;
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.is_read);
      
      // Mark each unread notification as read
      await Promise.all(
        unreadNotifications.map(notification => markAsRead(notification.id))
      );

      return true;
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      throw err;
    }
  }, [notifications, markAsRead]);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    await Promise.all([
      fetchNotifications(),
      fetchUnreadCount()
    ]);
  }, [fetchNotifications, fetchUnreadCount]);

  // Set up real-time subscription
  useEffect(() => {
    // Initial fetch
    refreshNotifications();

    // Set up real-time subscription for notifications
    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${supabase.auth.getUser().then(u => u.data.user?.id)}`
        },
        () => {
          // Refresh notifications when any change occurs
          refreshNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshNotifications]);

  // Helper functions
  const getNotificationsByType = useCallback((type: Notification['type']) => {
    return notifications.filter(notification => notification.type === type);
  }, [notifications]);

  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notification => !notification.is_read);
  }, [notifications]);

  const getHighPriorityNotifications = useCallback(() => {
    return notifications.filter(notification => 
      notification.priority === 'high' || notification.priority === 'urgent'
    );
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    getNotificationsByType,
    getUnreadNotifications,
    getHighPriorityNotifications
  };
}
