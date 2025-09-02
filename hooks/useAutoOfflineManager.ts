import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { supabase } from '../lib/supabase';

/**
 * Hook to manage automatic offline functionality for recyclers
 * This replaces the need for pg_cron by running the auto-offline check
 * periodically when the app is active
 */
export function useAutoOfflineManager() {
  const intervalRef = useRef<number | null>(null);
  const isActiveRef = useRef<boolean>(true);

  // Function to call the auto-offline database function
  const runAutoOfflineCheck = async () => {
    try {
      const { data, error } = await supabase.rpc('auto_set_inactive_recyclers_offline');
      
      if (error) {
        console.error('Auto-offline check failed:', error);
      } else {
        console.log(`Auto-offline check completed. Set ${data || 0} recyclers offline.`);
      }
    } catch (error) {
      console.error('Error running auto-offline check:', error);
    }
  };

  // Start the auto-offline check interval
  const startAutoOfflineCheck = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Run initial check
    runAutoOfflineCheck();

    // Set up interval to run every minute (60000ms)
    intervalRef.current = setInterval(() => {
      if (isActiveRef.current) {
        runAutoOfflineCheck();
      }
    }, 60000); // 1 minute

    console.log('Auto-offline manager started');
  };

  // Stop the auto-offline check
  const stopAutoOfflineCheck = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    console.log('Auto-offline manager stopped');
  };

  // Handle app state changes
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      isActiveRef.current = true;
      startAutoOfflineCheck();
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      isActiveRef.current = false;
      stopAutoOfflineCheck();
    }
  };

  // Initialize the auto-offline manager
  useEffect(() => {
    // Start when component mounts
    startAutoOfflineCheck();

    // Set up app state listener
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
      stopAutoOfflineCheck();
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    runAutoOfflineCheck,
    startAutoOfflineCheck,
    stopAutoOfflineCheck
  };
}
