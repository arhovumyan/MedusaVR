import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { SUBSCRIPTION_PLANS, TIER_PERMISSIONS } from "../middleware/tierPermissions.js";
import { UserModel } from "../db/models/UserModel.js";

const router = Router();

// Get available subscription plans
router.get("/plans", (req, res) => {
  res.json({
    success: true,
    plans: SUBSCRIPTION_PLANS,
    tierPermissions: TIER_PERMISSIONS
  });
});

// Get current user's subscription status
router.get("/status", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const user = await UserModel.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      tier: user.tier,
      subscription: user.subscription,
      permissions: TIER_PERMISSIONS[user.tier || 'free']
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upgrade user tier (mock implementation - in production this would integrate with payment processor)
router.post("/upgrade", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const { plan, coinsToAward, billingPeriod } = req.body;

    if (!plan || !SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    // Validate billing period
    if (billingPeriod && !['monthly', 'yearly'].includes(billingPeriod)) {
      return res.status(400).json({ error: 'Invalid billing period. Must be "monthly" or "yearly"' });
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Mock payment processing - in production, integrate with Stripe/PayPal/etc
    const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Update user tier and subscription with correct end date based on billing period
    const subscriptionStartDate = new Date();
    const subscriptionEndDate = new Date();
    const period = billingPeriod || 'monthly'; // Default to monthly if not specified
    
    if (period === 'yearly') {
      subscriptionEndDate.setFullYear(subscriptionEndDate.getFullYear() + 1); // 1 year from now
    } else {
      subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); // 1 month from now
    }

    user.tier = plan;
    user.subscription = {
      status: 'active',
      plan: plan,
      startDate: subscriptionStartDate,
      endDate: subscriptionEndDate,
      paymentId: mockPaymentId,
      autoRenew: true,
      billingPeriod: period
    };

    // Initialize coin distribution tracking fields
    user.subscriptionStartDate = subscriptionStartDate;
    user.lastCoinGrantDate = null; // Reset for new subscription
    
    // For yearly subscriptions, set remaining monthly grants
    if (period === 'yearly') {
      user.yearlyCoinsRemaining = 12; // 12 monthly grants
    } else {
      user.yearlyCoinsRemaining = 0;
    }

    // Award coins based on tier - Initial signup bonus
    // Only award if specifically requested via coinsToAward parameter
    // (Frontend sends the coin amount, so we don't need automatic tier-based awarding)
    
    if (coinsToAward && typeof coinsToAward === 'number' && coinsToAward > 0) {
      user.coins = (user.coins || 0) + coinsToAward;
      console.log(`💰 Awarded ${coinsToAward} coins for ${plan} tier upgrade`);
    }

    await user.save();

    console.log(`✅ User ${user.username} upgraded to ${plan} tier (${period}) ${coinsToAward ? ` and received ${coinsToAward} coins` : ''}`);

    res.json({
      success: true,
      message: `Successfully upgraded to ${plan} tier for ${period === 'yearly' ? '1 year' : '1 month'}${coinsToAward ? ` and received ${coinsToAward} coins` : ''}`,
      tier: user.tier,
      subscription: user.subscription,
      permissions: TIER_PERMISSIONS[user.tier],
      coins: user.coins
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel subscription
router.post("/cancel", requireAuth, async (req, res) => {
  try {
    const userId = (req as any).userId;
    const user = await UserModel.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Keep benefits until subscription end date
    if (user.subscription?.status === 'active') {
      user.subscription.status = 'canceled';
      user.subscription.autoRenew = false;
      await user.save();

      console.log(`✅ User ${user.username} canceled subscription`);

      res.json({
        success: true,
        message: 'Subscription canceled successfully',
        subscription: user.subscription
      });
    } else {
      res.status(400).json({ error: 'No active subscription to cancel' });
    }
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 