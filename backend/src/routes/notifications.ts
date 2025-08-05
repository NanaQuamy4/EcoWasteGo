import express from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route GET /api/notifications
 * @desc Get user's notifications
 * @access Private
 */
router.get('/', authenticateToken, NotificationController.getNotifications);

/**
 * @route GET /api/notifications/unread
 * @desc Get unread notifications count
 * @access Private
 */
router.get('/unread', authenticateToken, NotificationController.getUnreadCount);

/**
 * @route PUT /api/notifications/:id/read
 * @desc Mark notification as read
 * @access Private
 */
router.put('/:id/read', authenticateToken, NotificationController.markAsRead);

/**
 * @route PUT /api/notifications/read-all
 * @desc Mark all notifications as read
 * @access Private
 */
router.put('/read-all', authenticateToken, NotificationController.markAllAsRead);

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete a notification
 * @access Private
 */
router.delete('/:id', authenticateToken, NotificationController.deleteNotification);

/**
 * @route DELETE /api/notifications/clear-all
 * @desc Clear all notifications
 * @access Private
 */
router.delete('/clear-all', authenticateToken, NotificationController.clearAllNotifications);

export default router; 