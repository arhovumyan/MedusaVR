import { UserModel } from '../db/models/UserModel.js';

export interface MonthlyAllowance {
  artist: number;
  virtuoso: number;
  icon: number;
}

export class CoinService {
  // Monthly coin allowances by tier
  static readonly MONTHLY_ALLOWANCES: MonthlyAllowance = {
    artist: 400,
    virtuoso: 1200,
    icon: 3000
  };

  /**
   * Get monthly allowance for a user's tier
   */
  static getMonthlyAllowance(tier: string): number {
    return this.MONTHLY_ALLOWANCES[tier as keyof MonthlyAllowance] || 0;
  }

  /**
   * Check if user is eligible for monthly coin refill based on billing period rules
   */
  static isEligibleForMonthlyRefill(user: any): boolean {
    const tier = user.tier || 'free';
    if (!['artist', 'virtuoso', 'icon'].includes(tier)) {
      return false;
    }

    const now = new Date();
    const subscriptionStartDate = user.subscriptionStartDate ? new Date(user.subscriptionStartDate) : null;
    const lastCoinGrantDate = user.lastCoinGrantDate ? new Date(user.lastCoinGrantDate) : null;
    
    // For monthly billing: subscription must be active
    if (user.subscription?.billingPeriod === 'monthly') {
      if (!user.subscription || user.subscription.status !== 'active') {
        return false;
      }
      
      // Check if it's the same calendar day as subscription started
      if (!subscriptionStartDate) return true; // First grant
      
      const subscriptionDay = subscriptionStartDate.getDate();
      const currentDay = now.getDate();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Create expected grant date for current month
      const expectedGrantDate = new Date(currentYear, currentMonth, subscriptionDay);
      
      // If we're past the grant date and haven't granted this month
      if (now >= expectedGrantDate) {
        if (!lastCoinGrantDate) return true;
        
        // Check if last grant was in different month
        const lastGrantMonth = lastCoinGrantDate.getMonth();
        const lastGrantYear = lastCoinGrantDate.getFullYear();
        
        return !(lastGrantMonth === currentMonth && lastGrantYear === currentYear);
      }
      
      return false;
    }
    
    // For yearly billing: continue for 12 months regardless of cancellation
    if (user.subscription?.billingPeriod === 'yearly') {
      if (!subscriptionStartDate) return false;
      
      // Check if we're within 12 months of subscription start
      const twelveMonthsLater = new Date(subscriptionStartDate);
      twelveMonthsLater.setMonth(twelveMonthsLater.getMonth() + 12);
      
      if (now > twelveMonthsLater) return false;
      
      // Check if coins are still remaining
      if (user.yearlyCoinsRemaining <= 0) return false;
      
      // Check if it's the same calendar day as subscription started
      const subscriptionDay = subscriptionStartDate.getDate();
      const currentDay = now.getDate();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Create expected grant date for current month
      const expectedGrantDate = new Date(currentYear, currentMonth, subscriptionDay);
      
      // If we're past the grant date and haven't granted this month
      if (now >= expectedGrantDate) {
        if (!lastCoinGrantDate) return true;
        
        // Check if last grant was in different month
        const lastGrantMonth = lastCoinGrantDate.getMonth();
        const lastGrantYear = lastCoinGrantDate.getFullYear();
        
        return !(lastGrantMonth === currentMonth && lastGrantYear === currentYear);
      }
      
      return false;
    }
    
    return false;
  }

  /**
   * Process monthly coin refill for a user
   */
  static async processMonthlyRefill(userId: string): Promise<{
    success: boolean;
    coinsAdded: number;
    newBalance: number;
    message: string;
    nextRefillDate?: Date;
  }> {
    try {
      const user = await UserModel.findById(userId);
      if (!user) {
        return {
          success: false,
          coinsAdded: 0,
          newBalance: 0,
          message: 'User not found'
        };
      }

      if (!this.isEligibleForMonthlyRefill(user)) {
        return {
          success: false,
          coinsAdded: 0,
          newBalance: user.coins || 0,
          message: 'User not eligible for monthly refill'
        };
      }

      const coinsToAdd = this.getMonthlyAllowance(user.tier || 'free');
      if (coinsToAdd === 0) {
        return {
          success: false,
          coinsAdded: 0,
          newBalance: user.coins || 0,
          message: 'No monthly allowance for this tier'
        };
      }

      // Add coins and update tracking fields
      user.coins = (user.coins || 0) + coinsToAdd;
      user.lastCoinGrantDate = new Date();
      user.lastMonthlyRefill = new Date(); // Keep for backward compatibility
      
      // For yearly subscriptions, decrement remaining grants
      if (user.subscription?.billingPeriod === 'yearly' && user.yearlyCoinsRemaining > 0) {
        user.yearlyCoinsRemaining -= 1;
      }
      
      await user.save();

      // Calculate next refill date based on subscription start date
      let nextRefillDate: Date | undefined;
      if (user.subscriptionStartDate) {
        const startDate = new Date(user.subscriptionStartDate);
        const startDay = startDate.getDate();
        const now = new Date();
        
        nextRefillDate = new Date(now.getFullYear(), now.getMonth() + 1, startDay);
        
        // If the next month doesn't have this day (e.g., Jan 31 -> Feb 31), adjust to last day of month
        if (nextRefillDate.getDate() !== startDay) {
          nextRefillDate = new Date(now.getFullYear(), now.getMonth() + 2, 0); // Last day of next month
        }
      }

      console.log(`💰 Monthly refill: Added ${coinsToAdd} coins to user ${user.username} (${user.tier} tier, ${user.subscription?.billingPeriod || 'monthly'} billing)`);

      return {
        success: true,
        coinsAdded: coinsToAdd,
        newBalance: user.coins,
        message: `Added ${coinsToAdd} coins for your ${user.tier} tier monthly allowance`,
        nextRefillDate
      };

    } catch (error) {
      console.error('Error processing monthly refill:', error);
      return {
        success: false,
        coinsAdded: 0,
        newBalance: 0,
        message: 'Error processing monthly refill'
      };
    }
  }

  /**
   * Get days until next refill for a user
   */
  static getDaysUntilNextRefill(user: any): number {
    if (!user.lastMonthlyRefill) {
      return 0; // Can refill now
    }

    const lastRefill = new Date(user.lastMonthlyRefill);
    const nextRefill = new Date(lastRefill);
    nextRefill.setMonth(nextRefill.getMonth() + 1);
    
    const now = new Date();
    const diffTime = nextRefill.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  /**
   * Process monthly refills for all eligible users (for scheduled jobs)
   */
  static async processAllMonthlyRefills(): Promise<{
    processed: number;
    totalCoinsAdded: number;
    errors: number;
  }> {
    try {
      const activeUsers = await UserModel.find({
        'subscription.status': 'active',
        tier: { $in: ['artist', 'virtuoso', 'icon'] }
      });

      let processed = 0;
      let totalCoinsAdded = 0;
      let errors = 0;

      for (const user of activeUsers) {
        try {
          const result = await this.processMonthlyRefill(user._id.toString());
          if (result.success) {
            processed++;
            totalCoinsAdded += result.coinsAdded;
          }
        } catch (error) {
          console.error(`Error processing refill for user ${user._id}:`, error);
          errors++;
        }
      }

      console.log(`📊 Monthly refill batch complete: ${processed} users processed, ${totalCoinsAdded} total coins added, ${errors} errors`);

      return { processed, totalCoinsAdded, errors };

    } catch (error) {
      console.error('Error in batch monthly refill:', error);
      return { processed: 0, totalCoinsAdded: 0, errors: 1 };
    }
  }
}
