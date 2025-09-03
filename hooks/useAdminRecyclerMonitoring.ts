import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface RecyclerStatus {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  truckSize: string;
  rating: number;
  verificationStatus: string;
  isAvailable: boolean;
  isOnline: boolean;
  lastSeenAt: string;
  heartbeatAt: string;
  sessionId: string | null;
  createdAt: string;
  statusCategory: 'Unverified' | 'Offline' | 'Inactive' | 'Busy' | 'Busy (5+ Requests)' | 'Available';
  pendingRequestsCount?: number;
}

interface RecyclerSummary {
  totalRecyclers: number;
  verifiedRecyclers: number;
  onlineRecyclers: number;
  availableRecyclers: number;
  busyRecyclers: number;
  busyWithRequestsRecyclers: number;
  offlineRecyclers: number;
  inactiveRecyclers: number;
  unverifiedRecyclers: number;
}

interface ActivityLog {
  recyclerId: string;
  fullName: string;
  actionType: string;
  eventTimestamp: string;
  details: string;
}

export function useAdminRecyclerMonitoring() {
  const [recyclers, setRecyclers] = useState<RecyclerStatus[]>([]);
  const [summary, setSummary] = useState<RecyclerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all recyclers with status
  const fetchAllRecyclers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('admin_get_all_recyclers_status');

      if (error) {
        console.error('Error fetching recyclers:', error);
        setError(error.message);
        return;
      }

      if (data) {
        const formattedRecyclers: RecyclerStatus[] = data.map((recycler: any) => ({
          id: recycler.id,
          fullName: recycler.full_name,
          phone: recycler.phone,
          email: recycler.email,
          truckSize: recycler.truck_size,
          rating: recycler.rating || 4.5,
          verificationStatus: recycler.verification_status,
          isAvailable: recycler.is_available,
          isOnline: recycler.is_online,
          lastSeenAt: recycler.last_seen_at,
          heartbeatAt: recycler.heartbeat_at,
          sessionId: recycler.session_id,
          createdAt: recycler.created_at,
          statusCategory: recycler.status_category,
          pendingRequestsCount: recycler.pending_requests_count || 0
        }));

        setRecyclers(formattedRecyclers);
      }
    } catch (err) {
      console.error('Error fetching recyclers:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch summary statistics
  const fetchSummary = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('admin_get_online_recyclers_summary');

      if (error) {
        console.error('Error fetching summary:', error);
        return;
      }

      if (data && data.length > 0) {
        const summaryData = data[0];
        setSummary({
          totalRecyclers: summaryData.total_recyclers,
          verifiedRecyclers: summaryData.verified_recyclers,
          onlineRecyclers: summaryData.online_recyclers,
          availableRecyclers: summaryData.available_recyclers,
          busyRecyclers: summaryData.busy_recyclers,
          busyWithRequestsRecyclers: summaryData.busy_with_requests_recyclers,
          offlineRecyclers: summaryData.offline_recyclers,
          inactiveRecyclers: summaryData.inactive_recyclers,
          unverifiedRecyclers: summaryData.unverified_recyclers
        });
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  }, []);

  // Force recycler offline
  const forceRecyclerOffline = useCallback(async (recyclerId: string) => {
    try {
      const { error } = await supabase.rpc('admin_force_recycler_offline', {
        p_recycler_id: recyclerId
      });

      if (error) {
        console.error('Error forcing recycler offline:', error);
        throw error;
      }

      // Refresh data after action
      await Promise.all([fetchAllRecyclers(), fetchSummary()]);
      
      return true;
    } catch (err) {
      console.error('Error forcing recycler offline:', err);
      throw err;
    }
  }, [fetchAllRecyclers, fetchSummary]);

  // Get activity log
  const getActivityLog = useCallback(async (hours: number = 24): Promise<ActivityLog[]> => {
    try {
      const { data, error } = await supabase.rpc('admin_get_recycler_activity_log', {
        p_hours: hours
      });

      if (error) {
        console.error('Error fetching activity log:', error);
        throw error;
      }

      if (data) {
        return data.map((log: any) => ({
          recyclerId: log.recycler_id,
          fullName: log.full_name,
          actionType: log.action_type,
          eventTimestamp: log.event_timestamp,
          details: log.details
        }));
      }

      return [];
    } catch (err) {
      console.error('Error fetching activity log:', err);
      throw err;
    }
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    // Initial fetch
    Promise.all([fetchAllRecyclers(), fetchSummary()]);

    // Set up real-time subscription
    const channel = supabase
      .channel('admin-recycler-monitoring')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'recyclers'
        },
        () => {
          // Refetch when any recycler status changes
          Promise.all([fetchAllRecyclers(), fetchSummary()]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAllRecyclers, fetchSummary]);

  // Helper functions for filtering
  const getRecyclersByStatus = useCallback((status: string) => {
    return recyclers.filter(recycler => recycler.statusCategory === status);
  }, [recyclers]);

  const getOnlineRecyclers = useCallback(() => {
    return recyclers.filter(recycler => recycler.isOnline && recycler.heartbeatAt);
  }, [recyclers]);

  const getAvailableRecyclers = useCallback(() => {
    return recyclers.filter(recycler => 
      recycler.isOnline && 
      recycler.isAvailable && 
      recycler.verificationStatus === 'approved'
    );
  }, [recyclers]);

  return {
    recyclers,
    summary,
    loading,
    error,
    fetchAllRecyclers,
    fetchSummary,
    forceRecyclerOffline,
    getActivityLog,
    getRecyclersByStatus,
    getOnlineRecyclers,
    getAvailableRecyclers
  };
}
