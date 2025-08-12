import express from 'express';
import { supabase } from '../config/supabase';
import { authenticateCustomer, authenticateRecycler, authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route POST /api/payments/create
 * @desc Create a new payment for a waste collection
 * @access Private (Customer only)
 */
router.post('/create', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.user?.id;
    const { collection_id, amount, payment_method, description } = req.body;

    if (!collection_id || !amount || !payment_method) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
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
      return res.status(404).json({
        success: false,
        error: 'Collection not found or not completed'
      });
    }

    // Check if payment already exists
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('*')
      .eq('collection_id', collection_id)
      .single();

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        error: 'Payment already exists for this collection'
      });
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
      return res.status(400).json({
        success: false,
        error: 'Failed to create payment'
      });
    }

    return res.status(201).json({
      success: true,
      data: payment,
      message: 'Payment created successfully'
    });
  } catch (error) {
    console.error('Error creating payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create payment'
    });
  }
});

/**
 * @route GET /api/payments
 * @desc Get payments for current user
 * @access Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { status, page = 1, limit = 10 } = req.query;

    let query = supabase
      .from('payments')
      .select(`
        *,
        collections:collection_id(id, waste_type, weight, pickup_date),
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
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch payments'
      });
    }

    return res.json({
      success: true,
      data: payments,
      message: 'Payments retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting payments:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve payments'
    });
  }
});

/**
 * @route GET /api/payments/recycler
 * @desc Get payments specifically for recycler (with enhanced data)
 * @access Private (Recycler only)
 */
router.get('/recycler', authenticateRecycler, async (req, res) => {
  try {
    const recyclerId = req.user?.id;
    const { status, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('payments')
      .select(`
        id,
        amount,
        status,
        created_at,
        collection_id,
        collections:collection_id(
          id,
          waste_type,
          weight,
          pickup_date,
          address,
          customer_id,
          customers:customer_id(username, phone)
        )
      `)
      .eq('recycler_id', recyclerId)
      .order('created_at', { ascending: false });

    // Filter by status if provided
    if (status) {
      query = query.eq('status', status);
    }

    // Pagination
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    query = query.range(offset, offset + parseInt(limit as string) - 1);

    const { data: payments, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch recycler payments'
      });
    }

    // Format the data for the frontend
    const formattedPayments = payments?.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      created_at: payment.created_at,
      pickupId: payment.collection_id,
      wasteType: payment.collections?.[0]?.waste_type || 'Mixed Waste',
      weight: payment.collections?.[0]?.weight || 0,
      customer: payment.collections?.[0]?.customers?.[0]?.username || 'Customer',
      pickupDate: payment.collections?.[0]?.pickup_date || payment.created_at
    })) || [];

    return res.json({
      success: true,
      data: formattedPayments,
      message: 'Recycler payments retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting recycler payments:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve recycler payments'
    });
  }
});

/**
 * @route GET /api/payments/:id
 * @desc Get specific payment details
 * @access Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let query = supabase
      .from('payments')
      .select(`
        *,
        collections:collection_id(id, waste_type, weight, pickup_date, address),
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
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    return res.json({
      success: true,
      data: payment,
      message: 'Payment details retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting payment details:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve payment details'
    });
  }
});

/**
 * @route PUT /api/payments/:id/confirm
 * @desc Confirm payment (recycler only)
 * @access Private (Recycler only)
 */
router.put('/:id/confirm', authenticateRecycler, async (req, res) => {
  try {
    const { id } = req.params;
    const recyclerId = req.user?.id;

    // Check if payment exists and is assigned to this recycler
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .eq('recycler_id', recyclerId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found or not assigned to you'
      });
    }

    // Update payment status
    const { data: updatedPayment, error } = await supabase
      .from('payments')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Failed to confirm payment'
      });
    }

    return res.json({
      success: true,
      data: updatedPayment,
      message: 'Payment confirmed successfully'
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to confirm payment'
    });
  }
});

/**
 * @route PUT /api/payments/:id/complete
 * @desc Complete payment (recycler only)
 * @access Private (Recycler only)
 */
router.put('/:id/complete', authenticateRecycler, async (req, res) => {
  try {
    const { id } = req.params;
    const recyclerId = req.user?.id;
    const { transaction_id, notes } = req.body;

    // Check if payment exists and is confirmed
    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .eq('recycler_id', recyclerId)
      .eq('status', 'confirmed')
      .single();

    if (fetchError || !payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found or not confirmed'
      });
    }

    // Update payment status
    const { data: updatedPayment, error } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        transaction_id,
        notes,
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Failed to complete payment'
      });
    }

    return res.json({
      success: true,
      data: updatedPayment,
      message: 'Payment completed successfully'
    });
  } catch (error) {
    console.error('Error completing payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to complete payment'
    });
  }
});

/**
 * @route PUT /api/payments/:id/cancel
 * @desc Cancel payment
 * @access Private
 */
router.put('/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Check if payment exists and user has permission
    let query = supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .in('status', ['pending', 'confirmed']);

    if (userRole === 'customer') {
      query = query.eq('customer_id', userId);
    } else if (userRole === 'recycler') {
      query = query.eq('recycler_id', userId);
    }

    const { data: payment, error: fetchError } = await query.single();

    if (fetchError || !payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found or cannot be cancelled'
      });
    }

    // Update payment status
    const { data: updatedPayment, error } = await supabase
      .from('payments')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Failed to cancel payment'
      });
    }

    return res.json({
      success: true,
      data: updatedPayment,
      message: 'Payment cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel payment'
    });
  }
});

/**
 * @route GET /api/payments/summary
 * @desc Get payment summary for current user
 * @access Private
 */
router.get('/summary', authenticateToken, async (req, res) => {
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
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch payment summary'
      });
    }

    const summary = {
      totalPayments: payments?.length || 0,
      totalAmount: payments?.reduce((sum, payment) => sum + payment.amount, 0) || 0,
      pendingPayments: payments?.filter(p => p.status === 'pending').length || 0,
      completedPayments: payments?.filter(p => p.status === 'completed').length || 0,
      cancelledPayments: payments?.filter(p => p.status === 'cancelled').length || 0
    };

    return res.json({
      success: true,
      data: summary,
      message: 'Payment summary retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting payment summary:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve payment summary'
    });
  }
});

export default router; 