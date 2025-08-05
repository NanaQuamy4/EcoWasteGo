import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class RecyclerCelebrationController {
  /**
   * Mark pickup as completed and trigger celebration
   */
  static async completePickup(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;
      const { pickupId, wasteType, weight, totalAmount, userName, location } = req.body;

      if (!pickupId) {
        res.status(400).json({
          success: false,
          error: 'Pickup ID is required'
        });
        return;
      }

      // Update pickup status to completed
      const { data: pickup, error: pickupError } = await supabase
        .from('waste_collections')
        .update({
          status: 'completed',
          weight: weight || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', pickupId)
        .eq('recycler_id', recyclerId)
        .select()
        .single();

      if (pickupError) {
        res.status(500).json({
          success: false,
          error: 'Failed to complete pickup'
        });
        return;
      }

      // Create payment record
      if (totalAmount) {
        await supabase
          .from('payments')
          .insert({
            collection_id: pickupId,
            amount: parseFloat(totalAmount),
            status: 'completed',
            payment_method: 'cash',
            payment_date: new Date().toISOString()
          });
      }

      // Update recycler stats
      const { data: recyclerProfile, error: profileError } = await supabase
        .from('recycler_profiles')
        .select('total_collections')
        .eq('user_id', recyclerId)
        .single();

      if (profileError) {
        res.status(500).json({
          success: false,
          error: 'Failed to get recycler profile for stats update'
        });
        return;
      }

      const { data: updatedProfile, error: updateError } = await supabase
        .from('recycler_profiles')
        .update({
          total_collections: (recyclerProfile.total_collections || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', recyclerId)
        .select()
        .single();

      if (updateError) {
        res.status(500).json({
          success: false,
          error: 'Failed to update recycler stats'
        });
        return;
      }

      // Calculate eco impact
      const ecoImpact = RecyclerCelebrationController.calculateEcoImpact(wasteType, weight);

      res.json({
        success: true,
        data: {
          pickup,
          ecoImpact,
          celebration: {
            message: 'Payment Received!',
            subtitle: 'Thank you for your eco-friendly service',
            achievement: '🌱 Eco Hero Achievement',
            stats: [
              { icon: '♻️', label: 'Waste Collected' },
              { icon: '🌍', label: 'Planet Helped' },
              { icon: '💰', label: 'Payment Earned' }
            ],
            impact: [
              'Reducing landfill waste',
              'Preventing environmental pollution',
              'Supporting sustainable practices',
              'Creating a cleaner community'
            ]
          }
        },
        message: 'Pickup completed successfully'
      });
    } catch (error) {
      console.error('Error completing pickup:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to complete pickup'
      });
    }
  }

  /**
   * Get recycler achievements and stats
   */
  static async getAchievements(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;

      const { data: profile, error } = await supabase
        .from('recycler_profiles')
        .select('total_collections, rating, experience_years')
        .eq('user_id', recyclerId)
        .single();

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to get achievements'
        });
        return;
      }

      // Calculate achievements based on stats
      const achievements = [
        {
          id: 'first_pickup',
          title: 'First Pickup',
          description: 'Completed your first waste collection',
          earned: profile.total_collections > 0,
          icon: '🎯'
        },
        {
          id: 'eco_hero',
          title: 'Eco Hero',
          description: 'Completed 10+ pickups',
          earned: profile.total_collections >= 10,
          icon: '🌱'
        },
        {
          id: 'veteran',
          title: 'Veteran Recycler',
          description: 'Completed 50+ pickups',
          earned: profile.total_collections >= 50,
          icon: '🏆'
        },
        {
          id: 'high_rating',
          title: 'Top Rated',
          description: 'Maintained 4.5+ rating',
          earned: profile.rating >= 4.5,
          icon: '⭐'
        }
      ];

      res.json({
        success: true,
        data: {
          achievements,
          stats: {
            totalCollections: profile.total_collections,
            rating: profile.rating,
            experienceYears: profile.experience_years
          }
        },
        message: 'Achievements retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting achievements:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get achievements'
      });
    }
  }

  /**
   * Calculate and record eco impact for completed pickup
   */
  static async recordEcoImpact(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;
      const { pickupId, wasteType, weight } = req.body;

      if (!pickupId || !wasteType || !weight) {
        res.status(400).json({
          success: false,
          error: 'Pickup ID, waste type, and weight are required'
        });
        return;
      }

      const ecoImpact = RecyclerCelebrationController.calculateEcoImpact(wasteType, weight);

      // Record eco impact
      const { data: impact, error } = await supabase
        .from('eco_impact')
        .insert({
          user_id: recyclerId,
          collection_id: pickupId,
          co2_saved: ecoImpact.co2Saved,
          trees_equivalent: ecoImpact.treesEquivalent,
          water_saved: ecoImpact.waterSaved,
          energy_saved: ecoImpact.energySaved
        })
        .select()
        .single();

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to record eco impact'
        });
        return;
      }

      res.json({
        success: true,
        data: impact,
        message: 'Eco impact recorded successfully'
      });
    } catch (error) {
      console.error('Error recording eco impact:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record eco impact'
      });
    }
  }

  /**
   * Get recycler performance statistics
   */
  static async getStats(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;

      // Get recycler profile
      const { data: profile, error: profileError } = await supabase
        .from('recycler_profiles')
        .select('total_collections, rating, experience_years')
        .eq('user_id', recyclerId)
        .single();

      if (profileError) {
        res.status(500).json({
          success: false,
          error: 'Failed to get recycler stats'
        });
        return;
      }

      // Get recent pickups
      const { data: recentPickups, error: pickupsError } = await supabase
        .from('waste_collections')
        .select('id, waste_type, weight, created_at')
        .eq('recycler_id', recyclerId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (pickupsError) {
        res.status(500).json({
          success: false,
          error: 'Failed to get recent pickups'
        });
        return;
      }

      // Calculate total eco impact
      const { data: ecoImpact, error: impactError } = await supabase
        .from('eco_impact')
        .select('co2_saved, trees_equivalent, water_saved, energy_saved')
        .eq('user_id', recyclerId);

      const totalEcoImpact = ecoImpact?.reduce((acc, impact) => ({
        co2Saved: acc.co2Saved + (impact.co2_saved || 0),
        treesEquivalent: acc.treesEquivalent + (impact.trees_equivalent || 0),
        waterSaved: acc.waterSaved + (impact.water_saved || 0),
        energySaved: acc.energySaved + (impact.energy_saved || 0)
      }), { co2Saved: 0, treesEquivalent: 0, waterSaved: 0, energySaved: 0 }) || {
        co2Saved: 0,
        treesEquivalent: 0,
        waterSaved: 0,
        energySaved: 0
      };

      res.json({
        success: true,
        data: {
          profile,
          recentPickups,
          totalEcoImpact,
          performance: {
            totalCollections: profile.total_collections,
            averageRating: profile.rating,
            experienceYears: profile.experience_years,
            monthlyCollections: recentPickups?.length || 0
          }
        },
        message: 'Stats retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get stats'
      });
    }
  }

  /**
   * Calculate eco impact based on waste type and weight
   */
  private static calculateEcoImpact(wasteType: string, weight: number): any {
    const weightNum = typeof weight === 'string' ? parseFloat(weight) : weight || 0;

    const impactFactors = {
      plastic: { co2: 2.5, trees: 0.1, water: 100, energy: 5.0 },
      paper: { co2: 1.8, trees: 0.08, water: 80, energy: 3.5 },
      glass: { co2: 0.3, trees: 0.02, water: 20, energy: 1.0 },
      metal: { co2: 4.0, trees: 0.15, water: 150, energy: 8.0 },
      organic: { co2: 0.5, trees: 0.03, water: 30, energy: 1.5 },
      electronics: { co2: 8.0, trees: 0.3, water: 300, energy: 15.0 },
      mixed: { co2: 1.5, trees: 0.06, water: 60, energy: 3.0 }
    };

    const factors = impactFactors[wasteType as keyof typeof impactFactors] || impactFactors.mixed;

    return {
      co2Saved: weightNum * factors.co2,
      treesEquivalent: weightNum * factors.trees,
      waterSaved: weightNum * factors.water,
      energySaved: weightNum * factors.energy
    };
  }
} 