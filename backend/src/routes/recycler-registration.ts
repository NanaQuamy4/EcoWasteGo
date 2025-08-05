import express from 'express';
import { RecyclerRegistrationController } from '../controllers/recyclerRegistrationController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route POST /api/recycler-registration/submit
 * @desc Submit recycler registration
 * @access Private
 */
router.post('/submit', authenticateToken, RecyclerRegistrationController.submitRegistration);

/**
 * @route GET /api/recycler-registration/status
 * @desc Get registration status
 * @access Private
 */
router.get('/status', authenticateToken, RecyclerRegistrationController.getRegistrationStatus);

/**
 * @route PUT /api/recycler-registration/update
 * @desc Update registration details
 * @access Private
 */
router.put('/update', authenticateToken, RecyclerRegistrationController.updateRegistration);

/**
 * @route POST /api/recycler-registration/upload-document
 * @desc Upload registration documents
 * @access Private
 */
router.post('/upload-document', authenticateToken, RecyclerRegistrationController.uploadDocument);

/**
 * @route GET /api/recycler-registration/regions
 * @desc Get available regions and cities
 * @access Public
 */
router.get('/regions', RecyclerRegistrationController.getRegions);

export default router; 