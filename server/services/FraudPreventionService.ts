/**
 * Fraud Prevention Service
 * Advanced fraud detection and prevention for payment processing compliance
 */

interface FraudCheckResult {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  allowed: boolean;
  reasons: string[];
  recommendations: string[];
  chargebackRisk: number; // 0-1 scale
  requiresManualReview: boolean;
}

interface TransactionPattern {
  userId: string;
  amount: number;
  timestamp: Date;
  ipAddress: string;
  country: string;
  paymentMethod: string;
}

export class FraudPreventionService {

  // Risk factors for fraud detection
  private static readonly HIGH_RISK_COUNTRIES = [
    // Countries with high fraud rates
    'NG', 'GH', 'CI', 'ML', 'BF', 'RO', 'BG', 'AL', 'MD'
  ];

  private static readonly SUSPICIOUS_EMAIL_PATTERNS = [
    '@guerrillamail.com',
    '@10minutemail.com',
    '@tempmail.org',
    '@mailinator.com',
    '+test',
    '+fraud',
    '@yopmail.com'
  ];

  /**
   * Comprehensive fraud analysis for new transactions
   */
  static async analyzeTransaction(transaction: {
    userId: string;
    amount: number;
    email: string;
    ipAddress: string;
    country: string;
    paymentMethod: string;
    userAgent: string;
  }): Promise<FraudCheckResult> {
    
    console.log(`🔍 Analyzing transaction for fraud risk: User ${transaction.userId}, Amount $${transaction.amount}`);

    const reasons: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;
    let chargebackRisk = 0;

    // 1. Geographic Risk Analysis
    const geoRisk = this.analyzeGeographicRisk(transaction.country, transaction.ipAddress);
    riskScore += geoRisk.score;
    if (geoRisk.reasons.length > 0) {
      reasons.push(...geoRisk.reasons);
    }

    // 2. Email Analysis
    const emailRisk = this.analyzeEmailRisk(transaction.email);
    riskScore += emailRisk.score;
    if (emailRisk.reasons.length > 0) {
      reasons.push(...emailRisk.reasons);
    }

    // 3. Transaction Amount Analysis
    const amountRisk = this.analyzeAmountRisk(transaction.amount);
    riskScore += amountRisk.score;
    chargebackRisk += amountRisk.chargebackRisk;
    if (amountRisk.reasons.length > 0) {
      reasons.push(...amountRisk.reasons);
    }

    // 4. Payment Method Risk
    const paymentRisk = this.analyzePaymentMethodRisk(transaction.paymentMethod);
    riskScore += paymentRisk.score;
    chargebackRisk += paymentRisk.chargebackRisk;
    if (paymentRisk.reasons.length > 0) {
      reasons.push(...paymentRisk.reasons);
    }

    // 5. User Behavior Analysis
    const behaviorRisk = await this.analyzeUserBehavior(transaction.userId);
    riskScore += behaviorRisk.score;
    if (behaviorRisk.reasons.length > 0) {
      reasons.push(...behaviorRisk.reasons);
    }

    // 6. Velocity Checks (multiple transactions in short time)
    const velocityRisk = await this.analyzeTransactionVelocity(transaction.userId, transaction.ipAddress);
    riskScore += velocityRisk.score;
    if (velocityRisk.reasons.length > 0) {
      reasons.push(...velocityRisk.reasons);
    }

    // Determine risk level and actions
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    let allowed = true;
    let requiresManualReview = false;

    if (riskScore >= 80) {
      riskLevel = 'CRITICAL';
      allowed = false;
      recommendations.push('Block transaction immediately');
      recommendations.push('Flag user account for investigation');
    } else if (riskScore >= 60) {
      riskLevel = 'HIGH';
      allowed = false;
      requiresManualReview = true;
      recommendations.push('Require manual review before processing');
      recommendations.push('Request additional verification');
    } else if (riskScore >= 30) {
      riskLevel = 'MEDIUM';
      allowed = true;
      requiresManualReview = true;
      recommendations.push('Monitor closely for chargeback patterns');
      recommendations.push('Consider additional authentication');
    } else {
      riskLevel = 'LOW';
      allowed = true;
      recommendations.push('Proceed with normal processing');
    }

    // Calculate final chargeback risk
    chargebackRisk = Math.min(chargebackRisk + (riskScore / 100) * 0.3, 1.0);

    const result: FraudCheckResult = {
      riskLevel,
      allowed,
      reasons,
      recommendations,
      chargebackRisk,
      requiresManualReview
    };

    console.log(`📊 Fraud analysis complete: Risk Level ${riskLevel}, Score ${riskScore}, Allowed: ${allowed}`);
    
    return result;
  }

