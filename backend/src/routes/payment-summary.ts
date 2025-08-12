import express from 'express';
import { PaymentSummaryController } from '../controllers/paymentSummaryController';
import { authenticateCustomer, authenticateRecycler, authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route POST /api/payment-summary
 * @desc Create a new payment summary (recycler only)
 * @access Private (Recycler only)
 */
router.post('/', authenticateRecycler, PaymentSummaryController.createPaymentSummary);

/**
 * @route GET /api/payment-summary/:requestId
 * @desc Get payment summary by request ID (customer or recycler)
 * @access Private (Customer or Recycler)
 */
router.get('/:requestId', authenticateToken, PaymentSummaryController.getPaymentSummary);

/**
 * @route PUT /api/payment-summary/:paymentSummaryId/reject
 * @desc Reject payment summary (customer only)
 * @access Private (Customer only)
 */
router.put('/:paymentSummaryId/reject', authenticateCustomer, PaymentSummaryController.rejectPaymentSummary);

/**
 * @route PUT /api/payment-summary/:paymentSummaryId/accept
 * @desc Accept payment summary (customer only)
 * @access Private (Customer only)
 */
router.put('/:paymentSummaryId/accept', authenticateCustomer, PaymentSummaryController.acceptPaymentSummary);

/**
 * @route PUT /api/payment-summary/:paymentSummaryId
 * @desc Update payment summary for corrections (recycler only)
 * @access Private (Recycler only)
 */
router.put('/:paymentSummaryId', authenticateRecycler, PaymentSummaryController.updatePaymentSummary);

/**
 * @route GET /api/payment-summary/recycler/summaries
 * @desc Get all payment summaries for authenticated recycler
 * @access Private (Recycler only)
 */
router.get('/recycler/summaries', authenticateRecycler, PaymentSummaryController.getRecyclerPaymentSummaries);

export default router;
