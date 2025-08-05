import express from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

/**
 * @route GET /api/users/profile
 * @desc Get current user profile
 * @access Private
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, email, phone, role, email_verified, created_at')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User profile not found' 
      });
    }

    // Format response to match EditProfileScreen expectations
    const profileData = {
      name: user.username,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      emailVerified: user.email_verified,
      createdAt: user.created_at
    };

    return res.json({
      success: true,
      data: profileData,
      message: 'User profile retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve user profile'
    });
  }
});

/**
 * @route PUT /api/users/profile
 * @desc Update current user profile
 * @access Private
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { 
      name, 
      email, 
      phone, 
      currentPassword, 
      newPassword, 
      confirmNewPassword 
    } = req.body;

    // Validate password change if provided
    if (newPassword || confirmNewPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password is required to change password'
        });
      }

      if (!newPassword) {
        return res.status(400).json({
          success: false,
          error: 'New password is required'
        });
      }

      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({
          success: false,
          error: 'New passwords do not match'
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'New password must be at least 6 characters long'
        });
      }

      // Verify current password with Supabase Auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication failed'
        });
      }

      // Update password in Supabase Auth
      const { error: passwordError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (passwordError) {
        return res.status(400).json({
          success: false,
          error: passwordError.message
        });
      }
    }

    // Update profile data in database
    const updateData: any = {};
    if (name) updateData.username = name; // Map name to username field
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;

    // Only update database if there are profile changes
    if (Object.keys(updateData).length > 0) {
      const { data: user, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return res.status(400).json({
          success: false,
          error: 'Failed to update profile'
        });
      }

      return res.json({
        success: true,
        data: user,
        message: 'Profile updated successfully'
      });
    } else {
      // If only password was changed, return success
      return res.json({
        success: true,
        message: 'Password updated successfully'
      });
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

/**
 * @route GET /api/users/recyclers
 * @desc Get all recyclers (for customers to browse)
 * @access Public
 */
router.get('/recyclers', async (req, res) => {
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
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch recyclers'
      });
    }

    return res.json({
      success: true,
      data: recyclers,
      message: 'Recyclers retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting recyclers:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve recyclers'
    });
  }
});

/**
 * @route GET /api/users/recyclers/:id
 * @desc Get specific recycler details
 * @access Public
 */
router.get('/recyclers/:id', async (req, res) => {
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
      return res.status(404).json({
        success: false,
        error: 'Recycler not found'
      });
    }

    return res.json({
      success: true,
      data: recycler,
      message: 'Recycler details retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting recycler details:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve recycler details'
    });
  }
});

/**
 * @route DELETE /api/users/account
 * @desc Delete user account
 * @access Private
 */
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Delete user from Supabase Auth using admin client
    if (supabaseAdmin) {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) {
        return res.status(400).json({
          success: false,
          error: authError.message
        });
      }
    }

    // Delete user profile from database
    const { error: profileError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (profileError) {
      return res.status(400).json({
        success: false,
        error: 'Failed to delete user profile'
      });
    }

    return res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
});

export default router; 