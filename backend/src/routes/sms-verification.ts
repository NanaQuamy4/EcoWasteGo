import express from 'express';
import { RegisterController } from '../controllers/registerController';
import SMSVerificationController from '../controllers/smsVerificationController';

const router = express.Router();

/**
 * @route POST /api/sms-verification/send-code
 * @desc Send SMS verification code
 * @access Public
 */
router.post('/send-code', SMSVerificationController.sendVerificationCode);

/**
 * @route POST /api/sms-verification/verify-code
 * @desc Verify SMS verification code
 * @access Public
 */
router.post('/verify-code', SMSVerificationController.verifyCode);

/**
 * @route POST /api/sms-verification/resend-code
 * @desc Resend SMS verification code
 * @access Public
 */
router.post('/resend-code', SMSVerificationController.resendCode);

/**
 * @route GET /api/sms-verification/status
 * @desc Get SMS service status
 * @access Public
 */
router.get('/status', SMSVerificationController.getServiceStatus);

/**
 * @route GET /api/sms-verification/test
 * @desc Test SMS service configuration and mNotify API connectivity
 * @access Public
 */
router.get('/test', SMSVerificationController.testSMSConfiguration);

/**
 * @route POST /api/sms-verification/register
 * @desc Register user with verified SMS
 * @access Public
 */
router.post('/register', RegisterController.registerWithSMSVerification);

export default router;
