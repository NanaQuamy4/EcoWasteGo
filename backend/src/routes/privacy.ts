import express from 'express';
import { PrivacyController } from '../controllers/privacyController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route GET /api/privacy/policy
 * @desc Get privacy policy content
 * @access Public
 */
router.get('/policy', PrivacyController.getPrivacyPolicy);

/**
 * @route POST /api/privacy/accept
 * @desc Accept privacy policy
 * @access Private
 */
router.post('/accept', authenticateToken, PrivacyController.acceptPrivacyPolicy);

/**
 * @route GET /api/privacy/status
 * @desc Get user's privacy policy acceptance status
 * @access Private
 */
router.get('/status', authenticateToken, PrivacyController.getPrivacyStatus);

/**
 * @route POST /api/privacy/withdraw
 * @desc Withdraw privacy policy consent
 * @access Private
 */
router.post('/withdraw', authenticateToken, PrivacyController.withdrawConsent);

export default router; 