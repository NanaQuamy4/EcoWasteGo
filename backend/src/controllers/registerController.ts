import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendVerificationEmail } from '../services/emailService';
import SMSService from '../services/smsService';

export class RegisterController {
  /**
   * Register a new user
   */
  static async registerUser(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, username, phone, role = 'customer', companyName } = req.body;

      if (!email || !username) {
        res.status(400).json({
          success: false,
          error: 'Email and username are required'
        });
        return;
      }

      // Check if email already exists in either customers or recyclers table
      let existingUser = null;
      
      if (role === 'customer') {
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', email)
          .single();
        
        if (existingCustomer) {
          existingUser = existingCustomer;
        }
      } else if (role === 'recycler') {
        const { data: existingRecycler } = await supabase
          .from('recyclers')
          .select('id')
          .eq('email', email)
          .single();
        
        if (existingRecycler) {
          existingUser = existingRecycler;
        }
      }

      if (existingUser) {
        res.status(400).json({
          success: false,
          error: 'Email already registered'
        });
        return;
      }

      // Create user profile directly in database (bypass Supabase Auth entirely)
      let user = null;
      let profileError = null;

      if (role === 'customer') {
        const { data: customer, error: error } = await supabase
          .from('customers')
          .insert({
            email,
            username,
            phone,
            company_name: companyName,
            privacy_policy_accepted: true,
            privacy_policy_version: '1.0',
            privacy_policy_accepted_at: new Date().toISOString(),
            email_verified: true, // Auto-verify the user
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        user = customer;
        profileError = error;
      } else if (role === 'recycler') {
        const { data: recycler, error: error } = await supabase
          .from('recyclers')
          .insert({
            email,
            username,
            phone,
            company_name: companyName,
            privacy_policy_accepted: true,
            privacy_policy_version: '1.0',
            privacy_policy_accepted_at: new Date().toISOString(),
            email_verified: true, // Auto-verify the user
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        user = recycler;
        profileError = error;
      }

      if (profileError || !user) {
        console.error('Profile creation error:', profileError);
        res.status(500).json({
          success: false,
          error: 'Failed to create user profile'
        });
        return;
      }

      // Successfully created and auto-verified user
      res.json({
        success: true,
        message: 'User registered and verified successfully!',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: role,
            emailVerified: true,
            message: 'No email confirmation needed - you can login immediately!'
          }
        }
      });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to register user'
      });
    }
  }

  /**
   * Verify email with OTP
   */
  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        res.status(400).json({
          success: false,
          error: 'Email and OTP are required'
        });
        return;
      }

      // Get verification record
      const { data: verification, error: verificationError } = await supabase
        .from('email_verifications')
        .select('*')
        .eq('email', email)
        .eq('otp', otp)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (verificationError || !verification) {
        res.status(400).json({
          success: false,
          error: 'Invalid or expired OTP'
        });
        return;
      }

      // Update user as verified in appropriate table
      let user = null;
      let updateError = null;

      if (verification.user_type === 'customer') {
        const { data: customer, error: error } = await supabase
          .from('customers')
          .update({
            email_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', verification.user_id)
          .select()
          .single();
        
        user = customer;
        updateError = error;
      } else if (verification.user_type === 'recycler') {
        const { data: recycler, error: error } = await supabase
          .from('recyclers')
          .update({
            email_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', verification.user_id)
          .select()
          .single();
        
        user = recycler;
        updateError = error;
      }

      if (updateError || !user) {
        res.status(500).json({
          success: false,
          error: 'Failed to verify email'
        });
        return;
      }

      // Delete verification record
      await supabase
        .from('email_verifications')
        .delete()
        .eq('id', verification.id);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            email_verified: user.email_verified
          }
        },
        message: 'Email verified successfully'
      });
    } catch (error) {
      console.error('Error verifying email:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify email'
      });
    }
  }

  /**
   * Resend OTP to email
   */
  static async resendOTP(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required'
        });
        return;
      }

      // Check if user exists in either customers or recyclers table
      let user = null;
      
      // Check customers table first
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id, email_verified')
        .eq('email', email)
        .single();
      
      if (customer) {
        user = customer;
      } else {
        // Check recyclers table
        const { data: recycler, error: recyclerError } = await supabase
          .from('recyclers')
          .select('id, email_verified')
          .eq('email', email)
          .single();
        
        if (recycler) {
          user = recycler;
        }
      }

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found'
        });
        return;
      }

      if (user.email_verified) {
        res.status(400).json({
          success: false,
          error: 'Email is already verified'
        });
        return;
      }

      // Generate new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Determine user type for verification record
      let userType = 'customer';
      if (await supabase.from('recyclers').select('id').eq('id', user.id).single().then(r => r.data)) {
        userType = 'recycler';
      }

      // Update or create verification record
      await supabase
        .from('email_verifications')
        .upsert({
          user_id: user.id,
          user_type: userType,
          email,
          otp,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
        });

      // Send email
      await sendVerificationEmail(email, otp);

      res.json({
        success: true,
        message: 'OTP sent successfully'
      });
    } catch (error) {
      console.error('Error resending OTP:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resend OTP'
      });
    }
  }

  /**
   * Register user with SMS verification
   */
  static async registerWithSMSVerification(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, username, phone, role = 'customer', companyName, smsVerified } = req.body;

      if (!email || !username || !phone) {
        res.status(400).json({
          success: false,
          error: 'Email, username, and phone number are required'
        });
        return;
      }

      // Verify that SMS verification was completed
      if (!smsVerified) {
        res.status(400).json({
          success: false,
          error: 'SMS_VERIFICATION_REQUIRED',
          message: 'Please verify your phone number first'
        });
        return;
      }

      // Verify SMS verification status in database
      const formattedPhone = SMSService['formatPhoneNumber'](phone);
      let isVerified = false;

      // Check in verification_attempts table for successful SMS verification
      console.log('🔍 Checking phone verification for:', formattedPhone);
      
      const { data: verificationData, error: verificationError } = await supabase
        .from('verification_attempts')
        .select('*')
        .eq('contact_info', formattedPhone)
        .eq('verification_type', 'sms')
        .eq('is_successful', true)
        .order('verified_at', { ascending: false })
        .limit(1);

      console.log('📊 Verification data found:', verificationData);
      console.log('❌ Verification error:', verificationError);
      
      if (verificationData && verificationData.length > 0) {
        const verification = verificationData[0];
        const verifiedTime = new Date(verification.verified_at);
        const currentTime = new Date();
        const timeDiff = currentTime.getTime() - verifiedTime.getTime();
        const minutesDiff = Math.floor(timeDiff / (1000 * 60));
        
        console.log('⏰ Verification time:', verifiedTime);
        console.log('⏰ Current time:', currentTime);
        console.log('⏰ Time difference (minutes):', minutesDiff);
        
        if (minutesDiff <= 30) {
          isVerified = true;
          console.log('✅ Phone verification is valid (within 30 minutes)');
        } else {
          console.log('❌ Phone verification expired (older than 30 minutes)');
        }
      } else {
        // Fallback check in email_verifications table
        console.log('🔄 Checking legacy email_verifications table...');
        const { data: legacyVerificationData, error: legacyError } = await supabase
          .from('email_verifications')
          .select('*')
          .eq('phone_number', formattedPhone)
          .eq('verification_type', 'sms')
          .eq('is_used', true)
          .single();

        console.log('📊 Legacy verification data:', legacyVerificationData);
        console.log('❌ Legacy verification error:', legacyError);

        if (legacyVerificationData) {
          isVerified = true;
          console.log('✅ Legacy phone verification found');
        }
      }

      console.log('🔍 Final verification status:', isVerified);
      
      if (!isVerified) {
        console.log('❌ Phone verification failed - sending error response');
        res.status(400).json({
          success: false,
          error: 'PHONE_NOT_VERIFIED',
          message: 'Phone number verification not found or expired. Please verify your phone number again.'
        });
        return;
      }
      
      console.log('✅ Phone verification successful - proceeding with registration');

      // Check if email already exists in either customers or recyclers table
      let existingUser = null;
      
      if (role === 'customer') {
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', email)
          .single();
        
        if (existingCustomer) {
          existingUser = existingCustomer;
        }
      } else if (role === 'recycler') {
        const { data: existingRecycler } = await supabase
          .from('recyclers')
          .select('id')
          .eq('email', email)
          .single();
        
        if (existingRecycler) {
          existingUser = existingRecycler;
        }
      }

      if (existingUser) {
        res.status(400).json({
          success: false,
          error: 'Email already registered'
        });
        return;
      }

      // Create user profile directly in database with verified phone
      let user = null;
      let profileError = null;

      const userData = {
        email,
        username,
        phone: formattedPhone,
        company_name: companyName,
        privacy_policy_accepted: true,
        privacy_policy_version: '1.0',
        privacy_policy_accepted_at: new Date().toISOString(),
        email_verified: false, // Email still needs verification
        phone_verified: true, // Phone is verified via SMS
        phone_verified_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };

      if (role === 'customer') {
        const { data: customer, error: error } = await supabase
          .from('customers')
          .insert(userData)
          .select()
          .single();
        
        user = customer;
        profileError = error;
      } else if (role === 'recycler') {
        const { data: recycler, error: error } = await supabase
          .from('recyclers')
          .insert(userData)
          .select()
          .single();
        
        user = recycler;
        profileError = error;
      }

      if (profileError || !user) {
        console.error('Profile creation error:', profileError);
        res.status(500).json({
          success: false,
          error: 'Failed to create user profile'
        });
        return;
      }

      // Send welcome SMS
      await SMSService.sendSMS({
        recipient: formattedPhone,
        message: `Welcome to EcoWasteGo! Your account has been created successfully. You can now start ${role === 'recycler' ? 'receiving pickup requests' : 'scheduling waste pickups'}.`
      });

      // Successfully created user with verified phone
      res.json({
        success: true,
        message: 'User registered successfully with verified phone number!',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            phone: user.phone,
            role: role,
            emailVerified: false,
            phoneVerified: true,
            message: 'Account created! You can login immediately. Email verification is optional.'
          }
        }
      });
    } catch (error) {
      console.error('Error registering user with SMS:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to register user'
      });
    }
  }

  /**
   * Check if email is available
   */
  static async checkEmailAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.query;

      if (!email) {
        res.status(400).json({
          success: false,
          error: 'Email is required'
        });
        return;
      }

      // Check if email exists in either customers or recyclers table
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', email)
        .single();

      const { data: existingRecycler } = await supabase
        .from('recyclers')
        .select('id')
        .eq('email', email)
        .single();

      const isAvailable = !existingCustomer && !existingRecycler;

      res.json({
        success: true,
        data: {
          email: email as string,
          available: isAvailable
        },
        message: isAvailable ? 'Email is available' : 'Email is already registered'
      });
    } catch (error) {
      console.error('Error checking email availability:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to check email availability'
      });
    }
  }

  /**
   * Simple login (bypasses Supabase Auth)
   */
  static async simpleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
        return;
      }

      // Check if user exists in either customers or recyclers table
      let user = null;
      let userRole = null;
      
      // Check customers table first
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .single();
      
      if (customer) {
        user = customer;
        userRole = 'customer';
      } else {
        // Check recyclers table
        const { data: recycler } = await supabase
          .from('recyclers')
          .select('*')
          .eq('email', email)
          .single();
        
        if (recycler) {
          user = recycler;
          userRole = 'recycler';
        }
      }

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password'
        });
        return;
      }

      // For now, we'll accept any password (you can add password hashing later)
      // In production, you should implement proper password verification
      
      // Generate a simple session token (you can use JWT later)
      const sessionToken = `session_${user.id}_${Date.now()}`;
      
      res.json({
        success: true,
        message: 'Login successful!',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: userRole,
            emailVerified: user.email_verified,
            sessionToken: sessionToken
          }
        }
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to login'
      });
    }
  }
} 