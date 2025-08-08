import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { sendVerificationEmail } from '../services/emailService';

export class RegisterController {
  /**
   * Register a new user
   */
  static async registerUser(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, username, phone, role = 'customer' } = req.body;

      if (!email || !password || !username) {
        res.status(400).json({
          success: false,
          error: 'Email, password, and username are required'
        });
        return;
      }

      // Check if email already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        res.status(400).json({
          success: false,
          error: 'Email already registered'
        });
        return;
      }

      // Create user in Supabase Auth
      const { data: authUser, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            role
          }
        }
      });

      if (authError) {
        res.status(500).json({
          success: false,
          error: 'Failed to create user account'
        });
        return;
      }

      // Create user profile in database with privacy policy acceptance
      const { data: user, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authUser.user?.id,
          email,
          username,
          phone,
          role,
          privacy_policy_accepted: true,
          privacy_policy_version: '1.0',
          privacy_policy_accepted_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (profileError) {
        res.status(500).json({
          success: false,
          error: 'Failed to create user profile'
        });
        return;
      }

      // Send verification email
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP in database (you might want to create a separate table for this)
      await supabase
        .from('email_verifications')
        .insert({
          user_id: user.id,
          email,
          otp,
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
        });

      // Send email
      await sendVerificationEmail(email, otp);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role
          }
        },
        message: 'Registration successful. Please check your email for verification.'
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

      // Update user as verified
      const { data: user, error: updateError } = await supabase
        .from('users')
        .update({
          email_verified: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', verification.user_id)
        .select()
        .single();

      if (updateError) {
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

      // Check if user exists
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email_verified')
        .eq('email', email)
        .single();

      if (userError || !user) {
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

      // Update or create verification record
      await supabase
        .from('email_verifications')
        .upsert({
          user_id: user.id,
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

      // Check if email exists
      const { data: existingUser, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      const isAvailable = !existingUser;

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
} 