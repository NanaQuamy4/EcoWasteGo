import express from 'express';
import { RegisterController } from '../controllers/registerController';

const router = express.Router();

/**
 * @route POST /api/register
 * @desc Register a new user
 * @access Public
 */
router.post('/', RegisterController.registerUser);

/**
 * @route POST /api/register/verify-email
 * @desc Verify email with OTP
 * @access Public
 */
router.post('/verify-email', RegisterController.verifyEmail);

/**
 * @route POST /api/register/resend-otp
 * @desc Resend OTP to email
 * @access Public
 */
router.post('/resend-otp', RegisterController.resendOTP);

/**
 * @route GET /api/register/check-email
 * @desc Check if email is available
 * @access Public
 */
router.get('/check-email', RegisterController.checkEmailAvailability);

export default router; 