import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

interface OnlineStatus {
  isOnline: boolean;
  isAvailable: boolean;
  lastSeenAt: string | null;
  heartbeatAt: string | null;
  sessionId: string | null;
}

interface OnlineRecycler {
  id: string;
  fullName: string;
  phone: string;
  truckSize: string;
  rating: number;
  isAvailable: boolean;
  isOnline: boolean;
  lastSeenAt: string;
  heartbeatAt: string;
  status: 'Active' | 'Online' | 'Offline';
}

export function useRecyclerOnlineStatus(recyclerId?: string) {
  const [status, setStatus] = useState<OnlineStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Fetch current online status
  const fetchStatus = useCallback(async () => {
    if (!mountedRef.current || !recyclerId) return;

    try {
      const { data, error } = await supabase.rpc('get_recycler_online_status', {
        p_recycler_id: recyclerId
      });

      if (error) {
        console.error('Error fetching online status:', error);
        if (mountedRef.current) {
          setError(error.message);
        }
        return;
      }

      if (data && data.length > 0 && mountedRef.current) {
        const statusData = data[0];
        setStatus({
          isOnline: statusData.is_online,
          isAvailable: statusData.is_available,
          lastSeenAt: statusData.last_seen_at,
          heartbeatAt: statusData.heartbeat_at,
          sessionId: statusData.session_id
        });
      }
    } catch (err) {
      console.error('Error fetching online status:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [recyclerId]);

  // Set up real-time subscription
  useEffect(() => {
    if (!recyclerId) return;

    mountedRef.current = true;

    // Initial fetch
    fetchStatus();

    // Set up real-time subscription
    const channel = supabase
      .channel('recycler-online-status')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'recyclers',
          filter: `id=eq.${recyclerId}`
        },
        (payload) => {
          if (!mountedRef.current) return;
          
          console.log('Real-time status update:', payload);
          const newData = payload.new as any;
          setStatus({
            isOnline: newData.is_online,
            isAvailable: newData.is_available,
            lastSeenAt: newData.last_seen_at,
            heartbeatAt: newData.heartbeat_at,
            sessionId: newData.session_id
          });
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, [recyclerId]); // Remove fetchStatus dependency to prevent infinite loop

  return {
    status,
    loading,
    error,
    refetch: fetchStatus
  };
}

export function useOnlineRecyclers() {
  const [recyclers, setRecyclers] = useState<OnlineRecycler[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  // Helper function to determine status from heartbeat
  const getStatusFromHeartbeat = (heartbeatAt: string): 'Active' | 'Online' | 'Offline' => {
    const heartbeat = new Date(heartbeatAt);
    const now = new Date();
    const diffMs = now.getTime() - heartbeat.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    if (diffMinutes <= 1) return 'Active';
    if (diffMinutes <= 5) return 'Online';
    return 'Offline';
  };

  // Fetch online recyclers
  const fetchOnlineRecyclers = useCallback(async () => {
    if (!mountedRef.current) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000) // 10 second timeout
      );
      
      const rpcPromise = supabase.rpc('get_online_recyclers');
      
      const { data, error } = await Promise.race([rpcPromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching online recyclers:', error);
        if (mountedRef.current) {
          setError(error.message);
          setRecyclers([]); // Set empty array on error
        }
        return;
      }

      if (data && mountedRef.current) {
        const formattedRecyclers: OnlineRecycler[] = data.map((recycler: any) => ({
          id: recycler.id,
          fullName: recycler.full_name,
          phone: recycler.phone,
          truckSize: recycler.truck_size,
          rating: recycler.rating || 4.5, // Default rating if not set
          isAvailable: recycler.is_available,
          isOnline: recycler.is_online,
          lastSeenAt: recycler.last_seen_at,
          heartbeatAt: recycler.heartbeat_at,
          status: getStatusFromHeartbeat(recycler.heartbeat_at)
        }));

        setRecyclers(formattedRecyclers);
        console.log(`Successfully fetched ${formattedRecyclers.length} online recyclers`);
      } else if (mountedRef.current) {
        // No data returned, set empty array
        setRecyclers([]);
        console.log('No online recyclers found');
      }
    } catch (err) {
      console.error('Error fetching online recyclers:', err);
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setRecyclers([]); // Set empty array on error
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Set up real-time subscription for online recyclers
  useEffect(() => {
    mountedRef.current = true;
    
    // Initial fetch
    fetchOnlineRecyclers();

    // Set up real-time subscription
    const channel = supabase
      .channel('online-recyclers')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recyclers'
        },
        () => {
          // Refetch when any recycler status changes
          if (mountedRef.current) {
            fetchOnlineRecyclers();
          }
        }
      )
      .subscribe();

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(channel);
    };
  }, []); // Empty dependency array to prevent infinite loops

  return {
    recyclers,
    loading,
    error,
    refetch: fetchOnlineRecyclers
  };
}

// Hook for getting current user's online status
export function useCurrentRecyclerStatus() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  return useRecyclerOnlineStatus(userId || undefined);
}
