import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class UsersController {
  /**
   * Get current user profile
   */
  static async getUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
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
   * Update current user profile
   */
  static async updateUserProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { username, phone, address, city, state, profile_image } = req.body;

      const updateData: any = {};
      if (username) updateData.username = username;
      if (phone) updateData.phone = phone;
      if (address) updateData.address = address;
      if (city) updateData.city = city;
      if (state) updateData.state = state;
      if (profile_image) updateData.profile_image = profile_image;

      const { data: user, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        res.status(400).json({
          success: false,
          error: 'Failed to update profile'
        });
        return;
      }

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
   * Get all recyclers (for customers to browse)
   */
  static async getRecyclers(req: Request, res: Response): Promise<void> {
    try {
      const { data: recyclers, error } = await supabase
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
        .eq('email_verified', true);

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch recyclers'
        });
        return;
      }

      res.json({
        success: true,
        data: recyclers,
        message: 'Recyclers retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting recyclers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve recyclers'
      });
    }
  }

  /**
   * Get specific recycler details
   */
  static async getRecyclerDetails(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const { data: recycler, error } = await supabase
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
        .single();

      if (error || !recycler) {
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
   * Delete current user account
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

      // Delete user from Supabase Auth
      const { error: authError } = await supabase.auth.admin.deleteUser(userId);

      if (authError) {
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