import { useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { useNotificationCountSimple } from './useNotificationCountSimple';

export function useClearNotifications() {
  const { refetch: refetchNotificationCount } = useNotificationCountSimple();
  
  const clearAllNotifications = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to clear notifications');
        return false;
      }

      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error clearing notifications:', error);
        Alert.alert('Error', 'Failed to clear notifications. Please try again.');
        return false;
      }

      console.log('All notifications cleared successfully');
      
      // Refresh notification count
      refetchNotificationCount();
      
      return true;
    } catch (error) {
      console.error('Error in clearAllNotifications:', error);
      Alert.alert('Error', 'Failed to clear notifications. Please try again.');
      return false;
    }
  }, [refetchNotificationCount]);

  const handleClearNotifications = useCallback(() => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to mark all notifications as read?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const success = await clearAllNotifications();
            if (success) {
              // The notification count will be updated by the polling mechanism
              console.log('Notifications cleared successfully');
            }
          },
        },
      ]
    );
  }, [clearAllNotifications]);

  return {
    clearAllNotifications,
    handleClearNotifications,
  };
}
