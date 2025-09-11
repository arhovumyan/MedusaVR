import axios from 'axios';
import crypto from 'crypto';
export class NOWPaymentsService {
    constructor(config) {
        // Use sandbox if available and we're in sandbox mode, otherwise use production
        const useSandbox = config.environment === 'sandbox' && config.sandboxApiKey;
        this.apiUrl = useSandbox
            ? 'https://api-sandbox.nowpayments.io/v1'
            : 'https://api.nowpayments.io/v1';
        this.apiKey = useSandbox
            ? config.sandboxApiKey
            : config.apiKey;
        console.log(`🪙 NOWPayments initialized in ${useSandbox ? 'sandbox' : 'production'} mode`);
    }
    getHeaders() {
        return {
            'x-api-key': this.apiKey,
            'Content-Type': 'application/json',
        };
    }
    /**
     * Get list of available cryptocurrencies
     */
    async getAvailableCurrencies() {
        try {
            // For development without API key, return mock data
            if (!this.apiKey || this.apiKey === 'your_sandbox_api_key_here') {
                console.log('🔧 NOWPayments: Using mock currencies for development');
                return ['btc', 'eth', 'usdt', 'usdc', 'ltc', 'doge', 'bnb', 'ada', 'dot', 'sol'];
            }
            const response = await axios.get(`${this.apiUrl}/currencies`, {
                headers: this.getHeaders(),
            });
            return response.data.currencies;
        }
        catch (error) {
            console.error('Error fetching available currencies:', error);
            // Fallback to mock data
            console.log('🔧 NOWPayments: Falling back to mock currencies');
            return ['btc', 'eth', 'usdt', 'usdc', 'ltc', 'doge', 'bnb', 'ada', 'dot', 'sol'];
        }
    }
    /**
     * Get estimated exchange rate
     */
    async getExchangeRate(fromCurrency, toCurrency, amount) {
        try {
            const response = await axios.get(`${this.apiUrl}/estimate`, {
                headers: this.getHeaders(),
                params: {
                    amount,
                    currency_from: fromCurrency,
                    currency_to: toCurrency,
                },
            });
            return response.data.estimated_amount;
        }
        catch (error) {
            console.error('Error fetching exchange rate:', error);
            throw error;
        }
    }
    /**
     * Create a payment
     */
    async createPayment(paymentData) {
        try {
            console.log('🚀 NOWPayments: Creating payment with API key:', this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'none');
            console.log('🚀 NOWPayments: API URL:', this.apiUrl);
            console.log('🚀 NOWPayments: Payment data:', paymentData);
            const response = await axios.post(`${this.apiUrl}/payment`, paymentData, {
                headers: this.getHeaders(),
            });
            console.log('✅ NOWPayments: Real payment created:', response.data);
            return response.data;
        }
        catch (error) {
            console.error('❌ NOWPayments: Error creating payment:', error);
            // Only fall back to mock if there's no API key at all
            if (!this.apiKey) {
                console.log('🔧 NOWPayments: No API key, creating mock payment for development');
                const mockPayment = {
                    payment_id: `mock_payment_${Date.now()}`,
                    payment_status: 'waiting',
                    pay_address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Mock Bitcoin address
                    price_amount: paymentData.price_amount,
                    price_currency: paymentData.price_currency,
                    pay_amount: paymentData.price_amount * 0.000025, // Mock conversion rate
                    pay_currency: paymentData.pay_currency || 'btc',
                    order_id: paymentData.order_id,
                    order_description: paymentData.order_description,
                    payment_url: `https://payments.nowpayments.io/payment/?iid=mock_payment_${Date.now()}`,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                return mockPayment;
            }
            // Re-throw the error if we have an API key but it failed
            throw error;
        }
    }
    /**
     * Get payment status
     */
    async getPaymentStatus(paymentId) {
        try {
            const response = await axios.get(`${this.apiUrl}/payment/${paymentId}`, {
                headers: this.getHeaders(),
            });
            return response.data;
        }
        catch (error) {
            console.error('Error fetching payment status:', error);
            throw error;
        }
    }
    /**
     * Verify IPN signature
     */
    verifyIPN(receivedData, receivedSignature, ipnSecret) {
        const data = JSON.stringify(receivedData);
        const expectedSignature = crypto
            .createHmac('sha512', ipnSecret)
            .update(data)
            .digest('hex');
        return receivedSignature === expectedSignature;
    }
    /**
     * Generate payment URL for direct redirect
     */
    generatePaymentUrl(payment) {
        return payment.payment_url;
    }
    /**
     * Check if payment is completed
     */
    isPaymentCompleted(status) {
        return ['finished', 'partially_paid'].includes(status.toLowerCase());
    }
    /**
     * Check if payment failed
     */
    isPaymentFailed(status) {
        return ['failed', 'refunded', 'expired'].includes(status.toLowerCase());
    }
}
// Coin package mapping
export const coinPackageMapping = {
    'test_pack_100': { coins: 100, price: 1.00 },
    'starter_pack_500': { coins: 500, price: 4.99 },
    'value_pack_1200': { coins: 1200, price: 9.99 },
    'mega_pack_2500': { coins: 2500, price: 19.99 },
};
