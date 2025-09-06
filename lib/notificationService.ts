// Simplified notification service without native modules
import { Platform } from 'react-native';
import { supabase } from './supabase';

export interface PushNotificationData {
  title: string;
  body: string;
  data?: any;
}

export class NotificationService {
  private static instance: NotificationService;
  private expoPushToken: string | null = null;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialize push notifications (simplified version)
  async registerForPushNotifications(): Promise<string | null> {
    try {
      console.log('NotificationService: Registering for push notifications...');
      
      // For now, return a mock token
      // In production, you would implement proper push notification registration
      const mockToken = 'mock-push-token-' + Date.now();
      this.expoPushToken = mockToken;
      
      console.log('NotificationService: Mock push token generated:', mockToken);
      return mockToken;
    } catch (error) {
      console.error('NotificationService: Error registering for push notifications:', error);
      return null;
    }
  }

  // Store push token in database
  async storePushToken(userId: string, token: string): Promise<boolean> {
    try {
      console.log('NotificationService: Storing push token for user:', userId);
      
      const { error } = await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: userId,
          push_token: token,
          platform: Platform.OS,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('NotificationService: Error storing push token:', error);
        return false;
      }

      console.log('NotificationService: Push token stored successfully');
      return true;
    } catch (error) {
      console.error('NotificationService: Error storing push token:', error);
      return false;
    }
  }

  // Send push notification (simplified version)
  async sendPushNotification(
    pushToken: string,
    notification: PushNotificationData
  ): Promise<boolean> {
    try {
      console.log('NotificationService: Sending push notification to:', pushToken);
      console.log('NotificationService: Notification data:', notification);
      
      // For now, just log the notification
      // In production, you would send to Expo Push API
      console.log('NotificationService: Mock notification sent');
      return true;
    } catch (error) {
      console.error('NotificationService: Error sending push notification:', error);
      return false;
    }
  }

  // Get stored push token
  getStoredPushToken(): string | null {
    return this.expoPushToken;
  }

  // Mock methods for compatibility
  async getPermissions(): Promise<any> {
    return { status: 'granted' };
  }

  async requestPermissions(): Promise<any> {
    return { status: 'granted' };
  }

  addNotificationReceivedListener(listener: (notification: any) => void) {
    console.log('NotificationService: Mock notification listener added');
    return { remove: () => {} };
  }

  addNotificationResponseReceivedListener(listener: (response: any) => void) {
    console.log('NotificationService: Mock notification response listener added');
    return { remove: () => {} };
  }
}

export const notificationService = NotificationService.getInstance();