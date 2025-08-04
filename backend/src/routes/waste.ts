import express from 'express';
import { supabase } from '../config/supabase';
import { authenticateCustomer, authenticateRecycler, authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route POST /api/waste/collections
 * @desc Create a new waste collection request
 * @access Private (Customer only)
 */
router.post('/collections', authenticateCustomer, async (req, res) => {
  try {
    const customerId = req.user?.id;
    const { 
      waste_type, 
      weight, 
      description, 
      pickup_date, 
      pickup_time,
      address,
      special_instructions 
    } = req.body;

    if (!waste_type || !weight || !pickup_date || !pickup_time || !address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const { data: collection, error } = await supabase
      .from('waste_collections')
      .insert({
        customer_id: customerId,
        waste_type,
        weight: parseFloat(weight),
        description,
        pickup_date,
        pickup_time,
        address,
        special_instructions,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Failed to create collection request'
      });
    }

    res.status(201).json({
      success: true,
      data: collection,
      message: 'Waste collection request created successfully'
    });
  } catch (error) {
    console.error('Error creating waste collection:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create collection request'
    });
  }
});

/**
 * @route GET /api/waste/collections
 * @desc Get waste collections for current user
 * @access Private
 */
router.get('/collections', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { status, page = 1, limit = 10 } = req.query;

    let query = supabase
      .from('waste_collections')
      .select(`
        *,
        customers:customer_id(id, username, phone, address),
        recyclers:recycler_id(id, username, phone)
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

    const { data: collections, error } = await query;

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch collections'
      });
    }

    res.json({
      success: true,
      data: collections,
      message: 'Collections retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting collections:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve collections'
    });
  }
});

/**
 * @route GET /api/waste/collections/:id
 * @desc Get specific waste collection details
 * @access Private
 */
router.get('/collections/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    let query = supabase
      .from('waste_collections')
      .select(`
        *,
        customers:customer_id(id, username, phone, address),
        recyclers:recycler_id(id, username, phone)
      `)
      .eq('id', id);

    // Ensure user can only access their own collections
    if (userRole === 'customer') {
      query = query.eq('customer_id', userId);
    } else if (userRole === 'recycler') {
      query = query.eq('recycler_id', userId);
    }

    const { data: collection, error } = await query.single();

    if (error || !collection) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found'
      });
    }

    res.json({
      success: true,
      data: collection,
      message: 'Collection details retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting collection details:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve collection details'
    });
  }
});

/**
 * @route PUT /api/waste/collections/:id/accept
 * @desc Accept a waste collection request (recycler only)
 * @access Private (Recycler only)
 */
router.put('/collections/:id/accept', authenticateRecycler, async (req, res) => {
  try {
    const { id } = req.params;
    const recyclerId = req.user?.id;

    // Check if collection exists and is pending
    const { data: collection, error: fetchError } = await supabase
      .from('waste_collections')
      .select('*')
      .eq('id', id)
      .eq('status', 'pending')
      .single();

    if (fetchError || !collection) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found or already assigned'
      });
    }

    // Update collection status
    const { data: updatedCollection, error } = await supabase
      .from('waste_collections')
      .update({
        recycler_id: recyclerId,
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Failed to accept collection'
      });
    }

    res.json({
      success: true,
      data: updatedCollection,
      message: 'Collection accepted successfully'
    });
  } catch (error) {
    console.error('Error accepting collection:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to accept collection'
    });
  }
});

/**
 * @route PUT /api/waste/collections/:id/start
 * @desc Start waste collection (recycler only)
 * @access Private (Recycler only)
 */
router.put('/collections/:id/start', authenticateRecycler, async (req, res) => {
  try {
    const { id } = req.params;
    const recyclerId = req.user?.id;

    // Check if collection is assigned to this recycler
    const { data: collection, error: fetchError } = await supabase
      .from('waste_collections')
      .select('*')
      .eq('id', id)
      .eq('recycler_id', recyclerId)
      .eq('status', 'accepted')
      .single();

    if (fetchError || !collection) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found or not assigned to you'
      });
    }

    // Update collection status
    const { data: updatedCollection, error } = await supabase
      .from('waste_collections')
      .update({
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Failed to start collection'
      });
    }

    res.json({
      success: true,
      data: updatedCollection,
      message: 'Collection started successfully'
    });
  } catch (error) {
    console.error('Error starting collection:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to start collection'
    });
  }
});

/**
 * @route PUT /api/waste/collections/:id/complete
 * @desc Complete waste collection (recycler only)
 * @access Private (Recycler only)
 */
router.put('/collections/:id/complete', authenticateRecycler, async (req, res) => {
  try {
    const { id } = req.params;
    const recyclerId = req.user?.id;
    const { actual_weight, notes } = req.body;

    // Check if collection is in progress and assigned to this recycler
    const { data: collection, error: fetchError } = await supabase
      .from('waste_collections')
      .select('*')
      .eq('id', id)
      .eq('recycler_id', recyclerId)
      .eq('status', 'in_progress')
      .single();

    if (fetchError || !collection) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found or not in progress'
      });
    }

    // Update collection status
    const { data: updatedCollection, error } = await supabase
      .from('waste_collections')
      .update({
        status: 'completed',
        actual_weight: actual_weight || collection.weight,
        notes,
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Failed to complete collection'
      });
    }

    res.json({
      success: true,
      data: updatedCollection,
      message: 'Collection completed successfully'
    });
  } catch (error) {
    console.error('Error completing collection:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to complete collection'
    });
  }
});

/**
 * @route PUT /api/waste/collections/:id/cancel
 * @desc Cancel waste collection request
 * @access Private
 */
router.put('/collections/:id/cancel', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Check if collection exists and user has permission
    let query = supabase
      .from('waste_collections')
      .select('*')
      .eq('id', id)
      .in('status', ['pending', 'accepted']);

    if (userRole === 'customer') {
      query = query.eq('customer_id', userId);
    } else if (userRole === 'recycler') {
      query = query.eq('recycler_id', userId);
    }

    const { data: collection, error: fetchError } = await query.single();

    if (fetchError || !collection) {
      return res.status(404).json({
        success: false,
        error: 'Collection not found or cannot be cancelled'
      });
    }

    // Update collection status
    const { data: updatedCollection, error } = await supabase
      .from('waste_collections')
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
        error: 'Failed to cancel collection'
      });
    }

    res.json({
      success: true,
      data: updatedCollection,
      message: 'Collection cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling collection:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel collection'
    });
  }
});

/**
 * @route GET /api/waste/available
 * @desc Get available waste collections for recyclers
 * @access Private (Recycler only)
 */
router.get('/available', authenticateRecycler, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const { data: collections, error } = await supabase
      .from('waste_collections')
      .select(`
        *,
        customers:customer_id(id, username, phone, address)
      `)
      .eq('status', 'pending')
      .range(offset, offset + parseInt(limit as string) - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch available collections'
      });
    }

    res.json({
      success: true,
      data: collections,
      message: 'Available collections retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting available collections:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve available collections'
    });
  }
});

export default router; 