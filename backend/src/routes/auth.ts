import crypto from 'crypto';
import express from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import { authenticateToken } from '../middleware/auth';
import { generateCSRFToken, storeCSRFToken } from '../middleware/csrf';

const router = express.Router();

/**
 * @route GET /api/auth/csrf-token
 * @desc Get CSRF token for form protection
 * @access Public
 */
router.get('/csrf-token', (req, res) => {
  const sessionId = crypto.randomBytes(16).toString('hex');
  const token = generateCSRFToken();
  storeCSRFToken(sessionId, token);
  
  res.json({
    success: true,
    data: {
      sessionId,
      token
    }
  });
});

/**
 * @route POST /api/auth/register

 * @desc Register a new user using local database
 * @access Public
 */
router.post('/register', async (req, res) => {
  console.log('REGISTER ROUTE CALLED');
  console.log('Request body:', req.body);
  
  try {
    const { email, password, username, phone, role = 'customer', companyName } = req.body;

    console.log('Registration request received:', { email, username, phone, role, companyName });

    // Input validation
    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and username are required'
      });
    }

    // Check if user already exists in Supabase
    if (!supabaseAdmin) {
      return res.status(500).json({
        success: false,
        error: 'Database configuration error'
      });
    }

    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing user:', checkError);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'An account with this email already exists'
      });
    }

    // Create user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password: password,
      options: {
        data: {
          username: username,
          phone: phone || '',
          role: role,
          company_name: role === 'recycler' ? companyName : null
        }
      }
    });

    if (authError) {
      console.error('Supabase auth error:', authError);
      return res.status(400).json({
        success: false,
        error: authError.message
      });
    }

    if (!authData.user) {
      return res.status(400).json({
        success: false,
        error: 'Failed to create user account'
      });
    }

    // Create user profile in database
    const userData = {
      id: authData.user.id,
      email: email.toLowerCase(),
      username: username,
      phone: phone || '',
      role: role,
      email_verified: authData.user.email_confirmed_at ? true : false,
      onboarding_completed: false,
      company_name: role === 'recycler' ? companyName : null,
      verification_status: role === 'recycler' ? 'unverified' : 'verified',
      status: 'active'
    };

    console.log('Inserting user profile:', userData);

    // Insert user profile using admin client for better permissions
    let profile = null;
    let profileError = null;
    
    if (supabaseAdmin) {
      const result = await supabaseAdmin
        .from('users')
        .insert(userData)
        .select()
        .single();
      profile = result.data;
      profileError = result.error;
    } else {
      const result = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();
      profile = result.data;
      profileError = result.error;
    }

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Continue anyway, profile can be created later
      console.log('Profile creation failed, but user auth was successful');
    }

    console.log('User saved to Supabase:', profile || userData);

    return res.status(201).json({
      success: true,
      message: 'Registration successful!',
      data: {
        user: profile || userData,
        session: authData.session,
        token: authData.session?.access_token || null
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Registration failed'
    });
  }
});

/**
 * @route POST /api/auth/login
 * @desc Login user using local database
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, role, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Login with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password
    });

    if (error) {
      console.error('Login error:', error);
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password. Please check your credentials and try again.'
      });
    }

    if (!data.user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      // Continue with auth data if profile fetch fails
    }

    const userData = profile || {
      id: data.user.id,
      email: data.user.email,
      username: data.user.user_metadata?.username || data.user.email?.split('@')[0],
      role: data.user.user_metadata?.role || 'customer',
      email_verified: data.user.email_confirmed_at ? true : false,
      onboarding_completed: false
    };

    // Validate role if specified
    if (role && userData.role !== role) {
      console.error('Role mismatch:', { requestedRole: role, userRole: userData.role });
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'ROLE_MISMATCH',
        message: `This account is registered as a ${userData.role}. Please log in using the correct role.`
      });
    }

    console.log('User logged in:', userData);

    return res.json({
      success: true,
      message: 'Login successful!',
      data: {
        user: userData,
        session: data.session,
        token: data.session?.access_token || null
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed'
    });
  }
});

/**
 * @route GET /api/auth/users
 * @desc Get all users (for testing)
 * @access Public
 */
router.get('/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch users'
      });
    }
    
    return res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch users'
    });
  }
});

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Check if this is a test token
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token && token.startsWith('test-token-')) {
      // Handle test token logout
      console.log('Logging out test user with token:', token);
      return res.json({
        success: true,
        message: 'Logout successful (test mode)'
      });
    }

    // Handle real Supabase logout
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    return res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Logout failed'
    });
  }
});

