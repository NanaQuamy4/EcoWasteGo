import fetch from 'node-fetch';

interface MNotifyResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

interface SendSMSParams {
  recipient: string;
  message: string;
  senderId?: string;
}

export class SMSService {
  // Get environment variables dynamically to ensure they're loaded after dotenv.config()
  private static get apiKey() {
    return process.env.MNOTIFY_API_KEY || 'PBl6mS2sJUMaQLEfq8ulCqb32';
  }
  
  private static get baseUrl() {
    return process.env.MNOTIFY_API_BASE_URL || 'https://api.mnotify.com';
  }
  
  private static get defaultSenderId() {
    return process.env.MNOTIFY_SENDER_ID || 'EcoWasteGo';
  }
  
  private static get isEnabled() {
    // Use real mNotify API
    const enabled = true;
    console.log('🔧 SMS Service Configuration:', {
      SMS_VERIFICATION_ENABLED: process.env.SMS_VERIFICATION_ENABLED,
      NODE_ENV: process.env.NODE_ENV,
      hardcoded: enabled,
      isEnabled: enabled,
      apiKey: this.apiKey ? 'SET' : 'NOT_SET'
    });
    return enabled;
  }

  /**
   * Validate if phone number is in correct Ghanaian format
   */
  static validateGhanaianPhoneNumber(phoneNumber: string): boolean {
    const formatted = this.formatPhoneNumber(phoneNumber);
    const cleaned = formatted.replace(/\D/g, '');
    
    // Should be exactly 12 digits (233 + 9 digits)
    if (cleaned.length !== 12) {
      return false;
    }
    
    // Should start with 233 (Ghana country code)
    if (!cleaned.startsWith('233')) {
      return false;
    }
    
    // The remaining 9 digits should be valid Ghanaian mobile number
    const mobilePart = cleaned.substring(3);
    if (mobilePart.length !== 9) {
      return false;
    }
    
    return true;
  }

