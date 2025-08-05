import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class PrivacyController {
  /**
   * Get privacy policy content
   */
  static async getPrivacyPolicy(req: Request, res: Response): Promise<void> {
    try {
      // Return privacy policy content based on PrivacyScreen
      const privacyPolicy = {
        effectiveDate: '22/07/2025',
        lastUpdated: '29/08/2025',
        sections: [
          {
            title: '1. Information We Collect',
            content: 'We may collect the following information when you use our App:',
            subsections: [
              {
                title: 'Personal Information',
                items: ['Name', 'Email address', 'Phone number', 'Role (User or Recycler)', 'Profile photo (optional)']
              },
              {
                title: 'Location Information',
                items: ['Real-time location for tracking pickups and drop-offs (with permission)']
              },
              {
                title: 'Device & Usage Data',
                items: ['Device type and operating system', 'App usage statistics', 'Crash logs and performance metrics']
              },
              {
                title: 'Authentication Data',
                items: ['Information from sign-in methods (e.g., Clerk, Google, Apple)']
              },
              {
                title: 'Waste Pickup Data',
                items: ['Waste type', 'Pickup location', 'Status of requests (pending, accepted, completed)']
              }
            ]
          },
          {
            title: '2. How We Use Your Information',
            items: [
              'Create and manage your account',
              'Match users with certified recyclers',
              'Track real-time location (for recyclers and users)',
              'Send notifications related to pickups',
              'Analyze usage and improve app performance',
              'Comply with legal obligations'
            ]
          },
          {
            title: '3. Sharing Your Information',
            content: 'We do not sell your personal information. However, we may share it in the following ways:',
            items: [
              'With certified recyclers for pickup coordination',
              'With service providers (e.g., Google Maps, Clerk) under strict privacy agreements',
              'With law enforcement if required by law'
            ]
          },
          {
            title: '4. Third-Party Services',
            content: 'We use trusted third-party services, including:',
            items: [
              'Clerk – for user authentication and account management',
              'MongoDB Atlas – for secure cloud database storage',
              'Google Maps API – for location and map features',
              'Expo – for app development and deployment'
            ]
          },
          {
            title: '5. Data Security',
            content: 'We use industry-standard encryption and security practices to protect your data. However, no method of transmission over the internet is 100% secure.'
          },
          {
            title: '6. Location Permissions',
            content: 'We request access to your device\'s location to enable:',
            items: [
              'Real-time pickup tracking for recyclers',
              'Map-based pickup requests for users'
            ]
          },
          {
            title: '7. Data Retention',
            content: 'We retain your information for as long as your account is active or as needed for legal, regulatory, or operational purposes.'
          },
          {
            title: '8. Your Rights',
            content: 'You have the right to:',
            items: [
              'Access and update your information',
              'Request deletion of your account',
              'Withdraw consent for data use'
            ]
          },
          {
            title: '9. Children\'s Privacy',
            content: 'EcoWasteGo is not intended for children under 13. We do not knowingly collect data from minors.'
          },
          {
            title: '10. Changes to This Policy',
            content: 'We may update this Privacy Policy from time to time. We\'ll notify you of significant changes through the App or via email.'
          },
          {
            title: '11. Contact Us',
            content: 'If you have any questions or concerns, contact us at:',
            contact: {
              email: 'ecowastego@gmail.com',
              company: 'EcoWasteGo',
              address: '[-------------------------------]'
            }
          }
        ]
      };

      res.json({
        success: true,
        data: privacyPolicy,
        message: 'Privacy policy retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting privacy policy:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get privacy policy'
      });
    }
  }

  /**
   * Accept privacy policy
   */
  static async acceptPrivacyPolicy(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { version } = req.body;

      const { data: user, error } = await supabase
        .from('users')
        .update({
          privacy_policy_accepted: true,
          privacy_policy_version: version || '1.0',
          privacy_policy_accepted_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to accept privacy policy'
        });
        return;
      }

      res.json({
        success: true,
        data: user,
        message: 'Privacy policy accepted successfully'
      });
    } catch (error) {
      console.error('Error accepting privacy policy:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to accept privacy policy'
      });
    }
  }

  /**
   * Get user's privacy policy acceptance status
   */
  static async getPrivacyStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      const { data: user, error } = await supabase
        .from('users')
        .select('privacy_policy_accepted, privacy_policy_version, privacy_policy_accepted_at')
        .eq('id', userId)
        .single();

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to get privacy status'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          isAccepted: user.privacy_policy_accepted || false,
          version: user.privacy_policy_version,
          acceptedAt: user.privacy_policy_accepted_at
        },
        message: 'Privacy status retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting privacy status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get privacy status'
      });
    }
  }

  /**
   * Withdraw privacy policy consent
   */
  static async withdrawConsent(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      const { data: user, error } = await supabase
        .from('users')
        .update({
          privacy_policy_accepted: false,
          privacy_policy_withdrawn_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to withdraw consent'
        });
        return;
      }

      res.json({
        success: true,
        data: user,
        message: 'Privacy policy consent withdrawn successfully'
      });
    } catch (error) {
      console.error('Error withdrawing consent:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to withdraw consent'
      });
    }
  }
} 