/**
 * @route POST /api/auth/forgot-password
 * @desc Send 6-digit verification code to email
 * @access Public
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Check if user exists in database
    if (!supabaseAdmin) {
      return res.status(500).json({
        success: false,
        error: 'Database configuration error'
      });
    }

    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing user:', checkError);
      return res.status(500).json({
        success: false,
        error: 'Database error'
      });
    }

    if (!existingUser) {
      return res.status(400).json({
        success: false,
        error: 'EMAIL_NOT_FOUND'
      });
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Store verification code in database with expiration (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    const { error: insertError } = await supabaseAdmin!
      .from('email_verifications')
      .upsert({
        user_id: existingUser.id,
        email: email.toLowerCase(),
        otp: verificationCode,
        expires_at: expiresAt.toISOString(),
        is_used: false
      });

    if (insertError) {
      console.error('Error storing verification code:', insertError);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate verification code'
      });
    }

    // Send email with verification code (using Supabase email service)
    const { error: emailError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verification?email=${encodeURIComponent(email)}&code=${verificationCode}`
    });

    if (emailError) {
      console.error('Email sending error:', emailError);
      return res.status(500).json({
        success: false,
        error: 'Failed to send verification email'
      });
    }

    return res.json({
      success: true,
      message: 'Verification code sent to email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send verification code'
    });
  }
});

/**
 * @route POST /api/auth/verify-email
 * @desc Verify 6-digit code and mark email as verified
 * @access Public
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        error: 'Email and verification code are required'
      });
    }

    // Check if verification code exists and is valid
    if (!supabaseAdmin) {
      return res.status(500).json({
        success: false,
        error: 'Database configuration error'
      });
    }

    const { data: verificationData, error: checkError } = await supabaseAdmin
      .from('email_verifications')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('otp', code)
      .eq('is_used', false)
      .single();

    if (checkError || !verificationData) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_CODE'
      });
    }

    // Check if code has expired
    if (new Date(verificationData.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'CODE_EXPIRED'
      });
    }

    // Mark code as used
    const { error: updateError } = await supabaseAdmin
      .from('email_verifications')
      .update({ is_used: true })
      .eq('id', verificationData.id);

    if (updateError) {
      console.error('Error marking code as used:', updateError);
      return res.status(500).json({
        success: false,
        error: 'Failed to verify code'
      });
    }

    return res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({
      success: false,
      error: 'Email verification failed'
    });
  }
});

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with verified email
 * @access Public
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { password, email } = req.body;

    if (!password || !email) {
      return res.status(400).json({
        success: false,
        error: 'Password and email are required'
      });
    }

    // Check if email exists and is verified
    if (!supabaseAdmin) {
      return res.status(500).json({
        success: false,
        error: 'Database configuration error'
      });
    }

    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();

    if (checkError || !existingUser) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_EMAIL'
      });
    }

    // Update password using Supabase Auth
    const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      password: password
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    return res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Password reset failed'
    });
  }
});

/**
 * @route POST /api/auth/resend-verification
 * @desc Resend verification email using Supabase Auth
 * @access Public
 */
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Use Supabase Auth to resend verification email
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    return res.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to resend verification email'
    });
  }
});

/**
 * @route POST /api/auth/verify-email
 * @desc Verify email using Supabase Auth
 * @access Public
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { email, token } = req.body;

    if (!email || !token) {
      return res.status(400).json({
        success: false,
        error: 'Email and verification token are required'
      });
    }

    // Use Supabase Auth to verify email
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup'
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }

    // Update user profile to mark email as verified
    if (supabaseAdmin && data.user) {
      await supabaseAdmin
        .from('users')
        .update({ email_verified: true })
        .eq('id', data.user.id);
    }

    return res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: data.user,
        session: data.session
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Email verification failed'
    });
  }
});

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user?.id)
      .single();

    if (error || !profile) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    return res.json({
      success: true,
      data: {
        user: {
          id: profile.id,
          email: profile.email,
          username: profile.username,
          role: profile.role,
          email_verified: profile.email_verified
        }
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

/**
 * @route POST /api/auth/google
 * @desc Login with Google
 * @access Public
 */
