import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class RecyclersController {
  /**
   * Get recycler contact information for calling
   */
  static async getRecyclerContact(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const { data: recycler, error } = await supabase
        .from('users')
        .select(`
          id,
          username,
          phone,
          profile_image,
          recycler_profiles!inner(
            business_name,
            average_rating,
            vehicle_info,
            hourly_rate,
            experience_years
          )
        `)
        .eq('id', id)
        .eq('role', 'recycler')
        .eq('email_verified', true)
        .single();

      if (error || !recycler) {
        res.status(404).json({
          success: false,
          error: 'Recycler not found'
        });
        return;
      }

      // Get past pickups count
      const { data: pastPickups, error: pickupsError } = await supabase
        .from('waste_collections')
        .select('id')
        .eq('recycler_id', id)
        .eq('status', 'completed');

      const contactData = {
        recyclerId: recycler.id,
        name: recycler.username,
        phone: recycler.phone,
        profileImage: recycler.profile_image,
        businessName: recycler.recycler_profiles?.[0]?.business_name,
        rating: recycler.recycler_profiles?.[0]?.average_rating || 0,
        truckType: recycler.recycler_profiles?.[0]?.vehicle_info || 'Standard Truck',
        rate: `GHS ${recycler.recycler_profiles?.[0]?.hourly_rate || 0}/hr`,
        pastPickups: pastPickups?.length || 0,
        experienceYears: recycler.recycler_profiles?.[0]?.experience_years || 0
      };

      res.json({
        success: true,
        data: contactData,
        message: 'Recycler contact information retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting recycler contact:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve recycler contact information'
      });
    }
  }

  /**
   * Get recycler statistics and performance data
   */
  static async getRecyclerStats(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { period = 'month' } = req.query;

      let dateFilter = new Date();
      switch (period) {
        case 'week':
          dateFilter.setDate(dateFilter.getDate() - 7);
          break;
        case 'month':
          dateFilter.setMonth(dateFilter.getMonth() - 1);
          break;
        case 'year':
          dateFilter.setFullYear(dateFilter.getFullYear() - 1);
          break;
        default:
          dateFilter.setMonth(dateFilter.getMonth() - 1);
      }

      // Get collections stats
      const { data: collections, error: collectionsError } = await supabase
        .from('waste_collections')
        .select('*')
        .eq('recycler_id', id)
        .gte('created_at', dateFilter.toISOString());

      if (collectionsError) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch collections stats'
        });
        return;
      }

      // Get reviews stats
      const { data: reviews, error: reviewsError } = await supabase
        .from('recycler_reviews')
        .select('*')
        .eq('recycler_id', id)
        .gte('created_at', dateFilter.toISOString());

      if (reviewsError) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch reviews stats'
        });
        return;
      }

      const stats = {
        totalCollections: collections?.length || 0,
        completedCollections: collections?.filter(c => c.status === 'completed').length || 0,
        totalEarnings: collections?.filter(c => c.status === 'completed').reduce((sum, c) => {
          const baseRate = this.getBaseRate(c.waste_type);
          return sum + (baseRate * (c.weight || 0));
        }, 0) || 0,
        averageRating: reviews?.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
        totalReviews: reviews?.length || 0,
        efficiency: collections?.length > 0 ? 
          Math.round((collections.filter(c => c.status === 'completed').length / collections.length) * 100) : 0
      };

      res.json({
        success: true,
        data: stats,
        message: 'Statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting recycler stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve statistics'
      });
    }
  }

  /**
   * Create or update recycler profile
   */
  static async createUpdateProfile(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;
      const {
        business_name,
        business_license,
        service_areas,
        waste_types,
        vehicle_info,
        experience_years,
        hourly_rate,
        availability_schedule,
        bio,
        certifications
      } = req.body;

      if (!business_name || !service_areas || !waste_types) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
        return;
      }

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('recycler_profiles')
        .select('*')
        .eq('recycler_id', recyclerId)
        .single();

      let profile;
      if (existingProfile) {
        // Update existing profile
        const { data, error } = await supabase
          .from('recycler_profiles')
          .update({
            business_name,
            business_license,
            service_areas,
            waste_types,
            vehicle_info,
            experience_years: parseInt(experience_years),
            hourly_rate: parseFloat(hourly_rate),
            availability_schedule,
            bio,
            certifications
          })
          .eq('recycler_id', recyclerId)
          .select()
          .single();

        if (error) {
          res.status(400).json({
            success: false,
            error: 'Failed to update profile'
          });
          return;
        }
        profile = data;
      } else {
        // Create new profile
        const { data, error } = await supabase
          .from('recycler_profiles')
          .insert({
            recycler_id: recyclerId,
            business_name,
            business_license,
            service_areas,
            waste_types,
            vehicle_info,
            experience_years: parseInt(experience_years),
            hourly_rate: parseFloat(hourly_rate),
            availability_schedule,
            bio,
            certifications
          })
          .select()
          .single();

        if (error) {
          res.status(400).json({
            success: false,
            error: 'Failed to create profile'
          });
          return;
        }
        profile = data;
      }

      res.json({
        success: true,
        data: profile,
        message: existingProfile ? 'Profile updated successfully' : 'Profile created successfully'
      });
    } catch (error) {
      console.error('Error creating/updating recycler profile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create/update profile'
      });
    }
  }

  /**
   * Get current recycler profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;

      const { data: profile, error } = await supabase
        .from('recycler_profiles')
        .select('*')
        .eq('recycler_id', recyclerId)
        .single();

      if (error || !profile) {
        res.status(404).json({
          success: false,
          error: 'Profile not found'
        });
        return;
      }

      res.json({
        success: true,
        data: profile,
        message: 'Profile retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting recycler profile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve profile'
      });
    }
  }

  /**
   * Search for recyclers by criteria
   */
  static async searchRecyclers(req: Request, res: Response): Promise<void> {
    try {
      const {
        location,
        waste_type,
        rating,
        availability,
        page = 1,
        limit = 10
      } = req.query;

      let query = supabase
        .from('recycler_profiles')
        .select(`
          *,
          recyclers:recycler_id(id, username, phone, address, city, state, profile_image)
        `)
        .eq('recyclers.email_verified', true)
        .eq('is_available', true); // Only show available recyclers

      // Filter by location
      if (location) {
        query = query.or(`service_areas.cs.{${location}},city.eq.${location},state.eq.${location}`);
      }

      // Filter by waste type
      if (waste_type) {
        query = query.contains('waste_types', [waste_type]);
      }

      // Filter by rating
      if (rating) {
        query = query.gte('average_rating', parseFloat(rating as string));
      }

      // Filter by availability schedule (day of week)
      if (availability) {
        query = query.contains('availability_schedule', { [availability as string]: true });
      }

      // Pagination
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      query = query.range(offset, offset + parseInt(limit as string) - 1);
      query = query.order('average_rating', { ascending: false });

      const { data: recyclers, error } = await query;

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to search recyclers'
        });
        return;
      }

      res.json({
        success: true,
        data: recyclers,
        message: 'Recyclers search completed successfully'
      });
    } catch (error) {
      console.error('Error searching recyclers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search recyclers'
      });
    }
  }

  /**
   * Get specific recycler profile
   */
  static async getRecyclerProfile(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const { data: recycler, error } = await supabase
        .from('recycler_profiles')
        .select(`
          *,
          recyclers:recycler_id(id, username, phone, address, city, state, profile_image, created_at)
        `)
        .eq('recycler_id', id)
        .eq('recyclers.email_verified', true)
        .single();

      if (error || !recycler) {
        res.status(404).json({
          success: false,
          error: 'Recycler not found'
        });
        return;
      }

      res.json({
        success: true,
        data: recycler,
        message: 'Recycler profile retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting recycler profile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve recycler profile'
      });
    }
  }

  /**
   * Update recycler availability
   */
  static async updateAvailability(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;
      const { availability_schedule, is_available } = req.body;

      console.log('updateAvailability called with:', {
        recyclerId,
        availability_schedule,
        is_available,
        body: req.body
      });

      if (!availability_schedule) {
        res.status(400).json({
          success: false,
          error: 'Availability schedule is required'
        });
        return;
      }

      // First check if the recycler profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('recycler_profiles')
        .select('*')
        .eq('recycler_id', recyclerId)
        .single();

      if (checkError) {
        console.error('Error checking existing profile:', checkError);
        res.status(400).json({
          success: false,
          error: `Profile not found: ${checkError.message}`
        });
        return;
      }

      console.log('Existing profile found:', existingProfile);

      const { data: profile, error } = await supabase
        .from('recycler_profiles')
        .update({
          availability_schedule,
          is_available: is_available !== undefined ? is_available : true
        })
        .eq('recycler_id', recyclerId)
        .select()
        .single();

      if (error) {
        console.error('Error updating availability:', error);
        res.status(400).json({
          success: false,
          error: `Failed to update availability: ${error.message}`
        });
        return;
      }

      console.log('Availability updated successfully:', profile);

      res.json({
        success: true,
        data: profile,
        message: 'Availability updated successfully'
      });
    } catch (error) {
      console.error('Error updating availability:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update availability'
      });
    }
  }

  /**
   * Add review for recycler
   */
  static async addReview(req: Request, res: Response): Promise<void> {
    try {
      const customerId = req.user?.id;
      const { recycler_id, collection_id, rating, comment } = req.body;

      if (!recycler_id || !collection_id || !rating) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
        return;
      }

      // Verify collection exists and belongs to customer
      const { data: collection, error: collectionError } = await supabase
        .from('waste_collections')
        .select('*')
        .eq('id', collection_id)
        .eq('customer_id', customerId)
        .eq('recycler_id', recycler_id)
        .eq('status', 'completed')
        .single();

      if (collectionError || !collection) {
        res.status(404).json({
          success: false,
          error: 'Collection not found or not completed'
        });
        return;
      }

      // Check if review already exists
      const { data: existingReview } = await supabase
        .from('recycler_reviews')
        .select('*')
        .eq('collection_id', collection_id)
        .single();

      if (existingReview) {
        res.status(400).json({
          success: false,
          error: 'Review already exists for this collection'
        });
        return;
      }

      // Create review
      const { data: review, error } = await supabase
        .from('recycler_reviews')
        .insert({
          customer_id: customerId,
          recycler_id,
          collection_id,
          rating: parseInt(rating),
          comment
        })
        .select()
        .single();

      if (error) {
        res.status(400).json({
          success: false,
          error: 'Failed to create review'
        });
        return;
      }

      // Update recycler's average rating
      await this.updateRecyclerRating(recycler_id);

      res.status(201).json({
        success: true,
        data: review,
        message: 'Review created successfully'
      });
    } catch (error) {
      console.error('Error creating review:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create review'
      });
    }
  }

  /**
   * Get reviews for a recycler
   */
  static async getRecyclerReviews(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      const { data: reviews, error } = await supabase
        .from('recycler_reviews')
        .select(`
          *,
          customers:customer_id(id, username),
          collections:collection_id(id, waste_type, pickup_date)
        `)
        .eq('recycler_id', id)
        .range(offset, offset + parseInt(limit as string) - 1)
        .order('created_at', { ascending: false });

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch reviews'
        });
        return;
      }

      res.json({
        success: true,
        data: reviews,
        message: 'Reviews retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting reviews:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve reviews'
      });
    }
  }

  /**
   * Get recycler statistics
   */
  static async getRecyclerStatistics(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;
      const { period = 'month' } = req.query;

      let dateFilter = new Date();
      switch (period) {
        case 'week':
          dateFilter.setDate(dateFilter.getDate() - 7);
          break;
        case 'month':
          dateFilter.setMonth(dateFilter.getMonth() - 1);
          break;
        case 'year':
          dateFilter.setFullYear(dateFilter.getFullYear() - 1);
          break;
        default:
          dateFilter.setMonth(dateFilter.getMonth() - 1);
      }

      // Get collections stats
      const { data: collections, error: collectionsError } = await supabase
        .from('waste_collections')
        .select('*')
        .eq('recycler_id', recyclerId)
        .gte('created_at', dateFilter.toISOString());

      if (collectionsError) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch collections stats'
        });
        return;
      }

      // Get reviews stats
      const { data: reviews, error: reviewsError } = await supabase
        .from('recycler_reviews')
        .select('*')
        .eq('recycler_id', recyclerId)
        .gte('created_at', dateFilter.toISOString());

      if (reviewsError) {
        res.status(500).json({
          success: false,
          error: 'Failed to fetch reviews stats'
        });
        return;
      }

      const stats = {
        totalCollections: collections?.length || 0,
        completedCollections: collections?.filter(c => c.status === 'completed').length || 0,
        totalEarnings: collections?.filter(c => c.status === 'completed').reduce((sum, c) => {
          const baseRate = this.getBaseRate(c.waste_type);
          return sum + (baseRate * (c.weight || 0));
        }, 0) || 0,
        averageRating: reviews?.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
        totalReviews: reviews?.length || 0
      };

      res.json({
        success: true,
        data: stats,
        message: 'Statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting recycler stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve statistics'
      });
    }
  }

  // Helper function to update recycler's average rating
  private static async updateRecyclerRating(recyclerId: string): Promise<void> {
    try {
      const { data: reviews } = await supabase
        .from('recycler_reviews')
        .select('rating')
        .eq('recycler_id', recyclerId);

      if (reviews && reviews.length > 0) {
        const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

        await supabase
          .from('recycler_profiles')
          .update({ average_rating: averageRating })
          .eq('recycler_id', recyclerId);
      }
    } catch (error) {
      console.error('Error updating recycler rating:', error);
    }
  }

  // Helper function to get base rate for waste type
  private static getBaseRate(wasteType: string): number {
    const rates: { [key: string]: number } = {
      'plastic': 2.5,
      'paper': 1.8,
      'glass': 0.3,
      'metal': 4.0,
      'organic': 0.5,
      'electronics': 8.0,
      'mixed': 1.5
    };
    return rates[wasteType] || 1.5;
  }
} 