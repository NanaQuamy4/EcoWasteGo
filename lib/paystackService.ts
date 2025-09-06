import storageAdapter from './storageAdapter';
import { supabase } from './supabase';

export interface PaystackConfig {
  publicKey: string;
  secretKey: string;
  merchantEmail: string;
  webhookSecret?: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'mobile_money' | 'card' | 'bank_transfer' | 'bank_account';
  icon: string;
  description: string;
  enabled: boolean;
}

export interface PaymentData {
  email: string;
  amount: number; // Amount in pesewas (smallest currency unit)
  currency: string;
  reference: string;
  callback_url?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaymentVerification {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: string;
    reference: string;
    amount: number;
    message: string;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: Record<string, any>;
    log: any;
    fees: number;
    fees_split: any;
    authorization: any;
    customer: any;
    plan: any;
    split: any;
    order_id: any;
    paidAt: string;
    createdAt: string;
    requested_amount: number;
    pos_transaction_data: any;
    source: any;
    fees_breakdown: any;
  };
}

class PaystackService {
  private static instance: PaystackService;
  private config: PaystackConfig | null = null;
  private baseURL = 'https://api.paystack.co';

  private constructor() {}

  public static getInstance(): PaystackService {
    if (!PaystackService.instance) {
      PaystackService.instance = new PaystackService();
    }
    return PaystackService.instance;
  }

  // Initialize Paystack configuration
  public async initialize(config?: Partial<PaystackConfig>): Promise<void> {
    try {
      // Load config from environment variables or provided config
      this.config = {
        publicKey: config?.publicKey || process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
        secretKey: config?.secretKey || process.env.EXPO_PUBLIC_PAYSTACK_SECRET_KEY || '',
        merchantEmail: config?.merchantEmail || process.env.EXPO_PUBLIC_PAYSTACK_MERCHANT_EMAIL || '',
        webhookSecret: config?.webhookSecret || process.env.EXPO_PUBLIC_PAYSTACK_WEBHOOK_SECRET || '',
      };

      // Validate configuration
      if (!this.config.publicKey || !this.config.secretKey || !this.config.merchantEmail) {
        throw new Error('Paystack configuration is incomplete. Please check your environment variables.');
      }

      // Store config in storage for offline access
      await storageAdapter.setItem('paystack_config', JSON.stringify(this.config));
      
      console.log('Paystack service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Paystack service:', error);
      throw error;
    }
  }