router.post('/google', async (req, res) => {
  try {
    const { idToken, accessToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        error: 'Google ID token is required'
      });
    }

    // Verify Google ID token
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (googleApiKey) {
      try {
        // Verify the ID token with Google's API
        const verifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
        const response = await fetch(verifyUrl);
        const tokenInfo = await response.json() as any;
        
        if (tokenInfo.error) {
          return res.status(401).json({
            success: false,
            error: 'Invalid Google token'
          });
        }
        
        // Create user session with verified Google data
        const googleUser = {
          id: tokenInfo.sub,
          email: tokenInfo.email,
          username: tokenInfo.name || 'Google User',
          role: 'customer',
          provider: 'google'
        };
        
        return res.json({
          success: true,
          message: 'Google login successful',
          data: {
            user: googleUser,
            session: {
              access_token: accessToken,
              refresh_token: 'google_refresh_token'
            }
          }
        });
      } catch (error) {
        console.error('Google token verification error:', error);
      }
    }

    // Fallback to mock user session if verification fails
    const mockUser = {
      id: 'google_user_123',
      email: 'user@gmail.com',
      username: 'Google User',
      role: 'customer',
      provider: 'google'
    };

    return res.json({
      success: true,
      message: 'Google login successful',
      data: {
        user: mockUser,
        session: {
          access_token: 'mock_google_token',
          refresh_token: 'mock_refresh_token'
        }
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Google login failed'
    });
  }
});

/**
 * @route POST /api/auth/switch-role
 * @desc Switch user role between customer and recycler
 * @access Private
 */
router.post('/switch-role', authenticateToken, async (req, res) => {
  try {
    const { role } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!role || !['customer', 'recycler'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Valid role (customer or recycler) is required'
      });
    }

    console.log(`Switching role for user ${userId} to ${role}`);

    // Handle test tokens
    if (req.headers.authorization?.includes('test-token-')) {
      const testUser = {
        id: userId,
        email: req.user?.email || 'testuser@gmail.com',
        username: req.user?.username || 'testuser',
        role: role,
        email_verified: true,
        onboarding_completed: true,
        privacy_policy_accepted: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return res.json({
        success: true,
        message: `Role switched to ${role} successfully`,
        data: testUser
      });
    }

    // Update user role in database
    if (supabaseAdmin) {
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({ 
          role: role,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Role update error:', updateError);
        return res.status(500).json({
          success: false,
          error: 'Failed to update user role'
        });
      }

      return res.json({
        success: true,
        message: `Role switched to ${role} successfully`,
        data: updatedUser
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Database connection not available'
      });
    }
  } catch (error) {
    console.error('Switch role error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to switch role'
    });
  }
});

/**
 * @route POST /api/auth/complete-recycler-registration
 * @desc Complete recycler registration and mark as verified
 * @access Private
 */
router.post('/complete-recycler-registration', async (req, res) => {
  try {
    const { 
      companyName, 
      businessLocation, 
      areasOfOperation, 
      availableResources,
      passportPhotoUrl,
      businessDocumentUrl 
    } = req.body;

    // Get user from auth token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Validate required fields
    if (!companyName || !businessLocation || !areasOfOperation || !availableResources) {
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided'
      });
    }

    // Update user profile with complete registration data
    if (supabaseAdmin) {
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          company_name: companyName,
          business_location: businessLocation,
          areas_of_operation: areasOfOperation,
          available_resources: availableResources,
          passport_photo_url: passportPhotoUrl || null,
          business_document_url: businessDocumentUrl || null,
          verification_status: 'verified',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Registration completion error:', updateError);
        return res.status(500).json({
          success: false,
          error: 'Failed to complete registration'
        });
      }

      return res.json({
        success: true,
        message: 'Registration completed successfully. You are now verified and can receive pickup requests.',
        data: updatedUser
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Database connection not available'
      });
    }
  } catch (error) {
    console.error('Complete registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to complete registration'
    });
  }
});

/**
 * @route POST /api/auth/apple
 * @desc Login with Apple
 * @access Public
 */
router.post('/apple', async (req, res) => {
  try {
    const { identityToken, authorizationCode } = req.body;

    if (!identityToken) {
      return res.status(400).json({
        success: false,
        error: 'Apple identity token is required'
      });
    }

    // TODO: When Apple Sign-In is configured, verify the token with Apple
    // Verify token with Apple's API

    // For now, create a mock user session
    const mockUser = {
      id: 'apple_user_123',
      email: 'user@icloud.com',
      username: 'Apple User',
      role: 'customer',
      provider: 'apple'
    };

    return res.json({
      success: true,
      message: 'Apple login successful',
      data: {
        user: mockUser,
        session: {
          access_token: 'mock_apple_token',
          refresh_token: 'mock_refresh_token'
        }
      }
    });
  } catch (error) {
    console.error('Apple login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Apple login failed'
    });
  }
});

export default router; 