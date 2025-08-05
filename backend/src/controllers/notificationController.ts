import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class NotificationController {
  /**
   * Get user's notifications
   */
  static async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 20 } = req.query;

      const offset = (Number(page) - 1) * Number(limit);

      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + Number(limit) - 1);

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch notifications'
        });
        return;
      }

      // For now, return mock data based on NotificationScreen
      const mockNotifications = [
        {
          id: '1',
          title: 'Pickup Confirmed',
          message: 'Your waste pickup is scheduled for tomorrow at 10:00 AM.',
          type: 'pickup_confirmed',
          is_read: false,
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Points Earned',
          message: 'You earned 50 points for your last pickup!',
          type: 'points_earned',
          is_read: false,
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: '3',
          title: 'Challenge Unlocked',
          message: 'A new recycling challenge is available. Join now!',
          type: 'challenge_unlocked',
          is_read: true,
          created_at: new Date(Date.now() - 7200000).toISOString()
        },
        {
          id: '4',
          title: 'Pickup Completed',
          message: 'Your waste was successfully picked up. Thank you!',
          type: 'pickup_completed',
          is_read: true,
          created_at: new Date(Date.now() - 10800000).toISOString()
        }
      ];

      res.json({
        success: true,
        data: {
          notifications: mockNotifications,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: mockNotifications.length
          }
        },
        message: 'Notifications retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get notifications'
      });
    }
  }

  /**
   * Get unread notifications count
   */
  static async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to get unread count'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          unreadCount: count || 0
        },
        message: 'Unread count retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting unread count:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get unread count'
      });
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const { data: notification, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to mark notification as read'
        });
        return;
      }

      res.json({
        success: true,
        data: notification,
        message: 'Notification marked as read'
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark notification as read'
      });
    }
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to mark all notifications as read'
        });
        return;
      }

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark all notifications as read'
      });
    }
  }

  /**
   * Delete a notification
   */
  static async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to delete notification'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete notification'
      });
    }
  }

  /**
   * Clear all notifications
   */
  static async clearAllNotifications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to clear all notifications'
        });
        return;
      }

      res.json({
        success: true,
        message: 'All notifications cleared successfully'
      });
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear all notifications'
      });
    }
  }

  /**
   * Create a new notification (internal method)
   */
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: string,
    data?: any
  ): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          type,
          data,
          is_read: false
        });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }
} 