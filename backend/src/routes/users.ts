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
    
    // Try to find user in customers table first
    let { data: user, error } = await supabase
      .from('customers')
      .select('id, username, email, phone, email_verified, created_at')
      .eq('id', userId)
      .single();

    let userRole = 'customer';

    // If not found in customers, check recyclers table
    if (error || !user) {
      const { data: recycler, error: recyclerError } = await supabase
        .from('recyclers')
        .select('id, username, email, phone, email_verified, created_at')
        .eq('id', userId)
        .single();

      if (recyclerError || !recycler) {
        return res.status(404).json({ 
          success: false, 
          error: 'User profile not found' 
        });
      }

      user = recycler;
      userRole = 'recycler';
    }

    // Format response to match EditProfileScreen expectations
    const profileData = {
      name: user.username,
      email: user.email,
      phone: user.phone || '',
      role: userRole,
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
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: req.user?.email || '',
        password: currentPassword
      });

      if (signInError) {
        return res.status(400).json({
          success: false,
          error: 'Current password is incorrect'
        });
      }

      // Update password in Supabase Auth
      const { error: updatePasswordError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updatePasswordError) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update password'
        });
      }
    }

    // Determine which table to update based on user role
    let updateResult = null;
    let userRole = 'customer';

    // Try to update in customers table first
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .update({
        username: name,
        email: email,
        phone: phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (customer) {
      updateResult = customer;
    } else {
      // If not in customers table, try recyclers table
      const { data: recycler, error: recyclerError } = await supabase
        .from('recyclers')
        .update({
          username: name,
          email: email,
          phone: phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (recycler) {
        updateResult = recycler;
        userRole = 'recycler';
      } else {
        return res.status(404).json({
          success: false,
          error: 'User profile not found'
        });
      }
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: updateResult.id,
          name: updateResult.username,
          email: updateResult.email,
          phone: updateResult.phone,
          role: userRole
        }
      },
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update user profile'
    });
  }
});

/**
 * @route DELETE /api/users/profile
 * @desc Delete current user profile
 * @access Private
 */
router.delete('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Try to delete from customers table first
    let { error: deleteError } = await supabase
      .from('customers')
      .delete()
      .eq('id', userId);

    let userRole = 'customer';

    // If not found in customers, try recyclers table
    if (deleteError) {
      const { error: recyclerDeleteError } = await supabase
        .from('recyclers')
        .delete()
        .eq('id', userId);

      if (recyclerDeleteError) {
        return res.status(404).json({
          success: false,
          error: 'User profile not found'
        });
      }
      userRole = 'recycler';
    }

    // Delete user from Supabase Auth
    if (supabaseAdmin) {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authDeleteError) {
        console.error('Error deleting user from auth:', authDeleteError);
      }
    }

    return res.json({
      success: true,
      message: 'User profile deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete user profile'
    });
  }
});

/**
 * @route GET /api/users/search
 * @desc Search users by name or email
 * @access Private
 */
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query, role } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      });
    }

    let results = [];

    // Search in appropriate table based on role
    if (role === 'customer' || !role) {
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('id, username, email, phone, created_at')
        .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (!customerError && customers) {
        results.push(...customers.map(c => ({ ...c, role: 'customer' })));
      }
    }

    if (role === 'recycler' || !role) {
      const { data: recyclers, error: recyclerError } = await supabase
        .from('recyclers')
        .select('id, username, email, phone, created_at')
        .or(`username.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (!recyclerError && recyclers) {
        results.push(...recyclers.map(r => ({ ...r, role: 'recycler' })));
      }
    }

    return res.json({
      success: true,
      data: results,
      message: 'Search completed successfully'
    });
  } catch (error) {
    console.error('Error searching users:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to search users'
    });
  }
});

/**
 * @route GET /api/users/:id
 * @desc Get user by ID
 * @access Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;

    // Try to find user in customers table first
    let { data: user, error } = await supabase
      .from('customers')
      .select('id, username, email, phone, email_verified, created_at')
      .eq('id', userId)
      .single();

    let userRole = 'customer';

    // If not found in customers, check recyclers table
    if (error || !user) {
      const { data: recycler, error: recyclerError } = await supabase
        .from('recyclers')
        .select('id, username, email, phone, email_verified, created_at')
        .eq('id', userId)
        .single();

      if (recyclerError || !recycler) {
        return res.status(404).json({ 
          success: false, 
          error: 'User not found' 
        });
      }

      user = recycler;
      userRole = 'recycler';
    }

    return res.json({
      success: true,
      data: {
        ...user,
        role: userRole
      },
      message: 'User retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting user:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve user'
    });
  }
});

export default router; 