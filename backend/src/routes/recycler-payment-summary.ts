import express from 'express';
import { RecyclerPaymentSummaryController } from '../controllers/recyclerPaymentSummaryController';
import { authenticateRecycler } from '../middleware/auth';

const router = express.Router();

/**
 * @route POST /api/recycler-payment-summary/calculate
 * @desc Calculate payment for waste collection
 * @access Private (Recycler)
 */
router.post('/calculate', authenticateRecycler, RecyclerPaymentSummaryController.calculatePayment);

/**
 * @route POST /api/recycler-payment-summary/send
 * @desc Send payment summary to user
 * @access Private (Recycler)
 */
router.post('/send', authenticateRecycler, RecyclerPaymentSummaryController.sendToUser);

/**
 * @route PUT /api/recycler-payment-summary/edit
 * @desc Edit payment summary
 * @access Private (Recycler)
 */
router.put('/edit', authenticateRecycler, RecyclerPaymentSummaryController.editPayment);

/**
 * @route GET /api/recycler-payment-summary/:pickupId
 * @desc Get payment summary for pickup
 * @access Private (Recycler)
 */
router.get('/:pickupId', authenticateRecycler, RecyclerPaymentSummaryController.getPaymentSummary);

/**
 * @route POST /api/recycler-payment-summary/confirm
 * @desc Confirm payment received
 * @access Private (Recycler)
 */
router.post('/confirm', authenticateRecycler, RecyclerPaymentSummaryController.confirmPayment);

export default router; 