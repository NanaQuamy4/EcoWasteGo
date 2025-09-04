import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useNotificationCountSimple() {
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    let pollInterval: any = null;

    const setupNotificationCount = async () => {
      await fetchNotificationCount();

      // Use polling instead of real-time subscriptions for reliability
      // Poll every 30 seconds
      pollInterval = setInterval(() => {
        fetchNotificationCount();
      }, 30000);
    };

    setupNotificationCount();

    // Cleanup function
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [fetchNotificationCount]);

  return { 
    notificationCount, 
    loading, 
    error,
    refetch: fetchNotificationCount 
  };
}
