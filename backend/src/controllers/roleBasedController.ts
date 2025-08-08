import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

// Register user with role
export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, username, phone, role = 'customer' } = req.body;

    // Validate role
    if (!['customer', 'recycler'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be either "customer" or "recycler"'
      });
    }

    // Check if user already exists
    const existingUser = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email)
      .single();

    if (existingUser.data) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          phone,
          role,
        }
      }
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return res.status(400).json({
        success: false,
        message: authError.message
      });
    }

    if (!authData.user) {
      return res.status(400).json({
        success: false,
        message: 'Failed to create user'
      });
    }

    // Create user profile in database
    const userProfile = {
      id: authData.user.id,
      email,
      username,
      phone,
      role,
      email_verified: authData.user.email_confirmed_at ? true : false,
      onboarding_completed: false,
      privacy_policy_accepted: false,
      verification_status: role === 'recycler' ? 'unverified' : undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert([userProfile])
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return res.status(500).json({
        success: false,
        message: 'Failed to create user profile'
      });
    }

    // Auto-verify email for development
    if (process.env.NODE_ENV === 'development') {
      await supabase.auth.admin.updateUserById(authData.user.id, {
        email_confirm: true
      });
    }

    // Auto-sign in after registration
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInError) {
      console.error('Auto sign-in error:', signInError);
    }

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          ...profileData,
          session: signInData?.session
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Complete recycler registration
export const completeRecyclerRegistration = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const {
      company_name,
      business_location,
      areas_of_operation,
      available_resources,
      passport_photo_url,
      business_document_url
    } = req.body;

    // Validate required fields
    if (!company_name || !business_location || !areas_of_operation || !available_resources) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Update user profile with recycler details
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        company_name,
        business_location,
        areas_of_operation,
        available_resources,
        passport_photo_url,
        business_document_url,
        verification_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update registration'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Registration submitted for review',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Recycler registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get verified recyclers
export const getVerifiedRecyclers = async (req: Request, res: Response) => {
  try {
    const { data: recyclers, error } = await supabase
      .from('verified_recyclers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recyclers:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch recyclers'
      });
    }

    return res.status(200).json({
      success: true,
      data: recyclers
    });

  } catch (error) {
    console.error('Get recyclers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user profile with role-based data
export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user profile'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 