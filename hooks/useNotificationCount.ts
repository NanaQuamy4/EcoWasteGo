import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useNotificationCount() {
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionFailed, setSubscriptionFailed] = useState(false);

  const fetchNotificationCount = useCallback(async () => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setNotificationCount(0);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('id, is_read')
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching notification count:', error);
        setError(error.message);
        setNotificationCount(0);
      } else {
        const count = data?.length || 0;
        setNotificationCount(count);
        console.log(`Notification count updated: ${count}`);
      }
    } catch (error: any) {
      console.error('Error fetching notification count:', error);
      setError(error.message || 'Failed to fetch notifications');
      setNotificationCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let channel: any = null;
    let pollInterval: any = null;

    const setupNotificationCount = async () => {
      await fetchNotificationCount();

      // Set up real-time subscription for notification count updates
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        channel = supabase
          .channel(`notification_count_${user.id}`, {
            config: {
              broadcast: { self: false },
              presence: { key: user.id }
            }
          })
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'notifications',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              console.log('Notification change detected:', payload);
              // Refetch count when notifications change
              fetchNotificationCount();
            }
          )
          .subscribe((status) => {
            console.log('Notification subscription status:', status);
            if (status === 'CHANNEL_ERROR') {
              console.error('Notification subscription failed, falling back to polling...');
              setSubscriptionFailed(true);
              // Fall back to polling every 30 seconds
              pollInterval = setInterval(() => {
                fetchNotificationCount();
              }, 30000);
            } else if (status === 'SUBSCRIBED') {
              console.log('Notification subscription successful');
              setSubscriptionFailed(false);
              // Clear any existing polling
              if (pollInterval) {
                clearInterval(pollInterval);
                pollInterval = null;
              }
            }
          });
      } catch (error) {
        console.error('Error setting up notification subscription:', error);
        setSubscriptionFailed(true);
        // Fall back to polling
        pollInterval = setInterval(() => {
          fetchNotificationCount();
        }, 30000);
      }
    };

    setupNotificationCount();

    // Cleanup function
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [fetchNotificationCount]);

  return { 
    notificationCount, 
    loading, 
    error,
    subscriptionFailed,
    refetch: fetchNotificationCount 
  };
}