  /**
   * Analyze geographic risk factors
   */
  private static analyzeGeographicRisk(country: string, ipAddress: string): {
    score: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let score = 0;

    // High-risk countries
    if (this.HIGH_RISK_COUNTRIES.includes(country)) {
      score += 25;
      reasons.push(`Transaction from high-risk country: ${country}`);
    }

    // VPN/Proxy detection would go here
    // For now, we'll add a placeholder
    if (this.isLikelyVPN(ipAddress)) {
      score += 15;
      reasons.push('Potential VPN or proxy usage detected');
    }

    return { score, reasons };
  }

  /**
   * Analyze email risk factors
   */
  private static analyzeEmailRisk(email: string): {
    score: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let score = 0;

    // Check for suspicious email patterns
    for (const pattern of this.SUSPICIOUS_EMAIL_PATTERNS) {
      if (email.toLowerCase().includes(pattern)) {
        score += 30;
        reasons.push(`Suspicious email domain or pattern: ${pattern}`);
        break;
      }
    }

    // Check for obvious fake patterns
    if (this.isObviousFakeEmail(email)) {
      score += 20;
      reasons.push('Email appears to be fake or test email');
    }

    return { score, reasons };
  }

  /**
   * Analyze transaction amount risk
   */
  private static analyzeAmountRisk(amount: number): {
    score: number;
    reasons: string[];
    chargebackRisk: number;
  } {
    const reasons: string[] = [];
    let score = 0;
    let chargebackRisk = 0;

    // Very high amounts are suspicious
    if (amount > 500) {
      score += 20;
      chargebackRisk += 0.2;
      reasons.push(`High transaction amount: $${amount}`);
    }

    // Very low amounts might be testing
    if (amount < 1) {
      score += 10;
      reasons.push(`Suspicious low amount: $${amount}`);
    }

    // Common fraud test amounts
    const fraudTestAmounts = [1.00, 2.00, 5.00, 10.00];
    if (fraudTestAmounts.includes(amount)) {
      score += 15;
      reasons.push(`Amount matches common fraud testing pattern: $${amount}`);
    }

    return { score, reasons, chargebackRisk };
  }

  /**
   * Analyze payment method risk
   */
  private static analyzePaymentMethodRisk(paymentMethod: string): {
    score: number;
    reasons: string[];
    chargebackRisk: number;
  } {
    const reasons: string[] = [];
    let score = 0;
    let chargebackRisk = 0;

    // Credit cards have higher chargeback risk than other methods
    if (paymentMethod.toLowerCase().includes('credit')) {
      chargebackRisk += 0.1;
    }

    // Prepaid cards are higher risk
    if (paymentMethod.toLowerCase().includes('prepaid')) {
      score += 15;
      chargebackRisk += 0.15;
      reasons.push('Prepaid card usage detected (higher fraud risk)');
    }

    return { score, reasons, chargebackRisk };
  }

  /**
   * Analyze user behavior patterns
   */
  private static async analyzeUserBehavior(userId: string): Promise<{
    score: number;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let score = 0;

    // In production, this would analyze:
    // - Account age (very new accounts are riskier)
    // - Previous transaction history
    // - Failed payment attempts
    // - Account verification status
    // - Login patterns

    // Placeholder logic
    const accountAge = await this.getAccountAge(userId);
    if (accountAge < 24) { // Less than 24 hours old
      score += 20;
      reasons.push('Very new account (less than 24 hours old)');
    }

    return { score, reasons };
  }

