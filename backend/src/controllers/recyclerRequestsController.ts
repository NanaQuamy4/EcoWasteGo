import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class RecyclerRequestsController {
  /**
   * Get pickup requests for recycler
   */
  static async getRequests(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;

      // Get all pickup requests that could be assigned to this recycler
      const { data: requests, error } = await supabase
        .from('waste_collections')
        .select(`
          *,
          customers!inner(
            id,
            username,
            phone
          )
        `)
        .or(`recycler_id.eq.${recyclerId},recycler_id.is.null`)
        .order('created_at', { ascending: false });

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to get requests'
        });
        return;
      }

      // Format requests for frontend
      const formattedRequests = requests.map(request => ({
        id: request.id,
        userName: request.customers.username,
        location: request.pickup_address || 'Location not specified',
        phone: request.customers.phone,
        wasteType: request.waste_type,
        distance: '2.3 km', // Mock distance - would be calculated in real app
        status: request.status,
        createdAt: request.created_at
      }));

      res.json({
        success: true,
        data: formattedRequests,
        message: 'Requests retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting requests:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get requests'
      });
    }
  }

  /**
   * Accept a pickup request
   */
  static async acceptRequest(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;
      const { requestId } = req.params;

      if (!requestId) {
        res.status(400).json({
          success: false,
          error: 'Request ID is required'
        });
        return;
      }

      // Update the pickup request to assign it to this recycler
      const { data: request, error } = await supabase
        .from('waste_collections')
        .update({
          recycler_id: recyclerId,
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .is('recycler_id', null) // Only accept if not already assigned
        .select()
        .single();

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to accept request'
        });
        return;
      }

      if (!request) {
        res.status(400).json({
          success: false,
          error: 'Request not found or already assigned'
        });
        return;
      }

      // Create notification for customer
      await supabase
        .from('notifications')
        .insert({
          user_id: request.customer_id,
          title: 'Pickup Request Accepted',
          message: 'A recycler has accepted your pickup request. They will contact you soon.',
          type: 'success',
          action_url: `/tracking/${requestId}`
        });

      res.json({
        success: true,
        data: request,
        message: 'Request accepted successfully'
      });
    } catch (error) {
      console.error('Error accepting request:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to accept request'
      });
    }
  }

  /**
   * Reject a pickup request
   */
  static async rejectRequest(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;
      const { requestId } = req.params;
      const { reason } = req.body;

      if (!requestId) {
        res.status(400).json({
          success: false,
          error: 'Request ID is required'
        });
        return;
      }

      // Get the request details first
      const { data: request, error: getError } = await supabase
        .from('waste_collections')
        .select('*')
        .eq('id', requestId)
        .single();

      if (getError) {
        res.status(404).json({
          success: false,
          error: 'Request not found'
        });
        return;
      }

      // Create rejection record
      await supabase
        .from('request_rejections')
        .insert({
          collection_id: requestId,
          recycler_id: recyclerId,
          reason: reason || 'No reason provided',
          rejected_at: new Date().toISOString()
        });

      // Create notification for customer
      await supabase
        .from('notifications')
        .insert({
          user_id: request.customer_id,
          title: 'Pickup Request Update',
          message: 'Your pickup request is still being processed. We\'ll find another recycler for you.',
          type: 'info',
          action_url: `/tracking/${requestId}`
        });

      res.json({
        success: true,
        message: 'Request rejected successfully'
      });
    } catch (error) {
      console.error('Error rejecting request:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reject request'
      });
    }
  }

  /**
   * Complete a pickup request
   */
  static async completeRequest(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;
      const { requestId } = req.params;
      const { weight, notes } = req.body;

      if (!requestId) {
        res.status(400).json({
          success: false,
          error: 'Request ID is required'
        });
        return;
      }

      // Update the pickup request status
      const { data: request, error } = await supabase
        .from('waste_collections')
        .update({
          status: 'completed',
          weight: weight || 0,
          pickup_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('recycler_id', recyclerId)
        .select()
        .single();

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to complete request'
        });
        return;
      }

      if (!request) {
        res.status(400).json({
          success: false,
          error: 'Request not found or not assigned to you'
        });
        return;
      }

      // Create notification for customer
      await supabase
        .from('notifications')
        .insert({
          user_id: request.customer_id,
          title: 'Pickup Completed',
          message: 'Your waste pickup has been completed successfully!',
          type: 'success',
          action_url: `/payment-summary/${requestId}`
        });

      res.json({
        success: true,
        data: request,
        message: 'Request completed successfully'
      });
    } catch (error) {
      console.error('Error completing request:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete request'
      });
    }
  }

  /**
   * Get filtered requests (all, active, completed)
   */
  static async getFilteredRequests(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;
      const { filter = 'all' } = req.query;

      let statusFilter = '';
      switch (filter) {
        case 'active':
          statusFilter = 'accepted';
          break;
        case 'completed':
          statusFilter = 'completed';
          break;
        default:
          statusFilter = '';
      }

      let query = supabase
        .from('waste_collections')
        .select(`
          *,
          customers!inner(
            id,
            username,
            phone
          )
        `)
        .eq('recycler_id', recyclerId);

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data: requests, error } = await query.order('created_at', { ascending: false });

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to get filtered requests'
        });
        return;
      }

      // Format requests for frontend
      const formattedRequests = requests.map(request => ({
        id: request.id,
        userName: request.customers.username,
        location: request.pickup_address || 'Location not specified',
        phone: request.customers.phone,
        wasteType: request.waste_type,
        distance: '2.3 km', // Mock distance
        status: request.status,
        createdAt: request.created_at
      }));

      res.json({
        success: true,
        data: formattedRequests,
        message: 'Filtered requests retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting filtered requests:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get filtered requests'
      });
    }
  }

  /**
   * Get recycler request statistics
   */
  static async getRequestStats(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;

      // Get counts for different statuses
      const { count: pendingCount, error: pendingError } = await supabase
        .from('waste_collections')
        .select('*', { count: 'exact', head: true })
        .eq('recycler_id', recyclerId)
        .eq('status', 'pending');

      const { count: activeCount, error: activeError } = await supabase
        .from('waste_collections')
        .select('*', { count: 'exact', head: true })
        .eq('recycler_id', recyclerId)
        .eq('status', 'accepted');

      const { count: completedCount, error: completedError } = await supabase
        .from('waste_collections')
        .select('*', { count: 'exact', head: true })
        .eq('recycler_id', recyclerId)
        .eq('status', 'completed');

      if (pendingError || activeError || completedError) {
        res.status(500).json({
          success: false,
          error: 'Failed to get request statistics'
        });
        return;
      }

      const stats = {
        pending: pendingCount || 0,
        active: activeCount || 0,
        completed: completedCount || 0,
        total: (pendingCount || 0) + (activeCount || 0) + (completedCount || 0)
      };

      res.json({
        success: true,
        data: stats,
        message: 'Request statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting request stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get request statistics'
      });
    }
  }
} 