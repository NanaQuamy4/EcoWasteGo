import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class OnboardingController {
  /**
   * Get onboarding slides content
   */
  static async getOnboardingSlides(req: Request, res: Response): Promise<void> {
    try {
      // Return slides based on OnboardingScreen
      const slides = [
        {
          key: 'slide1',
          image: 'locate.png',
          title: 'Request a Recycler',
          description: '',
          button: false
        },
        {
          key: 'slide2',
          image: 'Onboard2.jpg',
          title: 'Track Your Pickup',
          description: 'Know where your agent is. Real-time tracking keeps you in the loop',
          button: false
        },
        {
          key: 'slide3',
          image: 'Onboard4.jpg',
          title: 'WASTE FREE ECOSYSTEM',
          description: '',
          button: true
        }
      ];

      res.json({
        success: true,
        data: {
          slides,
          totalSlides: slides.length
        },
        message: 'Onboarding slides retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting onboarding slides:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get onboarding slides'
      });
    }
  }

  /**
   * Mark onboarding as completed for user
   */
  static async completeOnboarding(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { preferences } = req.body;

      // Update user's onboarding status
      const { data: user, error } = await supabase
        .from('users')
        .update({
          onboarding_completed: true,
          onboarding_completed_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to complete onboarding'
        });
        return;
      }

      // Save user preferences if provided
      if (preferences) {
        await supabase
          .from('customer_preferences')
          .upsert({
            user_id: userId,
            preferences: preferences,
            updated_at: new Date().toISOString()
          });
      }

      res.json({
        success: true,
        data: user,
        message: 'Onboarding completed successfully'
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete onboarding'
      });
    }
  }

  /**
   * Get user's onboarding status
   */
  static async getOnboardingStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      const { data: user, error } = await supabase
        .from('users')
        .select('onboarding_completed, onboarding_completed_at')
        .eq('id', userId)
        .single();

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to get onboarding status'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          isCompleted: user.onboarding_completed || false,
          completedAt: user.onboarding_completed_at
        },
        message: 'Onboarding status retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting onboarding status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get onboarding status'
      });
    }
  }

  /**
   * Update user onboarding preferences
   */
  static async updatePreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { preferences } = req.body;

      if (!preferences) {
        res.status(400).json({
          success: false,
          error: 'Preferences are required'
        });
        return;
      }

      const { data: userPrefs, error } = await supabase
        .from('customer_preferences')
        .upsert({
          user_id: userId,
          preferences: preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to update preferences'
        });
        return;
      }

      res.json({
        success: true,
        data: userPrefs,
        message: 'Preferences updated successfully'
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update preferences'
      });
    }
  }
} 