import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class RewardsController {
  /**
   * Get rewards for current user
   */
  static async getRewards(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 10 } = req.query;

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      const { data: rewards, error } = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', userId)
        .range(offset, offset + parseInt(limit as string) - 1)
        .order('created_at', { ascending: false });

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch rewards'
        });
        return;
      }

      res.json({
        success: true,
        data: rewards,
        message: 'Rewards retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting rewards:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve rewards'
      });
    }
  }

  /**
   * Get available rewards that user can claim
   */
  static async getAvailableRewards(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      // Get user's total waste collected
      const { data: collections, error: collectionsError } = await supabase
        .from('waste_collections')
        .select('weight, waste_type')
        .eq('customer_id', userId)
        .eq('status', 'completed');

      if (collectionsError) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch user collections'
        });
        return;
      }

      const totalWasteCollected = collections?.reduce((sum, collection) => 
        sum + (collection.weight || 0), 0) || 0;

      // Define available rewards based on waste collected
      const availableRewards = [
        {
          id: 'first_pickup',
          title: 'First Pickup',
          description: 'Complete your first waste pickup',
          points: 50,
          required_waste: 0,
          claimed: false
        },
        {
          id: 'waste_warrior',
          title: 'Waste Warrior',
          description: 'Collect 100kg of waste',
          points: 100,
          required_waste: 100,
          claimed: totalWasteCollected >= 100
        },
        {
          id: 'eco_champion',
          title: 'Eco Champion',
          description: 'Collect 500kg of waste',
          points: 250,
          required_waste: 500,
          claimed: totalWasteCollected >= 500
        },
        {
          id: 'sustainability_hero',
          title: 'Sustainability Hero',
          description: 'Collect 1000kg of waste',
          points: 500,
          required_waste: 1000,
          claimed: totalWasteCollected >= 1000
        },
        {
          id: 'plastic_crusher',
          title: 'Plastic Crusher',
          description: 'Collect 200kg of plastic waste',
          points: 150,
          required_waste: 200,
          claimed: collections?.filter(c => c.waste_type === 'plastic')
            .reduce((sum, c) => sum + (c.weight || 0), 0) >= 200
        }
      ];

      res.json({
        success: true,
        data: {
          availableRewards,
          totalWasteCollected,
          totalPoints: availableRewards.reduce((sum, reward) => 
            reward.claimed ? sum + reward.points : sum, 0)
        },
        message: 'Available rewards retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting available rewards:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve available rewards'
      });
    }
  }

  /**
   * Claim a reward
   */
  static async claimReward(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { reward_id, reward_title, points } = req.body;

      if (!reward_id || !reward_title || !points) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
        return;
      }

      // Check if reward already claimed
      const { data: existingReward } = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', userId)
        .eq('reward_id', reward_id)
        .single();

      if (existingReward) {
        res.status(400).json({
          success: false,
          error: 'Reward already claimed'
        });
        return;
      }

      // Create reward record
      const { data: reward, error } = await supabase
        .from('rewards')
        .insert({
          user_id: userId,
          reward_id,
          title: reward_title,
          points: parseInt(points),
          claimed_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        res.status(400).json({
          success: false,
          error: 'Failed to claim reward'
        });
        return;
      }

      res.status(201).json({
        success: true,
        data: reward,
        message: 'Reward claimed successfully'
      });
    } catch (error) {
      console.error('Error claiming reward:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to claim reward'
      });
    }
  }

  /**
   * Get rewards leaderboard
   */
  static async getLeaderboard(req: Request, res: Response): Promise<void> {
    try {
      const { limit = 10 } = req.query;

      const { data: leaderboard, error } = await supabase
        .from('rewards')
        .select(`
          points,
          users!inner(username, profile_image)
        `)
        .order('points', { ascending: false })
        .limit(parseInt(limit as string));

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch leaderboard'
        });
        return;
      }

      // Group by user and sum points
      const userPoints: { [key: string]: any } = {};
      leaderboard?.forEach((reward: any) => {
        const userId = reward.users.id;
        if (!userPoints[userId]) {
          userPoints[userId] = {
            username: reward.users.username,
            profileImage: reward.users.profile_image,
            totalPoints: 0
          };
        }
        userPoints[userId].totalPoints += reward.points;
      });

      const sortedLeaderboard = Object.values(userPoints)
        .sort((a: any, b: any) => b.totalPoints - a.totalPoints)
        .slice(0, parseInt(limit as string));

      res.json({
        success: true,
        data: sortedLeaderboard,
        message: 'Leaderboard retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve leaderboard'
      });
    }
  }

  /**
   * Get user rewards statistics
   */
  static async getRewardsStats(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      // Get user's rewards
      const { data: rewards, error: rewardsError } = await supabase
        .from('rewards')
        .select('*')
        .eq('user_id', userId);

      if (rewardsError) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch rewards'
        });
        return;
      }

      // Get user's collections
      const { data: collections, error: collectionsError } = await supabase
        .from('waste_collections')
        .select('weight, waste_type')
        .eq('customer_id', userId)
        .eq('status', 'completed');

      if (collectionsError) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch collections'
        });
        return;
      }

      const stats = {
        totalRewards: rewards?.length || 0,
        totalPoints: rewards?.reduce((sum, reward) => sum + reward.points, 0) || 0,
        totalWasteCollected: collections?.reduce((sum, collection) => 
          sum + (collection.weight || 0), 0) || 0,
        rewardsThisMonth: rewards?.filter(reward => {
          const rewardDate = new Date(reward.claimed_at);
          const now = new Date();
          return rewardDate.getMonth() === now.getMonth() && 
                 rewardDate.getFullYear() === now.getFullYear();
        }).length || 0
      };

      res.json({
        success: true,
        data: stats,
        message: 'Rewards statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting rewards stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve rewards statistics'
      });
    }
  }
} 