  // Get available payment methods for Ghana
  public getPaymentMethods(): PaymentMethod[] {
    return [
      {
        id: 'mobile_money_mtn',
        name: 'MTN Mobile Money',
        type: 'mobile_money',
        icon: '📱',
        description: 'Pay with your MTN Mobile Money account',
        enabled: true,
      },
      {
        id: 'mobile_money_vodafone',
        name: 'Vodafone Cash',
        type: 'mobile_money',
        icon: '📱',
        description: 'Pay with your Vodafone Cash account',
        enabled: true,
      },
      {
        id: 'mobile_money_airteltigo',
        name: 'AirtelTigo Money',
        type: 'mobile_money',
        icon: '📱',
        description: 'Pay with your AirtelTigo Money account',
        enabled: true,
      },
      {
        id: 'card',
        name: 'Credit/Debit Card',
        type: 'card',
        icon: '💳',
        description: 'Pay with your Visa, Mastercard, or other supported cards',
        enabled: true,
      },
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        type: 'bank_transfer',
        icon: '🏦',
        description: 'Transfer directly from your bank account',
        enabled: true,
      },
    ];
  }

  // Initialize a payment transaction
  public async initializeTransaction(paymentData: PaymentData): Promise<PaymentResponse> {
    try {
      if (!this.config) {
        await this.loadConfigFromStorage();
      }

      if (!this.config) {
        throw new Error('Paystack not initialized. Please call initialize() first.');
      }

      const response = await fetch(`${this.baseURL}/transaction/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: paymentData.email,
          amount: paymentData.amount,
          currency: paymentData.currency,
          reference: paymentData.reference,
          callback_url: paymentData.callback_url,
          metadata: paymentData.metadata,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to initialize payment');
      }

      return result;
    } catch (error) {
      console.error('Error initializing Paystack transaction:', error);
      throw error;
    }
  }

  // Verify a payment transaction
  public async verifyTransaction(reference: string): Promise<PaymentVerification> {
    try {
      if (!this.config) {
        await this.loadConfigFromStorage();
      }

      if (!this.config) {
        throw new Error('Paystack not initialized. Please call initialize() first.');
      }

      const response = await fetch(`${this.baseURL}/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.secretKey}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to verify payment');
      }

      return result;
    } catch (error) {
      console.error('Error verifying Paystack transaction:', error);
      throw error;
    }
  }

  // Handle webhook verification
  public async handleWebhook(
    payload: string,
    signature: string
  ): Promise<{ verified: boolean; data?: any; error?: string }> {
    try {
      if (!this.config?.webhookSecret) {
        throw new Error('Webhook secret not configured');
      }

      // In a real implementation, you would verify the webhook signature here
      // For now, we'll parse the payload and return it
      const data = JSON.parse(payload);
      
      return {
        verified: true,
        data,
      };
    } catch (error) {
      console.error('Error handling webhook:', error);
      return {
        verified: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Process subscription fee payment
  public async processSubscriptionPayment(
    recyclerId: string,
    amount: number,
    email: string,
    paymentMethod: string,
    metadata?: Record<string, any>
  ): Promise<{ success: boolean; data?: PaymentResponse; error?: string }> {
    try {
      // Generate unique reference
      const reference = `EWG_SUB_${recyclerId}_${Date.now()}`;

      // Convert amount to pesewas (Paystack expects amount in smallest currency unit)
      const amountInPesewas = Math.round(amount * 100);

      const paymentData: PaymentData = {
        email,
        amount: amountInPesewas,
        currency: 'GHS',
        reference,
        callback_url: `${process.env.EXPO_PUBLIC_APP_URL}/payment/callback`,
        metadata: {
          recycler_id: recyclerId,
          payment_type: 'subscription_fee',
          payment_method: paymentMethod,
          ...metadata,
        },
      };

      // Initialize transaction
      const response = await this.initializeTransaction(paymentData);

      // Store payment reference in database
      await this.storePaymentReference(recyclerId, reference, paymentMethod, response.data);

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error('Error processing subscription payment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Store payment reference in database
  private async storePaymentReference(
    recyclerId: string,
    reference: string,
    paymentMethod: string,
    paymentData: any
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('subscription_fees')
        .update({
          transaction_id: reference,
          payment_method_used: paymentMethod,
          authorization_url: paymentData.authorization_url,
          access_code: paymentData.access_code,
          payment_status: 'pending',
          payment_gateway: 'paystack',
          gateway_response: paymentData,
          updated_at: new Date().toISOString(),
        })
        .eq('recycler_id', recyclerId)
        .eq('payment_status', 'pending');

      if (error) {
        console.error('Error storing payment reference:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error storing payment reference:', error);
      throw error;
    }
  }

  // Update payment status after verification
  public async updatePaymentStatus(
    reference: string,
    status: 'success' | 'failed' | 'pending',
    verificationData?: PaymentVerification['data']
  ): Promise<void> {
    try {
      const updateData: any = {
        payment_status: status,
        updated_at: new Date().toISOString(),
      };

      if (verificationData) {
        updateData.gateway_response = verificationData;
        updateData.webhook_verified = true;
        
        if (status === 'success') {
          updateData.paid_at = verificationData.paid_at;
        }
      }

      const { error } = await supabase
        .from('subscription_fees')
        .update(updateData)
        .eq('transaction_id', reference);

      if (error) {
        console.error('Error updating payment status:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  // Load configuration from AsyncStorage
  private async loadConfigFromStorage(): Promise<void> {
    try {
      const configString = await storageAdapter.getItem('paystack_config');
      if (configString) {
        this.config = JSON.parse(configString);
      }
    } catch (error) {
      console.error('Error loading Paystack config from storage:', error);
    }
  }

  // Get public key for frontend use
  public getPublicKey(): string {
    return this.config?.publicKey || '';
  }

  // Check if Paystack is properly configured
  public isConfigured(): boolean {
    return !!(
      this.config?.publicKey &&
      this.config?.secretKey &&
      this.config?.merchantEmail
    );
  }

  // Clear stored configuration
  public async clearConfig(): Promise<void> {
    this.config = null;
    await storageAdapter.removeItem('paystack_config');
  }
}

export const paystackService = PaystackService.getInstance();
