import express from 'express';
import { OnboardingController } from '../controllers/onboardingController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route GET /api/onboarding/slides
 * @desc Get onboarding slides content
 * @access Public
 */
router.get('/slides', OnboardingController.getOnboardingSlides);

/**
 * @route POST /api/onboarding/complete
 * @desc Mark onboarding as completed for user
 * @access Private
 */
router.post('/complete', authenticateToken, OnboardingController.completeOnboarding);

/**
 * @route GET /api/onboarding/status
 * @desc Get user's onboarding status
 * @access Private
 */
router.get('/status', authenticateToken, OnboardingController.getOnboardingStatus);

/**
 * @route PUT /api/onboarding/preferences
 * @desc Update user onboarding preferences
 * @access Private
 */
router.put('/preferences', authenticateToken, OnboardingController.updatePreferences);

export default router; 