import crypto from 'crypto';
import axios from 'axios';

export interface TrustPayConfig {
  mid: string; // Merchant ID
  secretKey: string;
  baseUrl: string; // 'https://ib.trustpay.eu' for production, test URL for sandbox
}

export interface TrustPayPaymentData {
  orderId: string;
  amount: string; // Amount in smallest currency unit (cents for USD)
  currency: string; // Currency code (e.g., 'USD')
  description: string;
  email: string;
  successUrl: string;
  errorUrl: string;
  notificationUrl: string;
}

export interface TrustPayPaymentResponse {
  paymentUrl: string;
  orderId: string;
}

export interface TrustPayNotification {
  Reference: string; // orderId
  ResultCode: string; // '0' for success
  Amount: string;
  Currency: string;
  Hmac: string;
}

export class TrustPayService {
  private config: TrustPayConfig;

  constructor(config: TrustPayConfig) {
    this.config = config;
  }

  /**
   * Generate HMAC-SHA256 signature for TrustPay
   */
  private generateSignature(data: Record<string, any>): string {
    // Sort parameters alphabetically and create query string
    const sortedKeys = Object.keys(data).sort();
    const queryString = sortedKeys
      .map(key => `${key}=${encodeURIComponent(data[key])}`)
      .join('&');
    
    console.log('🔐 TrustPay signature data:', queryString);
    
    // Generate HMAC-SHA256
    const signature = crypto
      .createHmac('sha256', this.config.secretKey)
      .update(queryString)
      .digest('hex')
      .toUpperCase();
    
    console.log('🔐 TrustPay signature:', signature);
    return signature;
  }

  /**
   * Verify incoming notification signature
   */
  public verifyNotification(notification: TrustPayNotification): boolean {
    const { Hmac, ...dataToVerify } = notification;
    const expectedSignature = this.generateSignature(dataToVerify);
    
    console.log('🔐 Verifying TrustPay notification signature');
    console.log('📨 Received signature:', Hmac);
    console.log('🔍 Expected signature:', expectedSignature);
    
    return Hmac === expectedSignature;
  }

  /**
   * Create a TrustPay payment URL
   */
  public async createPayment(paymentData: TrustPayPaymentData): Promise<TrustPayPaymentResponse> {
    try {
      console.log('💳 Creating TrustPay payment for:', paymentData);

      // Prepare payment parameters
      const params = {
        mid: this.config.mid,
        amt: paymentData.amount,
        curr: paymentData.currency,
        ref: paymentData.orderId,
        dsc: paymentData.description,
        rurl: paymentData.successUrl,
        curl: paymentData.errorUrl,
        nurl: paymentData.notificationUrl,
        email: paymentData.email,
        typ: 'card', // Payment type: card for credit cards
      };

      // Generate signature
      const signature = this.generateSignature(params);
      
      // Create payment URL
      const baseUrl = this.config.baseUrl;
      const queryParams = new URLSearchParams({
        ...params,
        sig: signature,
      });
      
      const paymentUrl = `${baseUrl}/mapi/pay.aspx?${queryParams.toString()}`;
      
      console.log('✅ TrustPay payment URL created:', paymentUrl);
      
      return {
        paymentUrl,
        orderId: paymentData.orderId,
      };
    } catch (error) {
      console.error('❌ TrustPay payment creation failed:', error);
      throw new Error(`TrustPay payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check payment status (if needed)
   */
  public async getPaymentStatus(orderId: string): Promise<any> {
    try {
      console.log('🔍 Checking TrustPay payment status for order:', orderId);
      
      // TrustPay doesn't have a direct status API in the basic integration
      // Status is typically received via notifications
      // This method is for future enhancement if needed
      
      return {
        orderId,
        status: 'pending', // Would be determined by notification handling
      };
    } catch (error) {
      console.error('❌ TrustPay status check failed:', error);
      throw new Error(`TrustPay status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process successful payment notification
   */
  public async processSuccessfulPayment(notification: TrustPayNotification): Promise<boolean> {
    try {
      console.log('✅ Processing TrustPay successful payment:', notification);
      
      // Verify signature
      if (!this.verifyNotification(notification)) {
        console.error('❌ TrustPay notification signature verification failed');
        return false;
      }
      
      // Check if payment was successful
      if (notification.ResultCode !== '0') {
        console.error('❌ TrustPay payment failed with result code:', notification.ResultCode);
        return false;
      }
      
      console.log('✅ TrustPay payment verified successfully');
      return true;
    } catch (error) {
      console.error('❌ TrustPay payment processing failed:', error);
      return false;
    }
  }
}

// Factory function to create TrustPay service instance
export function createTrustPayService(): TrustPayService {
  const config: TrustPayConfig = {
    mid: process.env.TRUSTPAY_MID || '',
    secretKey: process.env.TRUSTPAY_SECRET_KEY || '',
    baseUrl: process.env.TRUSTPAY_BASE_URL || 'https://ib.trustpay.eu', // Production URL
  };

  if (!config.mid || !config.secretKey) {
    throw new Error('TrustPay configuration missing. Please set TRUSTPAY_MID and TRUSTPAY_SECRET_KEY environment variables.');
  }

  return new TrustPayService(config);
}
