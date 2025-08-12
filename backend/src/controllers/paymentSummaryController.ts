import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class PaymentSummaryController {
  /**
   * Create a new payment summary
   */
  static async createPaymentSummary(req: Request, res: Response): Promise<void> {
    try {
      const { 
        requestId, 
        weight, 
        wasteType, 
        rate, 
        subtotal, 
        environmentalTax, 
        totalAmount 
      } = req.body;
      
      const recyclerId = req.user?.id;

      if (!recyclerId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Create payment summary
      const { data: paymentSummary, error } = await supabase
        .from('payment_summaries')
        .insert({
          request_id: requestId,
          recycler_id: recyclerId,
          weight,
          waste_type: wasteType,
          rate,
          subtotal,
          environmental_tax: environmentalTax,
          total_amount: totalAmount,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating payment summary:', error);
        res.status(500).json({ error: 'Failed to create payment summary' });
        return;
      }

      // Update waste collection status to 'payment_pending'
      await supabase
        .from('waste_collections')
        .update({ 
          status: 'payment_pending',
          payment_summary_id: paymentSummary.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      res.status(201).json({
        message: 'Payment summary created successfully',
        paymentSummary
      });
    } catch (error) {
      console.error('Error in createPaymentSummary:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get payment summary by request ID
   */
  static async getPaymentSummary(req: Request, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get payment summary and verify user has access
      const { data: paymentSummary, error } = await supabase
        .from('payment_summaries')
        .select(`
          *,
          waste_collections!inner(
            customer_id,
            recycler_id
          )
        `)
        .eq('request_id', requestId)
        .or(`waste_collections.customer_id.eq.${userId},waste_collections.recycler_id.eq.${userId}`)
        .single();

      if (error || !paymentSummary) {
        res.status(404).json({ error: 'Payment summary not found' });
        return;
      }

      res.json({ paymentSummary });
    } catch (error) {
      console.error('Error in getPaymentSummary:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Reject payment summary
   */
  static async rejectPaymentSummary(req: Request, res: Response): Promise<void> {
    try {
      const { paymentSummaryId } = req.params;
      const { rejectionReason } = req.body;
      const customerId = req.user?.id;

      if (!customerId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify customer owns this payment summary
      const { data: paymentSummary, error: fetchError } = await supabase
        .from('payment_summaries')
        .select(`
          *,
          waste_collections!inner(
            customer_id,
            recycler_id
          )
        `)
        .eq('id', paymentSummaryId)
        .eq('waste_collections.customer_id', customerId)
        .single();

      if (fetchError || !paymentSummary) {
        res.status(404).json({ error: 'Payment summary not found' });
        return;
      }

      // Update payment summary status to rejected
      const { error: updateError } = await supabase
        .from('payment_summaries')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          rejected_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentSummaryId);

      if (updateError) {
        console.error('Error rejecting payment summary:', updateError);
        res.status(500).json({ error: 'Failed to reject payment summary' });
        return;
      }

      // Update waste collection status back to 'in_progress'
      await supabase
        .from('waste_collections')
        .update({ 
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentSummary.request_id);

      // Create notification for recycler
      await supabase
        .from('notifications')
        .insert({
          user_id: paymentSummary.waste_collections.recycler_id,
          title: 'Payment Summary Rejected',
          message: `Your payment summary for request ${paymentSummary.request_id} was rejected by the customer.

Reason: ${rejectionReason}

What you need to do:
1. Review your weight calculations
2. Check if waste type matches what was collected
3. Verify rate calculations
4. Recalculate the payment summary
5. Send the corrected version to the customer

Please address the customer's concern and resend the payment summary.`,
          type: 'payment_rejection',
          related_id: paymentSummaryId,
          is_read: false
        });

      res.json({
        message: 'Payment summary rejected successfully',
        notification: 'Recycler has been notified to review and recalculate'
      });
    } catch (error) {
      console.error('Error in rejectPaymentSummary:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Accept payment summary
   */
  static async acceptPaymentSummary(req: Request, res: Response): Promise<void> {
    try {
      const { paymentSummaryId } = req.params;
      const customerId = req.user?.id;

      if (!customerId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify customer owns this payment summary
      const { data: paymentSummary, error: fetchError } = await supabase
        .from('payment_summaries')
        .select(`
          *,
          waste_collections!inner(
            customer_id,
            recycler_id
          )
        `)
        .eq('id', paymentSummaryId)
        .eq('waste_collections.customer_id', customerId)
        .single();

      if (fetchError || !paymentSummary) {
        res.status(404).json({ error: 'Payment summary not found' });
        return;
      }

      // Update payment summary status to accepted
      const { error: updateError } = await supabase
        .from('payment_summaries')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentSummaryId);

      if (updateError) {
        console.error('Error accepting payment summary:', updateError);
        res.status(500).json({ error: 'Failed to accept payment summary' });
        return;
      }

      // Update waste collection status to 'payment_accepted'
      await supabase
        .from('waste_collections')
        .update({ 
          status: 'payment_accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentSummary.request_id);

      // Create notification for recycler
      await supabase
        .from('notifications')
        .insert({
          user_id: paymentSummary.waste_collections.recycler_id,
          title: 'Payment Summary Accepted',
          message: `Your payment summary for request ${paymentSummary.request_id} was accepted. Proceed with collection completion.`,
          type: 'payment_acceptance',
          related_id: paymentSummaryId,
          is_read: false
        });

      res.json({
        message: 'Payment summary accepted successfully',
        notification: 'Recycler has been notified to proceed'
      });
    } catch (error) {
      console.error('Error in acceptPaymentSummary:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Update payment summary (for corrections)
   */
  static async updatePaymentSummary(req: Request, res: Response): Promise<void> {
    try {
      const { paymentSummaryId } = req.params;
      const { 
        weight, 
        wasteType, 
        rate, 
        subtotal, 
        environmentalTax, 
        totalAmount 
      } = req.body;
      
      const recyclerId = req.user?.id;

      if (!recyclerId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Verify recycler owns this payment summary
      const { data: paymentSummary, error: fetchError } = await supabase
        .from('payment_summaries')
        .select(`
          *,
          waste_collections!inner(
            recycler_id
          )
        `)
        .eq('id', paymentSummaryId)
        .eq('waste_collections.recycler_id', recyclerId)
        .single();

      if (fetchError || !paymentSummary) {
        res.status(404).json({ error: 'Payment summary not found' });
        return;
      }

      // Update payment summary
      const { error: updateError } = await supabase
        .from('payment_summaries')
        .update({
          weight,
          waste_type: wasteType,
          rate,
          subtotal,
          environmental_tax: environmentalTax,
          total_amount: totalAmount,
          status: 'pending',
          rejection_reason: null,
          rejected_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentSummaryId);

      if (updateError) {
        console.error('Error updating payment summary:', updateError);
        res.status(500).json({ error: 'Failed to update payment summary' });
        return;
      }

      // Update waste collection status back to 'payment_pending'
      await supabase
        .from('waste_collections')
        .update({ 
          status: 'payment_pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentSummary.request_id);

      // Create notification for customer
      await supabase
        .from('notifications')
        .insert({
          user_id: paymentSummary.waste_collections.customer_id,
          title: 'Payment Summary Updated',
          message: `Your recycler has updated the payment summary for request ${paymentSummary.request_id}. Please review the new calculation.`,
          type: 'payment_update',
          related_id: paymentSummaryId,
          is_read: false
        });

      res.json({
        message: 'Payment summary updated successfully',
        notification: 'Customer has been notified of the update'
      });
    } catch (error) {
      console.error('Error in updatePaymentSummary:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * Get payment summaries for recycler
   */
  static async getRecyclerPaymentSummaries(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;

      if (!recyclerId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { data: paymentSummaries, error } = await supabase
        .from('payment_summaries')
        .select(`
          *,
          waste_collections!inner(
            customer_id,
            pickup_address,
            waste_type
          )
        `)
        .eq('waste_collections.recycler_id', recyclerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment summaries:', error);
        res.status(500).json({ error: 'Failed to fetch payment summaries' });
        return;
      }

      res.json({ paymentSummaries });
    } catch (error) {
      console.error('Error in getRecyclerPaymentSummaries:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
