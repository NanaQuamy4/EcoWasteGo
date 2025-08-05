import { Request, Response } from 'express';
import { supabase } from '../config/supabase';

export class RecyclerPaymentSummaryController {
  /**
   * Calculate payment for waste collection
   */
  static async calculatePayment(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;
      const { pickupId, wasteType, weight, additionalServices } = req.body;

      if (!pickupId || !wasteType || !weight) {
        res.status(400).json({
          success: false,
          error: 'Pickup ID, waste type, and weight are required'
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

      // Calculate payment based on waste type and weight
      const paymentCalculation = RecyclerPaymentSummaryController.calculatePaymentAmount(
        wasteType,
        parseFloat(weight),
        additionalServices || []
      );

      // Create or update payment record
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .upsert({
          collection_id: pickupId,
          amount: paymentCalculation.totalAmount,
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

      res.json({
        success: true,
        data: {
          payment,
          calculation: paymentCalculation,
          pickup
        },
        message: 'Payment calculated successfully'
      });
    } catch (error) {
      console.error('Error calculating payment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate payment'
      });
    }
  }

  /**
   * Send payment summary to user
   */
  static async sendToUser(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;
      const { pickupId, paymentId } = req.body;

      if (!pickupId || !paymentId) {
        res.status(400).json({
          success: false,
          error: 'Pickup ID and payment ID are required'
        });
        return;
      }

      // Get payment details
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select(`
          *,
          waste_collections!inner(
            id,
            customer_id,
            waste_type,
            weight,
            customers!inner(id, username, phone)
          )
        `)
        .eq('id', paymentId)
        .eq('collection_id', pickupId)
        .single();

      if (paymentError || !payment) {
        res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
        return;
      }

      // Update payment status to sent
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'processing',
          payment_date: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (updateError) {
        res.status(500).json({
          success: false,
          error: 'Failed to update payment status'
        });
        return;
      }

      // Create notification for user
      await supabase
        .from('notifications')
        .insert({
          user_id: payment.waste_collections.customer_id,
          title: 'Payment Summary Available',
          message: `Your payment summary for ${payment.waste_collections.waste_type} waste collection is ready. Amount: GHS ${payment.amount}`,
          type: 'info',
          action_url: `/payment-summary/${paymentId}`
        });

      res.json({
        success: true,
        data: {
          payment: updatedPayment,
          customer: payment.waste_collections.customers
        },
        message: 'Payment summary sent to user successfully'
      });
    } catch (error) {
      console.error('Error sending payment summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send payment summary'
      });
    }
  }

  /**
   * Edit payment summary
   */
  static async editPayment(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;
      const { paymentId, amount, notes } = req.body;

      if (!paymentId || !amount) {
        res.status(400).json({
          success: false,
          error: 'Payment ID and amount are required'
        });
        return;
      }

      // Update payment
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update({
          amount: parseFloat(amount),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (paymentError) {
        res.status(500).json({
          success: false,
          error: 'Failed to update payment'
        });
        return;
      }

      res.json({
        success: true,
        data: payment,
        message: 'Payment updated successfully'
      });
    } catch (error) {
      console.error('Error editing payment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to edit payment'
      });
    }
  }

  /**
   * Get payment summary for pickup
   */
  static async getPaymentSummary(req: Request, res: Response): Promise<void> {
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

      // Get payment details
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .select(`
          *,
          waste_collections!inner(
            id,
            customer_id,
            waste_type,
            weight,
            description,
            customers!inner(id, username, phone)
          )
        `)
        .eq('collection_id', pickupId)
        .single();

      if (paymentError) {
        res.status(404).json({
          success: false,
          error: 'Payment summary not found'
        });
        return;
      }

      // Calculate breakdown
      const breakdown = RecyclerPaymentSummaryController.calculateBreakdown(
        payment.waste_collections.waste_type,
        payment.waste_collections.weight
      );

      res.json({
        success: true,
        data: {
          payment,
          breakdown,
          customer: payment.waste_collections.customers,
          pickup: payment.waste_collections
        },
        message: 'Payment summary retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting payment summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get payment summary'
      });
    }
  }

  /**
   * Confirm payment received
   */
  static async confirmPayment(req: Request, res: Response): Promise<void> {
    try {
      const recyclerId = req.user?.id;
      const { paymentId } = req.body;

      if (!paymentId) {
        res.status(400).json({
          success: false,
          error: 'Payment ID is required'
        });
        return;
      }

      // Update payment status to completed
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          payment_date: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single();

      if (paymentError) {
        res.status(500).json({
          success: false,
          error: 'Failed to confirm payment'
        });
        return;
      }

      // Update pickup status
      await supabase
        .from('waste_collections')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.collection_id);

      res.json({
        success: true,
        data: payment,
        message: 'Payment confirmed successfully'
      });
    } catch (error) {
      console.error('Error confirming payment:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to confirm payment'
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

  /**
   * Calculate payment breakdown
   */
  private static calculateBreakdown(wasteType: string, weight: number): any {
    const calculation = RecyclerPaymentSummaryController.calculatePaymentAmount(wasteType, weight);
    
    return {
      items: [
        {
          description: `${wasteType.charAt(0).toUpperCase() + wasteType.slice(1)} Waste Collection`,
          quantity: `${weight} kg`,
          rate: `GHS ${calculation.breakdown.rate}/kg`,
          amount: `GHS ${calculation.baseAmount}`
        }
      ],
      subtotal: `GHS ${calculation.subtotal}`,
      tax: `GHS ${calculation.tax}`,
      total: `GHS ${calculation.totalAmount}`
    };
  }
} 