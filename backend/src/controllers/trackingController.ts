import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class TrackingController {
  /**
   * Start location tracking for a pickup
   */
  static async startTracking(req: Request, res: Response): Promise<void> {
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
        .select('*, customers!inner(*)')
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

      // Create tracking session
      const { data: tracking, error: trackingError } = await supabase
        .from('tracking_sessions')
        .insert({
          pickup_id: pickupId,
          recycler_id: recyclerId,
          customer_id: pickup.customer_id,
          start_location: `${currentLat},${currentLng}`,
          destination_location: `${pickup.lat},${pickup.lng}`,
          status: 'en_route',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (trackingError) {
        res.status(500).json({
          success: false,
          error: 'Failed to start tracking'
        });
        return;
      }

      res.json({
        success: true,
        data: tracking,
        message: 'Tracking started successfully'
      });
    } catch (error) {
      console.error('Error starting tracking:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to start tracking'
      });
    }
  }

  /**
   * Update recycler's current location
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

      // Update tracking session with new location
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

      // Calculate ETA
      const eta = await TrackingController.calculateETA(
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
   * Get real-time tracking data for a pickup
   */
  static async getTrackingData(req: Request, res: Response): Promise<void> {
    try {
      const { pickupId } = req.params;
      const userId = req.user?.id;
      const userRole = req.user?.role;

      let query = supabase
        .from('tracking_sessions')
        .select(`
          *,
          recyclers:recycler_id(id, username, phone, profile_image),
          customers:customer_id(id, username, phone)
        `)
        .eq('pickup_id', pickupId);

      // Ensure user can only access their own tracking data
      if (userRole === 'customer') {
        query = query.eq('customer_id', userId);
      } else if (userRole === 'recycler') {
        query = query.eq('recycler_id', userId);
      }

      const { data: tracking, error } = await query.single();

      if (error || !tracking) {
        res.status(404).json({
          success: false,
          error: 'Tracking data not found'
        });
        return;
      }

      // Calculate ETA if tracking is active
      let eta = null;
      if (tracking.status === 'en_route' && tracking.current_location) {
        eta = await TrackingController.calculateETA(
          tracking.current_location,
          tracking.destination_location
        );
      }

      res.json({
        success: true,
        data: {
          tracking,
          eta
        },
        message: 'Tracking data retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting tracking data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get tracking data'
      });
    }
  }

  /**
   * Get estimated arrival time
   */
  static async getETA(req: Request, res: Response): Promise<void> {
    try {
      const { pickupId } = req.params;

      const { data: tracking, error } = await supabase
        .from('tracking_sessions')
        .select('current_location, destination_location')
        .eq('pickup_id', pickupId)
        .single();

      if (error || !tracking) {
        res.status(404).json({
          success: false,
          error: 'Tracking session not found'
        });
        return;
      }

      const eta = await TrackingController.calculateETA(
        tracking.current_location,
        tracking.destination_location
      );

      res.json({
        success: true,
        data: eta,
        message: 'ETA calculated successfully'
      });
    } catch (error) {
      console.error('Error calculating ETA:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate ETA'
      });
    }
  }

  /**
   * Get optimized route to pickup location
   */
  static async getRoute(req: Request, res: Response): Promise<void> {
    try {
      const { pickupId } = req.params;
      const { currentLat, currentLng } = req.body;

      if (!currentLat || !currentLng) {
        res.status(400).json({
          success: false,
          error: 'Current location is required'
        });
        return;
      }

      // Get pickup destination
      const { data: pickup, error } = await supabase
        .from('waste_collections')
        .select('lat, lng, address')
        .eq('id', pickupId)
        .single();

      if (error || !pickup) {
        res.status(404).json({
          success: false,
          error: 'Pickup not found'
        });
        return;
      }

      // TODO: When Google API key is ready, get actual route from Google Directions API
      // const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
      // const response = await fetch(
      //   `https://maps.googleapis.com/maps/api/directions/json?origin=${currentLat},${currentLng}&destination=${pickup.lat},${pickup.lng}&key=${googleApiKey}`
      // );

      // Mock route data for now
      const mockRoute = {
        distance: '2.5 km',
        duration: '8 minutes',
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
        ],
        polyline: 'mock_polyline_data'
      };

      res.json({
        success: true,
        data: mockRoute,
        message: 'Route retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get route'
      });
    }
  }

  /**
   * Update tracking status
   */
  static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;
      const { pickupId } = req.params;
      const { status } = req.body;

      if (!status) {
        res.status(400).json({
          success: false,
          error: 'Status is required'
        });
        return;
      }

      const validStatuses = ['en_route', 'arrived', 'picking_up', 'completed'];
      if (!validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: 'Invalid status'
        });
        return;
      }

      const { data: tracking, error } = await supabase
        .from('tracking_sessions')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('pickup_id', pickupId)
        .eq('recycler_id', recyclerId)
        .select()
        .single();

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to update status'
        });
        return;
      }

      res.json({
        success: true,
        data: tracking,
        message: 'Status updated successfully'
      });
    } catch (error) {
      console.error('Error updating status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update status'
      });
    }
  }

  /**
   * Stop location tracking
   */
  static async stopTracking(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;
      const { pickupId } = req.params;

      const { data: tracking, error } = await supabase
        .from('tracking_sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('pickup_id', pickupId)
        .eq('recycler_id', recyclerId)
        .select()
        .single();

      if (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to stop tracking'
        });
        return;
      }

      res.json({
        success: true,
        data: tracking,
        message: 'Tracking stopped successfully'
      });
    } catch (error) {
      console.error('Error stopping tracking:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to stop tracking'
      });
    }
  }

  /**
   * Calculate ETA between two points
   */
  private static async calculateETA(currentLocation: string, destinationLocation: string): Promise<any> {
    try {
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

      // TODO: When Google API key is ready, use Google Distance Matrix API
      // const googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
      // const response = await fetch(
      //   `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${currentLat},${currentLng}&destinations=${destLat},${destLng}&key=${googleApiKey}`
      // );

      // Mock ETA calculation for now
      const distance = Math.sqrt(
        Math.pow(destLat - currentLat, 2) + Math.pow(destLng - currentLng, 2)
      ) * 111; // Rough conversion to km

      const estimatedMinutes = Math.round(distance * 3); // Assume 20 km/h average speed

      return {
        distance: `${distance.toFixed(1)} km`,
        duration: `${estimatedMinutes} minutes`,
        estimatedArrival: new Date(Date.now() + estimatedMinutes * 60000).toISOString()
      };
    } catch (error) {
      console.error('Error calculating ETA:', error);
      return {
        distance: 'Unknown',
        duration: 'Unknown',
        estimatedArrival: null
      };
    }
  }
} 