import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class HistoryController {
  /**
   * Get user's waste collection history
   */
  static async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const { page = 1, limit = 10, status, waste_type } = req.query;

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

      // Filter by waste type if provided
      if (waste_type) {
        query = query.eq('waste_type', waste_type);
      }

      // Pagination
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      query = query.range(offset, offset + parseInt(limit as string) - 1);
      query = query.order('created_at', { ascending: false });

      const { data: collections, error } = await query;

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch history'
        });
        return;
      }

      res.json({
        success: true,
        data: collections,
        message: 'History retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve history'
      });
    }
  }

  /**
   * Get specific collection details for history
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
          recyclers:recycler_id(id, username, phone),
          payments!inner(*)
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
   * Get history statistics
   */
  static async getHistoryStats(req: Request, res: Response): Promise<void> {
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
        .from('waste_collections')
        .select('*')
        .gte('created_at', dateFilter.toISOString());

      // Filter by user role
      if (userRole === 'customer') {
        query = query.eq('customer_id', userId);
      } else if (userRole === 'recycler') {
        query = query.eq('recycler_id', userId);
      }

      const { data: collections, error } = await query;

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch history stats'
        });
        return;
      }

      const stats = {
        totalCollections: collections?.length || 0,
        completedCollections: collections?.filter(c => c.status === 'completed').length || 0,
        pendingCollections: collections?.filter(c => c.status === 'pending').length || 0,
        cancelledCollections: collections?.filter(c => c.status === 'cancelled').length || 0,
        totalWasteCollected: collections?.filter(c => c.status === 'completed')
          .reduce((sum, c) => sum + (c.weight || 0), 0) || 0,
        averageCollectionWeight: collections?.filter(c => c.status === 'completed').length > 0 ?
          collections.filter(c => c.status === 'completed')
            .reduce((sum, c) => sum + (c.weight || 0), 0) / 
          collections.filter(c => c.status === 'completed').length : 0
      };

      res.json({
        success: true,
        data: stats,
        message: 'History statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting history stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve history statistics'
      });
    }
  }

  /**
   * Export history data (CSV format)
   */
  static async exportHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const { format = 'csv' } = req.query;

      let query = supabase
        .from('waste_collections')
        .select(`
          *,
          customers:customer_id(username),
          recyclers:recycler_id(username)
        `);

      // Filter by user role
      if (userRole === 'customer') {
        query = query.eq('customer_id', userId);
      } else if (userRole === 'recycler') {
        query = query.eq('recycler_id', userId);
      }

      query = query.order('created_at', { ascending: false });

      const { data: collections, error } = await query;

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch history for export'
        });
        return;
      }

      if (format === 'csv') {
        // Generate CSV data
        const csvHeaders = 'Date,Status,Waste Type,Weight (kg),Address,Recycler,Notes\n';
        const csvRows = collections?.map(collection => {
          const date = new Date(collection.created_at).toLocaleDateString();
          const recyclerName = collection.recyclers?.username || 'N/A';
          return `${date},${collection.status},${collection.waste_type},${collection.weight},${collection.address},${recyclerName},${collection.notes || ''}`;
        }).join('\n') || '';

        const csvData = csvHeaders + csvRows;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="waste_history.csv"');
        res.send(csvData);
      } else {
        res.json({
          success: true,
          data: collections,
          message: 'History data exported successfully'
        });
      }
    } catch (error) {
      console.error('Error exporting history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export history'
      });
    }
  }

  /**
   * Get filtered history based on criteria
   */
  static async getFilteredHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      const { 
        status, 
        waste_type, 
        start_date, 
        end_date, 
        min_weight, 
        max_weight,
        page = 1, 
        limit = 10 
      } = req.query;

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

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }

      if (waste_type) {
        query = query.eq('waste_type', waste_type);
      }

      if (start_date) {
        query = query.gte('created_at', start_date);
      }

      if (end_date) {
        query = query.lte('created_at', end_date);
      }

      if (min_weight) {
        query = query.gte('weight', parseFloat(min_weight as string));
      }

      if (max_weight) {
        query = query.lte('weight', parseFloat(max_weight as string));
      }

      // Pagination
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      query = query.range(offset, offset + parseInt(limit as string) - 1);
      query = query.order('created_at', { ascending: false });

      const { data: collections, error } = await query;

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch filtered history'
        });
        return;
      }

      res.json({
        success: true,
        data: collections,
        message: 'Filtered history retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting filtered history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve filtered history'
      });
    }
  }
} 