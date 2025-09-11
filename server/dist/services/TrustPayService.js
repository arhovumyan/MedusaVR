import crypto from 'crypto';
export class TrustPayService {
    constructor(config) {
        this.config = config;
    }
    /**
     * Generate HMAC-SHA256 signature for TrustPay
     */
    generateSignature(data) {
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
    verifyNotification(notification) {
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
    async createPayment(paymentData) {
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
        }
        catch (error) {
            console.error('❌ TrustPay payment creation failed:', error);
            throw new Error(`TrustPay payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Check payment status (if needed)
     */
    async getPaymentStatus(orderId) {
        try {
            console.log('🔍 Checking TrustPay payment status for order:', orderId);
            // TrustPay doesn't have a direct status API in the basic integration
            // Status is typically received via notifications
            // This method is for future enhancement if needed
            return {
                orderId,
                status: 'pending', // Would be determined by notification handling
            };
        }
        catch (error) {
            console.error('❌ TrustPay status check failed:', error);
            throw new Error(`TrustPay status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Process successful payment notification
     */
    async processSuccessfulPayment(notification) {
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
        }
        catch (error) {
            console.error('❌ TrustPay payment processing failed:', error);
            return false;
        }
    }
}
// Factory function to create TrustPay service instance
export function createTrustPayService() {
    const config = {
        mid: process.env.TRUSTPAY_MID || '',
        secretKey: process.env.TRUSTPAY_SECRET_KEY || '',
        baseUrl: process.env.TRUSTPAY_BASE_URL || 'https://ib.trustpay.eu', // Production URL
    };
    if (!config.mid || !config.secretKey) {
        throw new Error('TrustPay configuration missing. Please set TRUSTPAY_MID and TRUSTPAY_SECRET_KEY environment variables.');
    }
    return new TrustPayService(config);
}
