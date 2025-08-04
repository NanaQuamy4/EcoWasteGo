import express from 'express';
import { NotificationsController } from '../controllers/notificationsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route GET /api/notifications
 * @desc Get notifications for current user
 * @access Private
 */
router.get('/', authenticateToken, NotificationsController.getNotifications);

/**
 * @route PUT /api/notifications/:id/read
 * @desc Mark notification as read
 * @access Private
 */
router.put('/:id/read', authenticateToken, NotificationsController.markAsRead);

/**
 * @route PUT /api/notifications/read-all
 * @desc Mark all notifications as read
 * @access Private
 */
router.put('/read-all', authenticateToken, NotificationsController.markAllAsRead);

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete notification
 * @access Private
 */
router.delete('/:id', authenticateToken, NotificationsController.deleteNotification);

/**
 * @route GET /api/notifications/unread-count
 * @desc Get unread notifications count
 * @access Private
 */
router.get('/unread-count', authenticateToken, NotificationsController.getUnreadCount);

export default router; 