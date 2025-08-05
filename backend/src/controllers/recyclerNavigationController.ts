import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class RecyclerNavigationController {
  /**
   * Start navigation to pickup location
   */
  static async startNavigation(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;
      const { pickupId, currentLat, currentLng } = req.body;

      if (!pickupId || !currentLat || !currentLng) {
        res.status(400).json({
          success: false,
          error: 'Pickup ID and current location are required'
        });
        return;
      }

      // Get pickup details
      const { data: pickup, error: pickupError } = await supabase
        .from('waste_collections')
        .select(`
          *,
          customers!inner(id, username, phone)
        `)
        .eq('id', pickupId)
        .eq('recycler_id', recyclerId)
        .single();

      if (pickupError || !pickup) {
        res.status(404).json({
          success: false,
          error: 'Pickup not found or not assigned to this recycler'
        });
        return;
      }

      // Start tracking session
      const { data: tracking, error: trackingError } = await supabase
        .from('tracking_sessions')
        .insert({
          pickup_id: pickupId,
          recycler_id: recyclerId,
          customer_id: pickup.customer_id,
          start_location: `${currentLat},${currentLng}`,
          destination_location: `${pickup.lat || 6.6734},${pickup.lng || -1.5714}`,
          status: 'en_route',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (trackingError) {
        res.status(500).json({
          success: false,
          error: 'Failed to start navigation'
        });
        return;
      }

      // Calculate route info
      const routeInfo = RecyclerNavigationController.calculateRouteInfo(
        currentLat,
        currentLng,
        pickup.lat || 6.6734,
        pickup.lng || -1.5714
      );

      res.json({
        success: true,
        data: {
          tracking,
          pickup,
          routeInfo,
          customer: pickup.customers
        },
        message: 'Navigation started successfully'
      });
    } catch (error) {
      console.error('Error starting navigation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start navigation'
      });
    }
  }

  /**
   * Update recycler's current location during navigation
   */
  static async updateLocation(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;
      const { pickupId, lat, lng, speed, heading } = req.body;

      if (!pickupId || !lat || !lng) {
        res.status(400).json({
          success: false,
          error: 'Pickup ID and location are required'
        });
        return;
      }

      // Update tracking session
      const { data: tracking, error: trackingError } = await supabase
        .from('tracking_sessions')
        .update({
          current_location: `${lat},${lng}`,
          current_speed: speed || 0,
          current_heading: heading || 0,
          last_updated: new Date().toISOString()
        })
        .eq('pickup_id', pickupId)
        .eq('recycler_id', recyclerId)
        .select()
        .single();

      if (trackingError) {
        res.status(500).json({
          success: false,
          error: 'Failed to update location'
        });
        return;
      }

      // Calculate updated ETA
      const eta = await RecyclerNavigationController.calculateETA(
        `${lat},${lng}`,
        tracking.destination_location
      );

      res.json({
        success: true,
        data: {
          tracking,
          eta
        },
        message: 'Location updated successfully'
      });
    } catch (error) {
      console.error('Error updating location:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update location'
      });
    }
  }

  /**
   * Mark arrival at pickup location
   */
  static async markArrival(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;
      const { pickupId } = req.body;

      if (!pickupId) {
        res.status(400).json({
          success: false,
          error: 'Pickup ID is required'
        });
        return;
      }

      // Update tracking session status
      const { data: tracking, error: trackingError } = await supabase
        .from('tracking_sessions')
        .update({
          status: 'arrived',
          updated_at: new Date().toISOString()
        })
        .eq('pickup_id', pickupId)
        .eq('recycler_id', recyclerId)
        .select()
        .single();

      if (trackingError) {
        res.status(500).json({
          success: false,
          error: 'Failed to mark arrival'
        });
        return;
      }

      // Update pickup status
      await supabase
        .from('waste_collections')
        .update({
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', pickupId)
        .eq('recycler_id', recyclerId);

      res.json({
        success: true,
        data: tracking,
        message: 'Arrival marked successfully'
      });
    } catch (error) {
      console.error('Error marking arrival:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark arrival'
      });
    }
  }

  /**
   * Get route information for pickup
   */
  static async getRouteInfo(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;
      const { pickupId } = req.params;
      const { currentLat, currentLng } = req.query;

      if (!currentLat || !currentLng) {
        res.status(400).json({
          success: false,
          error: 'Current location is required'
        });
        return;
      }

      // Get pickup details
      const { data: pickup, error: pickupError } = await supabase
        .from('waste_collections')
        .select(`
          *,
          customers!inner(id, username, phone)
        `)
        .eq('id', pickupId)
        .eq('recycler_id', recyclerId)
        .single();

      if (pickupError || !pickup) {
        res.status(404).json({
          success: false,
          error: 'Pickup not found'
        });
        return;
      }

      // Calculate route information
      const routeInfo = RecyclerNavigationController.calculateRouteInfo(
        parseFloat(currentLat as string),
        parseFloat(currentLng as string),
        pickup.lat || 6.6734,
        pickup.lng || -1.5714
      );

      res.json({
        success: true,
        data: {
          pickup,
          customer: pickup.customers,
          routeInfo
        },
        message: 'Route information retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting route info:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get route information'
      });
    }
  }

  /**
   * Cancel navigation
   */
  static async cancelNavigation(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;
      const { pickupId } = req.body;

      if (!pickupId) {
        res.status(400).json({
          success: false,
          error: 'Pickup ID is required'
        });
        return;
      }

      // Update tracking session
      const { data: tracking, error: trackingError } = await supabase
        .from('tracking_sessions')
        .update({
          status: 'cancelled',
          ended_at: new Date().toISOString()
        })
        .eq('pickup_id', pickupId)
        .eq('recycler_id', recyclerId)
        .select()
        .single();

      if (trackingError) {
        res.status(500).json({
          success: false,
          error: 'Failed to cancel navigation'
        });
        return;
      }

      // Update pickup status
      await supabase
        .from('waste_collections')
        .update({
          status: 'cancelled',
          recycler_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', pickupId)
        .eq('recycler_id', recyclerId);

      res.json({
        success: true,
        data: tracking,
        message: 'Navigation cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling navigation:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel navigation'
      });
    }
  }

  /**
   * Calculate route information
   */
  private static calculateRouteInfo(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number
  ): any {
    // Calculate distance using Haversine formula
    const R = 6371; // Earth's radius in km
    const dLat = (endLat - startLat) * Math.PI / 180;
    const dLng = (endLng - startLng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(startLat * Math.PI / 180) * Math.cos(endLat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    // Estimate travel time (assuming 20 km/h average speed)
    const estimatedMinutes = Math.round(distance * 3);

    return {
      distance: `${distance.toFixed(1)} km`,
      duration: `${estimatedMinutes} minutes`,
      eta: new Date(Date.now() + estimatedMinutes * 60000).toISOString(),
      steps: [
        {
          instruction: 'Head north on Main St',
          distance: '0.5 km',
          duration: '2 min'
        },
        {
          instruction: 'Turn right onto Oak Ave',
          distance: '1.2 km',
          duration: '4 min'
        },
        {
          instruction: 'Turn left onto Pickup St',
          distance: '0.8 km',
          duration: '2 min'
        }
      ]
    };
  }

  /**
   * Calculate ETA
   */
  private static async calculateETA(currentLocation: string, destinationLocation: string): Promise<any> {
    const [currentLat, currentLng] = currentLocation.split(',').map(Number);
    const [destLat, destLng] = destinationLocation.split(',').map(Number);

    // Check if coordinates are valid
    if (!currentLat || !currentLng || !destLat || !destLng) {
      return {
        distance: 'Unknown',
        duration: 'Unknown',
        estimatedArrival: null
      };
    }

    // Use Google Distance Matrix API for accurate ETA calculation
    const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
    
    if (googleApiKey) {
      try {
        const distanceMatrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${currentLat},${currentLng}&destinations=${destLat},${destLng}&key=${googleApiKey}`;
        const response = await fetch(distanceMatrixUrl);
        const data = await response.json() as any;
        
        if (data.status === 'OK' && data.rows.length > 0 && data.rows[0].elements.length > 0) {
          const element = data.rows[0].elements[0];
          
          if (element.status === 'OK') {
            const distance = element.distance.text;
            const duration = element.duration.text;
            const durationValue = element.duration.value; // seconds
            const estimatedArrival = new Date(Date.now() + durationValue * 1000).toISOString();
            
            return {
              distance,
              duration,
              estimatedArrival
            };
          }
        }
      } catch (error) {
        console.error('Google Distance Matrix API error:', error);
      }
    }

    // Fallback to mock calculation if API fails or key not configured
    const distance = Math.sqrt(
      Math.pow(destLat - currentLat, 2) + Math.pow(destLng - currentLng, 2)
    ) * 111; // Rough conversion to km

    const estimatedMinutes = Math.round(distance * 3); // Assume 20 km/h average speed

    return {
      distance: `${distance.toFixed(1)} km`,
      duration: `${estimatedMinutes} minutes`,
      estimatedArrival: new Date(Date.now() + estimatedMinutes * 60000).toISOString()
    };
  }
} 