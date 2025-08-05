import express from 'express';
import { RecyclerWeightEntryController } from '../controllers/recyclerWeightEntryController';
import { authenticateRecycler } from '../middleware/auth';

const router = express.Router();

/**
 * @route POST /api/recycler-weight-entry/calculate
 * @desc Calculate bill based on weight and waste type
 * @access Private (Recycler)
 */
router.post('/calculate', authenticateRecycler, RecyclerWeightEntryController.calculateBill);

/**
 * @route POST /api/recycler-weight-entry/submit
 * @desc Submit weight entry and create payment
 * @access Private (Recycler)
 */
router.post('/submit', authenticateRecycler, RecyclerWeightEntryController.submitWeightEntry);

/**
 * @route GET /api/recycler-weight-entry/rates
 * @desc Get current rates for different waste types
 * @access Private (Recycler)
 */
router.get('/rates', authenticateRecycler, RecyclerWeightEntryController.getRates);

/**
 * @route GET /api/recycler-weight-entry/:pickupId
 * @desc Get weight entry details for a specific pickup
 * @access Private (Recycler)
 */
router.get('/:pickupId', authenticateRecycler, RecyclerWeightEntryController.getWeightEntry);

export default router; 