import { Request, Response } from 'express';
import { supabase, supabaseAdmin } from '../config/supabase';
import SMSService from '../services/smsService';

export class SMSVerificationController {
  /**
   * Send SMS verification code during registration
   */
  static async sendVerificationCode(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber, userType = 'customer' } = req.body;

      if (!phoneNumber) {
        res.status(400).json({
          success: false,
          error: 'Phone number is required'
        });
        return;
      }

      // Format phone number
      const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);

      console.log('SMS Verification Controller - Phone number formatting:', {
        original: phoneNumber,
        formatted: formattedPhone,
        userType: userType
      });

      // Check rate limiting
      if (supabaseAdmin) {
        const { data: rateLimitCheck } = await supabaseAdmin
          .rpc('check_verification_rate_limit', {
            contact_info_param: formattedPhone,
            verification_type_param: 'sms'
          });

        if (!rateLimitCheck) {
          res.status(429).json({
            success: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many verification attempts. Please try again in 1 hour.'
          });
          return;
        }
      }

      // Generate verification code
      const verificationCode = SMSService.generateVerificationCode();

      // Store verification code in database
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      if (supabaseAdmin) {
        // Store in new verification_attempts table
        const { error: storeError } = await supabaseAdmin
          .from('verification_attempts')
          .insert({
            user_type: userType,
            verification_type: 'sms',
            contact_info: formattedPhone,
            verification_code: verificationCode,
            expires_at: expiresAt.toISOString(),
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.get('User-Agent')
          });

        if (storeError) {
          console.error('Error storing SMS verification code:', storeError);
          res.status(500).json({
            success: false,
            error: 'Failed to generate verification code'
          });
          return;
        }
      } else {
        // Fallback to email_verifications table
        const { error: storeError } = await supabase
          .from('email_verifications')
          .insert({
            user_type: userType,
            phone_number: formattedPhone,
            otp: verificationCode,
            verification_type: 'sms',
            expires_at: expiresAt.toISOString()
          });

        if (storeError) {
          console.error('Error storing SMS verification code:', storeError);
          res.status(500).json({
            success: false,
            error: 'Failed to generate verification code'
          });
          return;
        }
      }

      // Send SMS
      const smsSent = await SMSService.sendVerificationCode(formattedPhone, verificationCode);

      if (!smsSent) {
        res.status(500).json({
          success: false,
          error: 'Failed to send SMS verification code'
        });
        return;
      }

      res.json({
        success: true,
        message: 'SMS verification code sent successfully',
        data: {
          phoneNumber: formattedPhone,
          expiresIn: 10 * 60 // 10 minutes in seconds
        }
      });
    } catch (error) {
      console.error('Error sending SMS verification:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send SMS verification code'
      });
    }
  }

  /**
   * Verify SMS code
   */
  static async verifyCode(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber, code, userType = 'customer' } = req.body;

      if (!phoneNumber || !code) {
        res.status(400).json({
          success: false,
          error: 'Phone number and verification code are required'
        });
        return;
      }

      const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);

      // Check verification code
      let verificationData = null;
      let verificationError = null;

      if (supabaseAdmin) {
        // Check in verification_attempts table
        const { data, error } = await supabaseAdmin
          .from('verification_attempts')
          .select('*')
          .eq('contact_info', formattedPhone)
          .eq('verification_code', code)
          .eq('verification_type', 'sms')
          .eq('is_successful', false)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        verificationData = data;
        verificationError = error;
      } else {
        // Fallback to email_verifications table
        const { data, error } = await supabase
          .from('email_verifications')
          .select('*')
          .eq('phone_number', formattedPhone)
          .eq('otp', code)
          .eq('verification_type', 'sms')
          .gt('expires_at', new Date().toISOString())
          .single();

        verificationData = data;
        verificationError = error;
      }

      if (verificationError || !verificationData) {
        res.status(400).json({
          success: false,
          error: 'INVALID_CODE',
          message: 'Invalid or expired verification code'
        });
        return;
      }

      // Mark verification as successful
      if (supabaseAdmin) {
        await supabaseAdmin
          .from('verification_attempts')
          .update({
            is_successful: true,
            verified_at: new Date().toISOString()
          })
          .eq('id', verificationData.id);
      } else {
        await supabase
          .from('email_verifications')
          .update({
            is_used: true
          })
          .eq('id', verificationData.id);
      }

      res.json({
        success: true,
        message: 'Phone number verified successfully',
        data: {
          phoneNumber: formattedPhone,
          verified: true
        }
      });
    } catch (error) {
      console.error('Error verifying SMS code:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to verify SMS code'
      });
    }
  }

  /**
   * Resend SMS verification code
   */
  static async resendCode(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber, userType = 'customer' } = req.body;

      if (!phoneNumber) {
        res.status(400).json({
          success: false,
          error: 'Phone number is required'
        });
        return;
      }

      // Use the same logic as sendVerificationCode but with stricter rate limiting
      const formattedPhone = SMSService.formatPhoneNumber(phoneNumber);

      console.log('SMS Verification Controller - Resend phone number formatting:', {
        original: phoneNumber,
        formatted: formattedPhone,
        userType: userType
      });

      // Check if there was a recent verification attempt (within 1 minute)
      if (supabaseAdmin) {
        const { data: recentAttempts } = await supabaseAdmin
          .from('verification_attempts')
          .select('created_at')
          .eq('contact_info', formattedPhone)
          .eq('verification_type', 'sms')
          .gt('created_at', new Date(Date.now() - 60 * 1000).toISOString()) // 1 minute ago
          .order('created_at', { ascending: false })
          .limit(1);

        if (recentAttempts && recentAttempts.length > 0) {
          res.status(429).json({
            success: false,
            error: 'RESEND_TOO_SOON',
            message: 'Please wait 1 minute before requesting another code'
          });
          return;
        }
      }

      // Generate new verification code
      const verificationCode = SMSService.generateVerificationCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Store new verification code
      if (supabaseAdmin) {
        const { error: storeError } = await supabaseAdmin
          .from('verification_attempts')
          .insert({
            user_type: userType,
            verification_type: 'sms',
            contact_info: formattedPhone,
            verification_code: verificationCode,
            expires_at: expiresAt.toISOString(),
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.get('User-Agent')
          });

        if (storeError) {
          console.error('Error storing resend SMS verification code:', storeError);
          res.status(500).json({
            success: false,
            error: 'Failed to generate verification code'
          });
          return;
        }
      }

      // Send SMS
      const smsSent = await SMSService.sendVerificationCode(formattedPhone, verificationCode);

      if (!smsSent) {
        res.status(500).json({
          success: false,
          error: 'Failed to send SMS verification code'
        });
        return;
      }

      res.json({
        success: true,
        message: 'SMS verification code resent successfully',
        data: {
          phoneNumber: formattedPhone,
          expiresIn: 10 * 60 // 10 minutes in seconds
        }
      });
    } catch (error) {
      console.error('Error resending SMS verification:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to resend SMS verification code'
      });
    }
  }

  /**
   * Get SMS service status
   */
  static async getServiceStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = SMSService.getServiceStatus();
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error getting SMS service status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get SMS service status'
      });
    }
  }
}

export default SMSVerificationController;
