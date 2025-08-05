import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class TextRecyclerController {
  /**
   * Get chat messages for a specific pickup
   */
  static async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { pickupId } = req.params;

      if (!pickupId) {
        res.status(400).json({
          success: false,
          error: 'Pickup ID is required'
        });
        return;
      }

      // Get pickup details to verify access
      const { data: pickup, error: pickupError } = await supabase
        .from('waste_collections')
        .select('*')
        .eq('id', pickupId)
        .or(`customer_id.eq.${userId},recycler_id.eq.${userId}`)
        .single();

      if (pickupError || !pickup) {
        res.status(404).json({
          success: false,
          error: 'Pickup not found or access denied'
        });
        return;
      }

      // Get messages for this pickup
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('pickup_id', pickupId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        res.status(500).json({
          success: false,
          error: 'Failed to get messages'
        });
        return;
      }

      res.json({
        success: true,
        data: messages,
        message: 'Messages retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get messages'
      });
    }
  }

  /**
   * Send a message to recycler
   */
  static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { pickupId } = req.params;
      const { message } = req.body;

      if (!pickupId || !message) {
        res.status(400).json({
          success: false,
          error: 'Pickup ID and message are required'
        });
        return;
      }

      // Get pickup details to verify access
      const { data: pickup, error: pickupError } = await supabase
        .from('waste_collections')
        .select('*')
        .eq('id', pickupId)
        .or(`customer_id.eq.${userId},recycler_id.eq.${userId}`)
        .single();

      if (pickupError || !pickup) {
        res.status(404).json({
          success: false,
          error: 'Pickup not found or access denied'
        });
        return;
      }

      // Determine sender type
      const senderType = pickup.customer_id === userId ? 'customer' : 'recycler';

      // Create message
      const { data: newMessage, error: messageError } = await supabase
        .from('chat_messages')
        .insert({
          pickup_id: pickupId,
          sender_id: userId,
          sender_type: senderType,
          message: message,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (messageError) {
        res.status(500).json({
          success: false,
          error: 'Failed to send message'
        });
        return;
      }

      // Create notification for the other party
      const recipientId = senderType === 'customer' ? pickup.recycler_id : pickup.customer_id;
      if (recipientId) {
        await supabase
          .from('notifications')
          .insert({
            user_id: recipientId,
            title: 'New Message',
            message: `You have a new message from ${senderType === 'customer' ? 'customer' : 'recycler'}`,
            type: 'info',
            action_url: `/text-recycler/${pickupId}`
          });
      }

      res.json({
        success: true,
        data: newMessage,
        message: 'Message sent successfully'
      });
    } catch (error) {
      console.error('Error sending message:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send message'
      });
    }
  }

  /**
   * Get recycler information for the pickup
   */
  static async getRecyclerInfo(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { pickupId } = req.params;

      if (!pickupId) {
        res.status(400).json({
          success: false,
          error: 'Pickup ID is required'
        });
        return;
      }

      // Get pickup with recycler info
      const { data: pickup, error: pickupError } = await supabase
        .from('waste_collections')
        .select(`
          *,
          recycler:users!waste_collections_recycler_id_fkey(
            id,
            username,
            phone,
            profile_image
          ),
          recycler_profiles!inner(
            business_name,
            rating,
            vehicle_type,
            experience_years
          )
        `)
        .eq('id', pickupId)
        .or(`customer_id.eq.${userId},recycler_id.eq.${userId}`)
        .single();

      if (pickupError || !pickup) {
        res.status(404).json({
          success: false,
          error: 'Pickup not found or access denied'
        });
        return;
      }

      if (!pickup.recycler_id) {
        res.status(404).json({
          success: false,
          error: 'No recycler assigned to this pickup'
        });
        return;
      }

      const recyclerInfo = {
        id: pickup.recycler.id,
        name: pickup.recycler.username,
        phone: pickup.recycler.phone,
        profileImage: pickup.recycler.profile_image,
        businessName: pickup.recycler_profiles?.[0]?.business_name,
        rating: pickup.recycler_profiles?.[0]?.rating || 0,
        truckType: pickup.recycler_profiles?.[0]?.vehicle_type,
        experienceYears: pickup.recycler_profiles?.[0]?.experience_years || 0
      };

      res.json({
        success: true,
        data: recyclerInfo,
        message: 'Recycler information retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting recycler info:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get recycler information'
      });
    }
  }

  /**
   * Get message suggestions
   */
  static async getMessageSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const suggestions = {
        sets: [
          [
            "When will you arrive?",
            "Can you call me when you're close?",
            "I'm not home, please call first",
            "I'll be ready in 10 minutes"
          ],
          [
            "How much will it cost?",
            "Do you accept mobile money?",
            "Can I pay with cash?",
            "What's included in the service?"
          ],
          [
            "I have more waste to collect",
            "Can you come back later?",
            "Is the location easy to find?",
            "I'll guide you to the location"
          ],
          [
            "Thank you for your service",
            "You're doing a great job",
            "I'll recommend you to others",
            "See you next time!"
          ]
        ]
      };

      res.json({
        success: true,
        data: suggestions,
        message: 'Message suggestions retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting message suggestions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get message suggestions'
      });
    }
  }
} 