  /**
   * Send SMS via mNotify API
   */
  static async sendSMS({ recipient, message, senderId }: SendSMSParams): Promise<boolean> {
    try {
      // Check if SMS service is enabled
      if (!this.isEnabled) {
        console.log('SMS service disabled. Mock SMS would be sent to:', recipient);
        return false;
      }
      
      // Validate phone number
      const formattedRecipient = this.formatPhoneNumber(recipient);

      console.log('SMS Service - Phone number formatting details:', {
        original: recipient,
        formatted: formattedRecipient,
        length: formattedRecipient.replace(/\D/g, '').length
      });

      // Validate the formatted phone number
      if (!this.validateGhanaianPhoneNumber(formattedRecipient)) {
        console.error('Invalid Ghanaian phone number format:', formattedRecipient);
        return false;
      }

      console.log('✅ Phone number validation passed:', {
        original: recipient,
        formatted: formattedRecipient,
        validation: 'PASSED'
      });

      console.log('🚀 Attempting to send SMS via mNotify...');
      console.log('📱 SMS Details:', {
        recipient: formattedRecipient,
        messageLength: message.length,
        sender: senderId || this.defaultSenderId,
        apiKey: this.apiKey ? 'SET' : 'NOT_SET',
        baseUrl: this.baseUrl
      });

      const payload = {
        recipient: [formattedRecipient],
        sender: senderId || this.defaultSenderId,
        message: message,
        is_schedule: false,
        schedule_date: ''
      };

      console.log('📤 SMS Payload:', JSON.stringify(payload, null, 2));
      console.log('🔗 Making request to:', `${this.baseUrl}/api/sms/quick?key=${this.apiKey.substring(0, 10)}...`);
      console.log('🔑 Using API Key:', this.apiKey ? `${this.apiKey.substring(0, 10)}...` : 'NOT_SET');

      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        console.log('📡 Sending HTTP request to mNotify...');
        
        const response = await fetch(`${this.baseUrl}/api/sms/quick?key=${this.apiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        
        console.log('✅ HTTP request completed successfully');
        console.log('📊 Response Status:', response.status, response.statusText);
        console.log('📋 Response Headers:', Object.fromEntries(response.headers.entries()));

        const responseText = await response.text();
        console.log('📄 Raw Response Body:', responseText);

        let result: MNotifyResponse;
        try {
          result = JSON.parse(responseText);
          console.log('🔍 Parsed JSON Response:', result);
        } catch (parseError) {
          console.error('❌ Failed to parse response as JSON:', parseError);
          console.error('📄 Raw response was:', responseText);
          
          // For development, fall back to mock SMS if parsing fails
          if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
            console.log('🔄 Falling back to mock SMS due to JSON parsing error...');
            return this.sendMockSMS(formattedRecipient, message);
          }
          
          return false;
        }

        if (result.success) {
          console.log('🎉 SMS sent successfully via mNotify:', result.message);
          return true;
        } else {
          console.error('❌ mNotify SMS failed:', result.error || result.message);
          
          // For development, fall back to mock SMS if mNotify fails
          if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
            console.log('🔄 Falling back to mock SMS due to mNotify failure...');
            return this.sendMockSMS(formattedRecipient, message);
          }
          
          return false;
        }
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.error('💥 Fetch request failed:', fetchError);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error('⏰ Request timed out after 30 seconds');
        } else if (fetchError instanceof Error && fetchError.message.includes('ENOTFOUND')) {
          console.error('🌐 DNS resolution failed - mNotify server not reachable');
        } else if (fetchError instanceof Error && fetchError.message.includes('ECONNREFUSED')) {
          console.error('🚫 Connection refused by mNotify server');
        } else if (fetchError instanceof Error && fetchError.message.includes('ETIMEDOUT')) {
          console.error('⏰ Connection to mNotify timed out');
        } else {
          console.error('❓ Unknown fetch error:', fetchError);
        }
        
        // For development, fall back to mock SMS if fetch fails
        if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
          console.log('🔄 Falling back to mock SMS due to fetch error...');
          return this.sendMockSMS(formattedRecipient, message);
        }
        
        return false;
      }
      
    } catch (error) {
      console.error('💥 SMS Service Error Details:', {
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorName: error instanceof Error ? error.name : 'Unknown',
        errorStack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('mNotify SMS request timed out after 30 seconds');
      } else if (error instanceof Error && error.message.includes('ENOTFOUND')) {
        console.error('mNotify API server not reachable - DNS resolution failed');
      } else if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        console.error('mNotify API server refused connection');
      } else {
        console.error('Error sending SMS via mNotify:', error);
      }
      return false;
    }
  }

  /**
   * Send mock SMS for development purposes
   */
  private static async sendMockSMS(recipient: string, message: string): Promise<boolean> {
    try {
      console.log('�� Mock SMS Service (Development Mode)');
      console.log('📞 To:', recipient);
      console.log('💬 Message:', message);
      console.log('✅ Mock SMS sent successfully');
      
      // Simulate a small delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } catch (error) {
      console.error('Error sending mock SMS:', error);
      return false;
    }
  }

  /**
   * Send SMS verification code
   */
  static async sendVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
    const message = `Your EcoWasteGo verification code is: ${code}. This code expires in 10 minutes. Do not share this code with anyone.`;
    
    return this.sendSMS({
      recipient: phoneNumber,
      message: message,
      senderId: this.defaultSenderId
    });
  }

  /**
   * Send pickup notification SMS
   */
  static async sendPickupNotification(phoneNumber: string, pickupDetails: {
    customerName: string;
    pickupTime: string;
    location: string;
  }): Promise<boolean> {
    const message = `EcoWasteGo: New pickup request from ${pickupDetails.customerName} at ${pickupDetails.location} on ${pickupDetails.pickupTime}. Check your app for details.`;
    
    return this.sendSMS({
      recipient: phoneNumber,
      message: message
    });
  }

  /**
   * Send arrival notification SMS
   */
  static async sendArrivalNotification(phoneNumber: string, recyclerName: string): Promise<boolean> {
    const message = `EcoWasteGo: ${recyclerName} has arrived for your waste pickup. Please prepare your waste for collection.`;
    
    return this.sendSMS({
      recipient: phoneNumber,
      message: message
    });
  }

  /**
   * Send pickup completion SMS
   */
  static async sendPickupCompletionNotification(phoneNumber: string, details: {
    weight: number;
    amount: number;
  }): Promise<boolean> {
    const message = `EcoWasteGo: Pickup completed! Weight: ${details.weight}kg, Amount: GHS ${details.amount.toFixed(2)}. Thank you for recycling!`;
    
    return this.sendSMS({
      recipient: phoneNumber,
      message: message
    });
  }

  /**
   * Format phone number to international format
   */
  static formatPhoneNumber(phoneNumber: string): string {
    // Remove any non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // If it's exactly 9 digits (like 546732719), add Ghana country code
    if (cleaned.length === 9) {
      cleaned = '233' + cleaned;
    }
    
    // If it starts with 0 and is a Ghanaian number, replace with +233
    if (cleaned.startsWith('0') && cleaned.length === 10) {
      cleaned = '233' + cleaned.substring(1);
    }
    
    // If it doesn't start with a country code, assume Ghana (+233)
    if (!cleaned.startsWith('233') && cleaned.length === 9) {
      cleaned = '233' + cleaned;
    }
    
    // Handle other common formats for Ghana
    if (!cleaned.startsWith('233') && (cleaned.length === 8 || cleaned.length === 10)) {
      // Some numbers might be 8 digits (missing leading 0) or 10 digits with 0
      if (cleaned.length === 10 && cleaned.startsWith('0')) {
        cleaned = '233' + cleaned.substring(1);
      } else if (cleaned.length === 8) {
        cleaned = '233' + cleaned;
      }
    }
    
    // Add + if not present
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    // Log the formatting for debugging
    console.log(`Phone number formatting: ${phoneNumber} -> ${cleaned}`);
    
    return cleaned;
  }

  /**
   * Generate 6-digit verification code
   */
  static generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Check SMS service status
   */
  static getServiceStatus(): {
    enabled: boolean;
    configured: boolean;
    provider: string;
  } {
    return {
      enabled: this.isEnabled,
      configured: !!this.apiKey,
      provider: 'mNotify'
    };
  }

  /**
   * Test method to verify SMS service configuration
   */
  static async testConfiguration(): Promise<{ success: boolean; details: any }> {
    try {
      console.log('🧪 Testing SMS Service Configuration...');
      
      const config = {
        enabled: this.isEnabled,
        apiKey: this.apiKey ? 'SET' : 'NOT_SET',
        baseUrl: this.baseUrl,
        senderId: this.defaultSenderId
      };
      
      console.log('📋 SMS Service Config:', config);
      
      if (!this.isEnabled) {
        return { success: false, details: { error: 'SMS service is disabled', config } };
      }
      
      if (!this.apiKey) {
        return { success: false, details: { error: 'API key not configured', config } };
      }
      
      // Test phone number formatting
      const testPhone = '546732719';
      const formattedPhone = this.formatPhoneNumber(testPhone);
      console.log('📱 Phone number formatting test:', {
        original: testPhone,
        formatted: formattedPhone,
        valid: this.validateGhanaianPhoneNumber(formattedPhone)
      });
      
      // Test verification code generation
      const testCode = this.generateVerificationCode();
      console.log('🔐 Verification code generation test:', {
        code: testCode,
        length: testCode.length,
        isNumeric: /^\d+$/.test(testCode)
      });
      
      return { 
        success: true, 
        details: { 
          config,
          phoneFormatting: {
            original: testPhone,
            formatted: formattedPhone,
            valid: this.validateGhanaianPhoneNumber(formattedPhone)
          },
          codeGeneration: {
            code: testCode,
            length: testCode.length,
            isNumeric: /^\d+$/.test(testCode)
          }
        } 
      };
      
    } catch (error) {
      console.error('💥 SMS Service Test Error:', error);
      return { 
        success: false, 
        details: { 
          error: error instanceof Error ? error.message : 'Unknown error',
          config: {
            enabled: this.isEnabled,
            apiKey: this.apiKey ? 'SET' : 'NOT_SET',
            baseUrl: this.baseUrl,
            senderId: this.defaultSenderId
          }
        } 
      };
    }
  }
}

export default SMSService;