  /**
   * Analyze transaction velocity (frequency)
   */
  private static async analyzeTransactionVelocity(userId: string, ipAddress: string): Promise<{
    score: number;
    reasons: string[];
  }> {
    const reasons: string[] = [];
    let score = 0;

    // Check for multiple transactions in short time period
    const recentTransactions = await this.getRecentTransactions(userId, ipAddress, 60); // Last 60 minutes

    if (recentTransactions.length > 5) {
      score += 30;
      reasons.push(`High transaction velocity: ${recentTransactions.length} transactions in last hour`);
    } else if (recentTransactions.length > 2) {
      score += 10;
      reasons.push(`Moderate transaction velocity: ${recentTransactions.length} transactions in last hour`);
    }

    return { score, reasons };
  }

  /**
   * Check if IP address is likely a VPN or proxy
   */
  private static isLikelyVPN(ipAddress: string): boolean {
    // In production, this would use services like:
    // - MaxMind GeoIP
    // - IPQualityScore
    // - FraudLabs Pro
    // For now, return false
    return false;
  }

  /**
   * Check if email appears to be fake
   */
  private static isObviousFakeEmail(email: string): boolean {
    const fakePatterns = [
      /test.*@/,
      /fake.*@/,
      /fraud.*@/,
      /asdf.*@/,
      /^a+@/,
      /1234.*@/
    ];

    return fakePatterns.some(pattern => pattern.test(email.toLowerCase()));
  }

  /**
   * Get account age in hours
   */
  private static async getAccountAge(userId: string): Promise<number> {
    // In production, query user creation date from database
    // For now, return a placeholder
    return 168; // 1 week
  }

  /**
   * Get recent transactions for velocity analysis
   */
  private static async getRecentTransactions(userId: string, ipAddress: string, minutes: number): Promise<TransactionPattern[]> {
    // In production, query transaction database
    // For now, return empty array
    return [];
  }

  /**
   * Monitor chargeback rates for compliance
   */
  static async checkChargebackCompliance(): Promise<{
    currentRate: number;
    isCompliant: boolean;
    alertLevel: 'GREEN' | 'YELLOW' | 'RED';
    recommendations: string[];
  }> {
    // Get chargeback rate for last 30 days
    const chargebackRate = await this.getChargebackRate(30);
    
    let alertLevel: 'GREEN' | 'YELLOW' | 'RED';
    let isCompliant = true;
    const recommendations: string[] = [];

    if (chargebackRate > 1.0) {
      alertLevel = 'RED';
      isCompliant = false;
      recommendations.push('CRITICAL: Chargeback rate exceeds 1% - risk of processor termination');
      recommendations.push('Implement immediate fraud prevention measures');
      recommendations.push('Review and strengthen transaction approval process');
    } else if (chargebackRate > 0.75) {
      alertLevel = 'YELLOW';
      recommendations.push('WARNING: Approaching 1% chargeback limit');
      recommendations.push('Increase fraud detection sensitivity');
      recommendations.push('Consider requiring additional verification for high-risk transactions');
    } else {
      alertLevel = 'GREEN';
      recommendations.push('Chargeback rate within acceptable limits');
    }

    console.log(`📊 Chargeback compliance check: ${chargebackRate}% (Alert: ${alertLevel})`);

    return {
      currentRate: chargebackRate,
      isCompliant,
      alertLevel,
      recommendations
    };
  }

  /**
   * Get chargeback rate for specified period
   */
  private static async getChargebackRate(days: number): Promise<number> {
    // In production, calculate from transaction and chargeback data
    // For now, return a safe placeholder
    return 0.3; // 0.3% - well below 1% limit
  }

  /**
   * Generate daily fraud prevention report
   */
  static async generateDailyReport(): Promise<{
    date: string;
    transactionsAnalyzed: number;
    blockedTransactions: number;
    falsePositiveRate: number;
    chargebackRate: number;
    riskDistribution: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
    recommendations: string[];
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    // In production, query actual data
    return {
      date: today,
      transactionsAnalyzed: 0,
      blockedTransactions: 0,
      falsePositiveRate: 0,
      chargebackRate: 0.3,
      riskDistribution: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      recommendations: [
        'Continue monitoring transaction patterns',
        'Regular review of fraud detection rules',
        'Maintain chargeback rate below 1%'
      ]
    };
  }
}

export default FraudPreventionService;
