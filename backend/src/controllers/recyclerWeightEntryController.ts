import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class RecyclerWeightEntryController {
  /**
   * Calculate bill based on weight and waste type
   */
  static async calculateBill(req: Request, res: Response): Promise<void> {
    try {
      const { weight, wasteType, additionalServices = [] } = req.body;

      if (!weight || !wasteType) {
        res.status(400).json({
          success: false,
          error: 'Weight and waste type are required'
        });
        return;
      }

      const calculation = RecyclerWeightEntryController.calculatePaymentAmount(
        wasteType,
        parseFloat(weight),
        additionalServices
      );

      res.json({
        success: true,
        data: calculation,
        message: 'Bill calculated successfully'
      });
    } catch (error) {
      console.error('Error calculating bill:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate bill'
      });
    }
  }

  /**
   * Submit weight entry and create payment
   */
  static async submitWeightEntry(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;
      const { pickupId, weight, wasteType, additionalServices = [], notes } = req.body;

      if (!pickupId || !weight || !wasteType) {
        res.status(400).json({
          success: false,
          error: 'Pickup ID, weight, and waste type are required'
        });
        return;
      }

      // Get pickup details
      const { data: pickup, error: pickupError } = await supabase
        .from('waste_collections')
        .select('*')
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

      // Calculate payment
      const calculation = RecyclerWeightEntryController.calculatePaymentAmount(
        wasteType,
        parseFloat(weight),
        additionalServices
      );

      // Update pickup with weight and notes
      const { data: updatedPickup, error: updateError } = await supabase
        .from('waste_collections')
        .update({
          weight: parseFloat(weight),
          pickup_notes: notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', pickupId)
        .select()
        .single();

      if (updateError) {
        res.status(500).json({
          success: false,
          error: 'Failed to update pickup'
        });
        return;
      }

      // Create payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          collection_id: pickupId,
          amount: calculation.totalAmount,
          currency: 'GHS',
          status: 'pending',
          payment_method: 'mobile_money',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (paymentError) {
        res.status(500).json({
          success: false,
          error: 'Failed to create payment record'
        });
        return;
      }

      // Create notification for customer
      await supabase
        .from('notifications')
        .insert({
          user_id: pickup.customer_id,
          title: 'Weight Entry Completed',
          message: `Your waste has been weighed: ${weight} kg. Payment summary is ready.`,
          type: 'info',
          action_url: `/payment-summary/${payment.id}`
        });

      res.json({
        success: true,
        data: {
          pickup: updatedPickup,
          payment,
          calculation
        },
        message: 'Weight entry submitted successfully'
      });
    } catch (error) {
      console.error('Error submitting weight entry:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit weight entry'
      });
    }
  }

  /**
   * Get current rates for different waste types
   */
  static async getRates(req: Request, res: Response): Promise<void> {
    try {
      const rates = {
        plastic: 2.5,
        paper: 2.0,
        glass: 3.0,
        metal: 4.0,
        organic: 1.5,
        electronics: 8.0,
        mixed: 2.0
      };

      const serviceCharges = {
        'rush_pickup': 5.0,
        'special_handling': 3.0,
        'extended_hours': 2.0,
        'weekend_pickup': 4.0
      };

      res.json({
        success: true,
        data: {
          baseRates: rates,
          serviceCharges,
          taxRate: 0.15 // 15% tax
        },
        message: 'Rates retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting rates:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get rates'
      });
    }
  }

  /**
   * Get weight entry details for a specific pickup
   */
  static async getWeightEntry(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;
      const { pickupId } = req.params;

      if (!pickupId) {
        res.status(400).json({
          success: false,
          error: 'Pickup ID is required'
        });
        return;
      }

      // Get pickup with payment details
      const { data: pickup, error } = await supabase
        .from('waste_collections')
        .select(`
          *,
          payments(*)
        `)
        .eq('id', pickupId)
        .eq('recycler_id', recyclerId)
        .single();

      if (error) {
        res.status(404).json({
          success: false,
          error: 'Weight entry not found'
        });
        return;
      }

      res.json({
        success: true,
        data: pickup,
        message: 'Weight entry retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting weight entry:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get weight entry'
      });
    }
  }

  /**
   * Calculate payment amount based on waste type and weight
   */
  private static calculatePaymentAmount(wasteType: string, weight: number, additionalServices: string[] = []): any {
    const baseRates = {
      plastic: 2.5,
      paper: 2.0,
      glass: 3.0,
      metal: 4.0,
      organic: 1.5,
      electronics: 8.0,
      mixed: 2.0
    };

    const rate = baseRates[wasteType as keyof typeof baseRates] || 2.0;
    const baseAmount = weight * rate;

    // Additional service charges
    const serviceCharges = {
      'rush_pickup': 5.0,
      'special_handling': 3.0,
      'extended_hours': 2.0,
      'weekend_pickup': 4.0
    };

    let additionalAmount = 0;
    additionalServices.forEach(service => {
      additionalAmount += serviceCharges[service as keyof typeof serviceCharges] || 0;
    });

    const subtotal = baseAmount + additionalAmount;
    const tax = subtotal * 0.15; // 15% tax
    const totalAmount = subtotal + tax;

    return {
      baseAmount: parseFloat(baseAmount.toFixed(2)),
      additionalAmount: parseFloat(additionalAmount.toFixed(2)),
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      breakdown: {
        wasteType,
        weight,
        rate,
        additionalServices
      }
    };
  }
} 