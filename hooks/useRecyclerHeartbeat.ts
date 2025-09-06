import { useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '../lib/supabase';

interface HeartbeatConfig {
  intervalMs?: number; // Default 30 seconds
  timeoutMs?: number; // Default 5 minutes
  enableAppStateTracking?: boolean; // Default true
}

interface HeartbeatStatus {
  isOnline: boolean;
  lastHeartbeat: Date | null;
  sessionId: string | null;
  isHeartbeatActive: boolean;
}

export function useRecyclerHeartbeat(config: HeartbeatConfig = {}) {
  const {
    intervalMs = 30000, // 30 seconds
    timeoutMs = 300000, // 5 minutes
    enableAppStateTracking = true
  } = config;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isActiveRef = useRef<boolean>(true);
  const lastHeartbeatRef = useRef<Date | null>(null);

  // Generate unique session ID
  const generateSessionId = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Send heartbeat to server
  const sendHeartbeat = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const sessionId = sessionIdRef.current || generateSessionId();
      sessionIdRef.current = sessionId;

      const { error } = await supabase.rpc('update_recycler_heartbeat', {
        p_recycler_id: user.id,
        p_session_id: sessionId
      });

      if (error) {
        console.error('Heartbeat error:', error);
        return;
      }

      lastHeartbeatRef.current = new Date();
      console.log('Heartbeat sent successfully');
    } catch (error) {
      console.error('Heartbeat failed:', error);
    }
  }, [generateSessionId]);

  // Set recycler offline
  const setOffline = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.rpc('set_recycler_offline', {
        p_recycler_id: user.id
      });

      console.log('Recycler set offline');
    } catch (error) {
      console.error('Failed to set offline:', error);
    }
  }, []);

  // Start heartbeat
  const startHeartbeat = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval
    intervalRef.current = setInterval(() => {
      if (isActiveRef.current) {
        sendHeartbeat();
      }
    }, intervalMs) as unknown as NodeJS.Timeout;

    console.log('Heartbeat started');
  }, [sendHeartbeat, intervalMs]);

  // Stop heartbeat
  const stopHeartbeat = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    console.log('Heartbeat stopped');
  }, []);

  // Handle app state changes
  const handleAppStateChange = useCallback((nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      isActiveRef.current = true;
      startHeartbeat();
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      isActiveRef.current = false;
      stopHeartbeat();
      // Set offline when app goes to background
      setOffline();
    }
  }, [startHeartbeat, stopHeartbeat, setOffline]);

  // Initialize heartbeat system
  useEffect(() => {
    // Start heartbeat when hook mounts
    startHeartbeat();

    // Set up app state listener
    if (enableAppStateTracking) {
      const subscription = AppState.addEventListener('change', handleAppStateChange);
      return () => {
        subscription?.remove();
        stopHeartbeat();
        setOffline(); // Set offline when component unmounts
      };
    }

    return () => {
      stopHeartbeat();
      setOffline();
    };
  }, [startHeartbeat, stopHeartbeat, setOffline, handleAppStateChange, enableAppStateTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Get current status
  const getStatus = useCallback((): HeartbeatStatus => {
    return {
      isOnline: isActiveRef.current && lastHeartbeatRef.current !== null,
      lastHeartbeat: lastHeartbeatRef.current,
      sessionId: sessionIdRef.current,
      isHeartbeatActive: intervalRef.current !== null
    };
  }, []);

  return {
    startHeartbeat,
    stopHeartbeat,
    sendHeartbeat,
    setOffline,
    getStatus
  };
}
