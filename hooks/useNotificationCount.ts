import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useNotificationCount() {
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotificationCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setNotificationCount(0);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error fetching notification count:', error);
        setNotificationCount(0);
      } else {
        setNotificationCount(data?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
      setNotificationCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let channel: any = null;

    const setupNotificationCount = async () => {
      await fetchNotificationCount();

      // Set up real-time subscription for notification count updates
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      channel = supabase
        .channel('notification_count_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            // Refetch count when notifications change
            fetchNotificationCount();
          }
        )
        .subscribe();
    };

    setupNotificationCount();

    // Cleanup function
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return { notificationCount, loading, refetch: fetchNotificationCount };
}
