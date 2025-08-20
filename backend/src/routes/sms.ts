import express from 'express';
import { SMSVerificationController } from '../controllers/smsVerificationController';

const router = express.Router();

/**
 * @route POST /api/sms/quick
 * @desc Send SMS via mNotify API (proxy endpoint)
 * @access Public
 */
router.post('/quick', SMSVerificationController.sendQuickSMS);

/**
 * @route POST /api/sms/send
 * @desc Send SMS via mNotify API
 * @access Public
 */
router.post('/send', SMSVerificationController.sendSMS);

/**
 * @route GET /api/sms/status
 * @desc Get SMS service status
 * @access Public
 */
router.get('/status', SMSVerificationController.getServiceStatus);

export default router;
