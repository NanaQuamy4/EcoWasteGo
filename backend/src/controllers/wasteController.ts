import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class WasteController {
  /**
   * Create a new waste collection request
   */
  static async createCollection(req: Request, res: Response): Promise<void> {
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
        res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
        return;
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
        res.status(400).json({
          success: false,
          error: 'Failed to create collection request'
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: collection,
        message: 'Waste collection request created successfully'
      });
    } catch (error) {
      console.error('Error creating waste collection:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create collection request'
      });
    }
  }

  /**
   * Get collections for current user
   */
  static async getUserCollections(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const { page = 1, limit = 10, status } = req.query;

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
        res.status(500).json({
          success: false,
          error: 'Failed to fetch collections'
        });
        return;
      }

      res.json({
        success: true,
        data: collections,
        message: 'Collections retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting collections:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve collections'
      });
    }
  }

  /**
   * Get specific collection details
   */
  static async getCollectionDetails(req: Request, res: Response): Promise<void> {
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
        res.status(404).json({
          success: false,
          error: 'Collection not found'
        });
        return;
      }

      res.json({
        success: true,
        data: collection,
        message: 'Collection details retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting collection details:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve collection details'
      });
    }
  }

  /**
   * Get available collections for recyclers
   */
  static async getAvailableCollections(req: Request, res: Response): Promise<void> {
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
        res.status(500).json({
          success: false,
          error: 'Failed to fetch available collections'
        });
        return;
      }

      res.json({
        success: true,
        data: collections,
        message: 'Available collections retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting available collections:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve available collections'
      });
    }
  }

  /**
   * Accept collection (recycler)
   */
  static async acceptCollection(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const recyclerId = req.user?.id;

      const { data: collection, error } = await supabase
        .from('waste_collections')
        .update({
          recycler_id: recyclerId,
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('status', 'pending')
        .select()
        .single();

      if (error || !collection) {
        res.status(400).json({
          success: false,
          error: 'Failed to accept collection'
        });
        return;
      }

      res.json({
        success: true,
        data: collection,
        message: 'Collection accepted successfully'
      });
    } catch (error) {
      console.error('Error accepting collection:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to accept collection'
      });
    }
  }

  /**
   * Start collection (recycler)
   */
  static async startCollection(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const recyclerId = req.user?.id;

      const { data: collection, error } = await supabase
        .from('waste_collections')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('recycler_id', recyclerId)
        .eq('status', 'accepted')
        .select()
        .single();

      if (error || !collection) {
        res.status(400).json({
          success: false,
          error: 'Failed to start collection'
        });
        return;
      }

      res.json({
        success: true,
        data: collection,
        message: 'Collection started successfully'
      });
    } catch (error) {
      console.error('Error starting collection:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start collection'
      });
    }
  }

  /**
   * Complete collection (recycler)
   */
  static async completeCollection(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const recyclerId = req.user?.id;
      const { actual_weight, notes } = req.body;

      const { data: collection, error } = await supabase
        .from('waste_collections')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          actual_weight: actual_weight ? parseFloat(actual_weight) : null,
          notes: notes || null
        })
        .eq('id', id)
        .eq('recycler_id', recyclerId)
        .eq('status', 'in_progress')
        .select()
        .single();

      if (error || !collection) {
        res.status(400).json({
          success: false,
          error: 'Failed to complete collection'
        });
        return;
      }

      res.json({
        success: true,
        data: collection,
        message: 'Collection completed successfully'
      });
    } catch (error) {
      console.error('Error completing collection:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete collection'
      });
    }
  }

  /**
   * Cancel collection
   */
  static async cancelCollection(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const { data: collection, error } = await supabase
        .from('waste_collections')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', id)
        .in('status', ['pending', 'accepted'])
        .or(`customer_id.eq.${userId},recycler_id.eq.${userId}`)
        .select()
        .single();

      if (error || !collection) {
        res.status(400).json({
          success: false,
          error: 'Failed to cancel collection'
        });
        return;
      }

      res.json({
        success: true,
        data: collection,
        message: 'Collection cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling collection:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel collection'
      });
    }
  }

  /**
   * Update collection status (generic status update)
   */
  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status, rejection_reason } = req.body;
      const userId = req.user?.id;

      // Validate status
      const validStatuses = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Invalid status provided'
        });
        return;
      }

      // Get the current collection to check if it was accepted by a recycler
      const { data: currentCollection, error: fetchError } = await supabase
        .from('waste_collections')
        .select('id, customer_id, recycler_id, status')
        .eq('id', id)
        .single();

      if (fetchError || !currentCollection) {
        res.status(404).json({
          success: false,
          error: 'Collection not found'
        });
        return;
      }

      // Build update object
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      // Add status-specific fields
      switch (status) {
        case 'accepted':
          updateData.recycler_id = userId;
          updateData.accepted_at = new Date().toISOString();
          break;
        case 'in_progress':
          updateData.started_at = new Date().toISOString();
          break;
        case 'completed':
          updateData.completed_at = new Date().toISOString();
          break;
        case 'cancelled':
          updateData.cancelled_at = new Date().toISOString();
          if (rejection_reason) {
            updateData.rejection_reason = rejection_reason;
          }
          
          // If a recycler is rejecting an accepted request, track them as rejected
          if (currentCollection.recycler_id && currentCollection.recycler_id === userId && currentCollection.status === 'accepted') {
            try {
              await supabase
                .from('rejected_recyclers')
                .insert({
                  request_id: id,
                  customer_id: currentCollection.customer_id,
                  recycler_id: userId,
                  rejection_reason: rejection_reason || 'No reason provided'
                });
            } catch (trackError) {
              console.warn('Failed to track rejected recycler:', trackError);
              // Don't fail the main operation if tracking fails
            }
          }
          break;
      }

      const { data: collection, error } = await supabase
        .from('waste_collections')
        .update(updateData)
        .eq('id', id)
        .or(`customer_id.eq.${userId},recycler_id.eq.${userId}`)
        .select()
        .single();

      if (error || !collection) {
        res.status(400).json({
          success: false,
          error: 'Failed to update collection status'
        });
        return;
      }

      res.json({
        success: true,
        data: collection,
        message: `Collection status updated to ${status} successfully`
      });
    } catch (error) {
      console.error('Error updating collection status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update collection status'
      });
    }
  }

  /**
   * Get available recyclers excluding those who have rejected this customer's requests
   */
  static async getAvailableRecyclersExcludingRejected(req: Request, res: Response): Promise<void> {
    try {
      const customerId = req.user?.id;
      const { location } = req.query;

      if (!customerId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      // Use the database function to get recyclers excluding rejected ones
      let query = supabase.rpc('get_available_recyclers_excluding_rejected', {
        p_customer_id: customerId,
        p_location: location as string || null
      });

      const { data: recyclers, error } = await query;

      if (error) {
        console.error('Error fetching available recyclers:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch available recyclers'
        });
        return;
      }

      res.json({
        success: true,
        data: recyclers,
        message: 'Available recyclers fetched successfully'
      });
    } catch (error) {
      console.error('Error in getAvailableRecyclersExcludingRejected:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get waste collection requests for recyclers with customer information
   */
  static async getRecyclerRequests(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;
      const { status, page = 1, limit = 20 } = req.query;

      if (!recyclerId) {
        res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
        return;
      }

      let query = supabase
        .from('waste_collections')
        .select(`
          id,
          waste_type,
          weight,
          pickup_address,
          pickup_notes,
          status,
          created_at,
          customer_id,
          recycler_id,
          customers:customer_id(
            id,
            username,
            phone,
            address
          )
        `)
        .or(`status.eq.pending,status.eq.accepted,status.eq.in_progress`)
        .order('created_at', { ascending: false });

      // Filter by status if provided
      if (status) {
        query = query.eq('status', status);
      }

      // Pagination
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      query = query.range(offset, offset + parseInt(limit as string) - 1);

      const { data: collections, error } = await query;

      if (error) {
        console.error('Error fetching recycler requests:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to fetch recycler requests'
        });
        return;
      }

      // Format the data for the frontend
      const formattedCollections = collections?.map(collection => ({
        id: collection.id,
        waste_type: collection.waste_type,
        weight: collection.weight,
        pickup_address: collection.pickup_address,
        pickup_notes: collection.pickup_notes,
        status: collection.status,
        created_at: collection.created_at,
        customer_id: collection.customer_id,
        recycler_id: collection.recycler_id,
        customer: {
          username: collection.customers?.[0]?.username || 'Unknown Customer',
          phone: collection.customers?.[0]?.phone || 'No phone',
          address: collection.customers?.[0]?.address || 'No address'
        }
      })) || [];

      res.json({
        success: true,
        data: formattedCollections,
        message: 'Recycler requests fetched successfully'
      });
    } catch (error) {
      console.error('Error in getRecyclerRequests:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
} 