import { Request, Response } from 'express';
import databaseService from '../services/databaseService';

export class OptimizedUsersController {
  /**
   * Get current user profile with caching
   */
  static async getUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const user = await databaseService.getUserProfile(userId);

      if (!user) {
        res.status(404).json({ 
          success: false, 
          error: 'User profile not found' 
        });
        return;
      }

      res.json({
        success: true,
        data: user,
        message: 'User profile retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting user profile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user profile'
      });
    }
  }

  /**
   * Update current user profile with cache invalidation
   */
  static async updateUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { username, phone, address, city, state, profile_image } = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const updateData: any = {};
      if (username) updateData.username = username;
      if (phone) updateData.phone = phone;
      if (address) updateData.address = address;
      if (city) updateData.city = city;
      if (state) updateData.state = state;
      if (profile_image) updateData.profile_image = profile_image;

      // Use optimized database service
      const user = await databaseService.supabaseQuery(
        (supabase) => supabase
          .from('users')
          .update(updateData)
          .eq('id', userId)
          .select()
          .single(),
        `user_profile_${userId}`,
        0 // No cache for updates
      );

      // Invalidate user cache
      databaseService.invalidateCache(`user_profile_${userId}`);

      res.json({
        success: true,
        data: user,
        message: 'Profile updated successfully'
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  }

  /**
   * Get all recyclers with optimized pagination and caching
   */
  static async getRecyclers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      let recyclers;
      
      if (search) {
        // Search with cache
        const cacheKey = `recyclers_search_${search}_${page}_${limit}`;
        recyclers = await databaseService.supabaseQuery(
          (supabase) => supabase
            .from('users')
            .select(`
              id,
              username,
              phone,
              address,
              city,
              state,
              profile_image,
              created_at,
              recycler_profiles!inner(*)
            `)
            .eq('role', 'recycler')
            .eq('email_verified', true)
            .eq('recycler_profiles.is_available', true) // Only show available recyclers
            .ilike('username', `%${search}%`)
            .range((page - 1) * limit, page * limit - 1)
            .order('created_at', { ascending: false }),
          cacheKey,
          180 // 3 minutes cache for search results
        );
      } else {
        // Use optimized recycler query
        recyclers = await databaseService.getRecyclers(page, limit);
      }

      res.json({
        success: true,
        data: recyclers,
        message: 'Recyclers retrieved successfully',
        pagination: {
          page,
          limit,
          hasMore: recyclers.length === limit
        }
      });
    } catch (error) {
      console.error('Error getting recyclers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch recyclers'
      });
    }
  }

  /**
   * Get specific recycler details with caching
   */
  static async getRecyclerDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const cacheKey = `recycler_details_${id}`;

      const recycler = await databaseService.supabaseQuery(
        (supabase) => supabase
          .from('users')
          .select(`
            id,
            username,
            phone,
            address,
            city,
            state,
            profile_image,
            created_at,
            recycler_profiles!inner(*)
          `)
          .eq('id', id)
          .eq('role', 'recycler')
          .eq('email_verified', true)
          .eq('recycler_profiles.is_available', true) // Only show available recyclers
          .single(),
        cacheKey,
        600 // 10 minutes cache for recycler details
      );

      if (!recycler) {
        res.status(404).json({
          success: false,
          error: 'Recycler not found'
        });
        return;
      }

      res.json({
        success: true,
        data: recycler,
        message: 'Recycler details retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting recycler details:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve recycler details'
      });
    }
  }

  /**
   * Get user statistics with optimized analytics
   */
  static async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
        return;
      }

      const analytics = await databaseService.getAnalytics(userId, userRole);

      // Calculate statistics
      const totalCollections = analytics.collections.length;
      const completedCollections = analytics.collections.filter((c: any) => c.status === 'completed').length;
      const totalEarnings = analytics.earnings
        .filter((e: any) => e.status === 'completed')
        .reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);
      
      const wasteImpact = analytics.impact.reduce((acc: any, item: any) => {
        const type = item.waste_type;
        const weight = parseFloat(item.weight) || 0;
        acc[type] = (acc[type] || 0) + weight;
        return acc;
      }, {});

      res.json({
        success: true,
        data: {
          totalCollections,
          completedCollections,
          totalEarnings,
          wasteImpact,
          completionRate: totalCollections > 0 ? (completedCollections / totalCollections) * 100 : 0
        },
        message: 'User statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting user stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user statistics'
      });
    }
  }

  /**
   * Get database performance statistics
   */
  static async getPerformanceStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = databaseService.getPerformanceStats();
      
      res.json({
        success: true,
        data: stats,
        message: 'Performance statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting performance stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve performance statistics'
      });
    }
  }

  /**
   * Clear cache for specific patterns
   */
  static async clearCache(req: Request, res: Response): Promise<void> {
    try {
      const { pattern } = req.body;
      
      if (pattern) {
        databaseService.invalidateCache(pattern);
      } else {
        databaseService.invalidateCache();
      }

      res.json({
        success: true,
        message: pattern ? `Cache cleared for pattern: ${pattern}` : 'All cache cleared'
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear cache'
      });
    }
  }

  /**
   * Delete current user account with cache cleanup
   */
  static async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(400).json({
          success: false,
          error: 'User ID not found'
        });
        return;
      }

      // Clear all user-related cache
      databaseService.invalidateCache(`user_profile_${userId}`);
      databaseService.invalidateCache(`collections_${userId}`);
      databaseService.invalidateCache(`analytics_${userId}`);

      // Delete user from Supabase Auth
      try {
        await databaseService.supabaseQuery(
          (supabase) => supabase.auth.admin.deleteUser(userId),
          undefined,
          0
        );
      } catch (authError) {
        res.status(400).json({
          success: false,
          error: 'Failed to delete account'
        });
        return;
      }

      res.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting account:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete account'
      });
    }
  }
} 