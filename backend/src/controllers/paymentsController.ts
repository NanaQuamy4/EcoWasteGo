import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class PaymentsController {
  /**
   * Create a new payment for a waste collection
   */
  static async createPayment(req: Request, res: Response): Promise<void> {
    try {
      const customerId = req.user?.id;
      const { collection_id, amount, payment_method, description } = req.body;

      if (!collection_id || !amount || !payment_method) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
        return;
      }

      // Verify collection exists and belongs to customer
      const { data: collection, error: collectionError } = await supabase
        .from('waste_collections')
        .select('*')
        .eq('id', collection_id)
        .eq('customer_id', customerId)
        .eq('status', 'completed')
        .single();

      if (collectionError || !collection) {
        res.status(404).json({
          success: false,
          error: 'Collection not found or not completed'
        });
        return;
      }

      // Check if payment already exists
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('*')
        .eq('collection_id', collection_id)
        .single();

      if (existingPayment) {
        res.status(400).json({
          success: false,
          error: 'Payment already exists for this collection'
        });
        return;
      }

      // Create payment
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          customer_id: customerId,
          recycler_id: collection.recycler_id,
          collection_id,
          amount: parseFloat(amount),
          payment_method,
          description,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        res.status(400).json({
          success: false,
          error: 'Failed to create payment'
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: payment,
        message: 'Payment created successfully'
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create payment'
      });
    }
  }

  /**
   * Get payments for current user
   */
  static async getUserPayments(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const { page = 1, limit = 10, status } = req.query;

      let query = supabase
        .from('payments')
        .select(`
          *,
          collections:collection_id(id, waste_type, weight, address),
          customers:customer_id(id, username),
          recyclers:recycler_id(id, username)
        `);

      // Filter by user role
      if (userRole === 'customer') {
        query = query.eq('customer_id', userId);
      } else if (userRole === 'recycler') {
        query = query.eq('recycler_id', userId);
      }

      // Filter by status if provided
      if (status) {
        query = query.eq('status', status);
      }

      // Pagination
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      query = query.range(offset, offset + parseInt(limit as string) - 1);
      query = query.order('created_at', { ascending: false });

      const { data: payments, error } = await query;

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch payments'
        });
        return;
      }

      res.json({
        success: true,
        data: payments,
        message: 'Payments retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting payments:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payments'
      });
    }
  }

  /**
   * Get specific payment details
   */
  static async getPaymentDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      let query = supabase
        .from('payments')
        .select(`
          *,
          collections:collection_id(id, waste_type, weight, address, pickup_date),
          customers:customer_id(id, username, phone),
          recyclers:recycler_id(id, username, phone)
        `)
        .eq('id', id);

      // Ensure user can only access their own payments
      if (userRole === 'customer') {
        query = query.eq('customer_id', userId);
      } else if (userRole === 'recycler') {
        query = query.eq('recycler_id', userId);
      }

      const { data: payment, error } = await query.single();

      if (error || !payment) {
        res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
        return;
      }

      res.json({
        success: true,
        data: payment,
        message: 'Payment details retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting payment details:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payment details'
      });
    }
  }

  /**
   * Confirm payment (customer)
   */
  static async confirmPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const customerId = req.user?.id;

      const { data: payment, error } = await supabase
        .from('payments')
        .update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('customer_id', customerId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error || !payment) {
        res.status(400).json({
          success: false,
          error: 'Failed to confirm payment'
        });
        return;
      }

      res.json({
        success: true,
        data: payment,
        message: 'Payment confirmed successfully'
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to confirm payment'
      });
    }
  }

  /**
   * Complete payment (recycler)
   */
  static async completePayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const recyclerId = req.user?.id;

      const { data: payment, error } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('recycler_id', recyclerId)
        .eq('status', 'confirmed')
        .select()
        .single();

      if (error || !payment) {
        res.status(400).json({
          success: false,
          error: 'Failed to complete payment'
        });
        return;
      }

      res.json({
        success: true,
        data: payment,
        message: 'Payment completed successfully'
      });
    } catch (error) {
      console.error('Error completing payment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete payment'
      });
    }
  }

  /**
   * Cancel payment (customer)
   */
  static async cancelPayment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const customerId = req.user?.id;

      const { data: payment, error } = await supabase
        .from('payments')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('customer_id', customerId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error || !payment) {
        res.status(400).json({
          success: false,
          error: 'Failed to cancel payment'
        });
        return;
      }

      res.json({
        success: true,
        data: payment,
        message: 'Payment cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling payment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel payment'
      });
    }
  }

  /**
   * Get payment summary
   */
  static async getPaymentSummary(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const { period = 'month' } = req.query;

      let dateFilter = new Date();
      switch (period) {
        case 'week':
          dateFilter.setDate(dateFilter.getDate() - 7);
          break;
        case 'month':
          dateFilter.setMonth(dateFilter.getMonth() - 1);
          break;
        case 'year':
          dateFilter.setFullYear(dateFilter.getFullYear() - 1);
          break;
        default:
          dateFilter.setMonth(dateFilter.getMonth() - 1);
      }

      let query = supabase
        .from('payments')
        .select('*')
        .gte('created_at', dateFilter.toISOString());

      // Filter by user role
      if (userRole === 'customer') {
        query = query.eq('customer_id', userId);
      } else if (userRole === 'recycler') {
        query = query.eq('recycler_id', userId);
      }

      const { data: payments, error } = await query;

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch payment summary'
        });
        return;
      }

      const summary = {
        totalPayments: payments?.length || 0,
        totalAmount: payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0,
        completedPayments: payments?.filter(p => p.status === 'completed').length || 0,
        pendingPayments: payments?.filter(p => p.status === 'pending').length || 0,
        confirmedPayments: payments?.filter(p => p.status === 'confirmed').length || 0,
        cancelledPayments: payments?.filter(p => p.status === 'cancelled').length || 0,
        averagePaymentAmount: payments?.length > 0 ? 
          payments.reduce((sum, payment) => sum + (payment.amount || 0), 0) / payments.length : 0
      };

      res.json({
        success: true,
        data: summary,
        message: 'Payment summary retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting payment summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve payment summary'
      });
    }
  }
} 