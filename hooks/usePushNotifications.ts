import { useCallback, useEffect, useState } from 'react';
import { notificationService, PushNotificationData } from '../lib/notificationService';
import { supabase } from '../lib/supabase';

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize push notifications
  const initializePushNotifications = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found, skipping push notification setup');
        setIsLoading(false);
        return;
      }

      // Register for push notifications
      const token = await notificationService.registerForPushNotifications();
      if (token) {
        setExpoPushToken(token);
        
        // Store token in database
        const stored = await notificationService.storePushToken(user.id, token);
        if (stored) {
          console.log('Push token registered and stored successfully');
        }
      }

      // Check permissions
      const permissionStatus = await notificationService.getPermissions();
      setPermissions(permissionStatus.granted);

    } catch (error) {
      console.error('Error initializing push notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Request permissions
  const requestPermissions = useCallback(async () => {
    try {
      const permissionStatus = await notificationService.requestPermissions();
      setPermissions(permissionStatus.granted);
      return permissionStatus.granted;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  }, []);

  // Send notification to user
  const sendNotificationToUser = useCallback(async (
    userId: string,
    notification: PushNotificationData
  ): Promise<boolean> => {
    try {
      return await notificationService.sendNotificationToUser(userId, notification);
    } catch (error) {
      console.error('Error sending notification to user:', error);
      return false;
    }
  }, []);

  // Schedule local notification
  const scheduleLocalNotification = useCallback(async (
    notification: PushNotificationData,
    trigger?: any
  ): Promise<string> => {
    try {
      return await notificationService.scheduleLocalNotification(notification, trigger);
    } catch (error) {
      console.error('Error scheduling local notification:', error);
      throw error;
    }
  }, []);

  // Cancel notification
  const cancelNotification = useCallback(async (notificationId: string): Promise<void> => {
    try {
      await notificationService.cancelNotification(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }, []);

  // Cancel all notifications
  const cancelAllNotifications = useCallback(async (): Promise<void> => {
    try {
      await notificationService.cancelAllNotifications();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializePushNotifications();
  }, [initializePushNotifications]);

  // Set up notification listeners
  useEffect(() => {
    // Handle notifications received while app is running
    const subscription = notificationService.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // You can handle the notification here if needed
    });

    // Handle notification responses (when user taps on notification)
    const responseSubscription = notificationService.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Handle navigation or other actions based on notification data
      const data = response.notification.request.content.data;
      
      // Example: Navigate to specific screen based on notification type
      if (data?.type === 'recycler_arrived') {
        // Navigate to tracking screen or show arrival details
        console.log('Navigating to arrival details...');
      }
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return {
    expoPushToken,
    permissions,
    isLoading,
    requestPermissions,
    sendNotificationToUser,
    scheduleLocalNotification,
    cancelNotification,
    cancelAllNotifications,
    initializePushNotifications,
  };
}

// Helper function to create arrival notification
export const createArrivalNotification = (
  recyclerName: string,
  pickupAddress: string
): PushNotificationData => ({
  title: '🎯 Recycler Has Arrived!',
  body: `${recyclerName} has arrived at ${pickupAddress}. Please prepare your waste for collection.`,
  data: {
    type: 'recycler_arrived',
    recyclerName,
    pickupAddress,
  },
});

// Helper function to create payment notification
export const createPaymentNotification = (
  amount: number,
  recyclerName: string
): PushNotificationData => ({
  title: '💰 Payment Received!',
  body: `You've received ₵${amount} from ${recyclerName} for your waste collection.`,
  data: {
    type: 'payment_received',
    amount,
    recyclerName,
  },
});

// Helper function to create request confirmation notification
export const createRequestConfirmationNotification = (
  recyclerName: string,
  estimatedTime: string
): PushNotificationData => ({
  title: '✅ Request Confirmed!',
  body: `${recyclerName} has confirmed your pickup request. Estimated arrival: ${estimatedTime}`,
  data: {
    type: 'request_confirmed',
    recyclerName,
    estimatedTime,
  },
});
