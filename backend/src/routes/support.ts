import express from 'express';
import { SupportController } from '../controllers/supportController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route POST /api/support/chat
 * @desc Send a message to support chat
 * @access Private
 */
router.post('/chat', authenticateToken, SupportController.sendMessage);

/**
 * @route GET /api/support/chat
 * @desc Get chat history for user
 * @access Private
 */
router.get('/chat', authenticateToken, SupportController.getChatHistory);

/**
 * @route GET /api/support/faq
 * @desc Get FAQ suggestions
 * @access Public
 */
router.get('/faq', SupportController.getFAQSuggestions);

/**
 * @route POST /api/support/ticket
 * @desc Create a support ticket
 * @access Private
 */
router.post('/ticket', authenticateToken, SupportController.createTicket);

/**
 * @route GET /api/support/tickets
 * @desc Get user's support tickets
 * @access Private
 */
router.get('/tickets', authenticateToken, SupportController.getUserTickets);

export default router; 