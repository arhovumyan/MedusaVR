import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { CoinService } from '../services/CoinService.js';
import { UserModel } from '../db/models/UserModel.js';
const router = Router();
// Get user's coin information including monthly allowance
router.get('/info', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const user = await UserModel.findById(userId).select('coins tier subscription lastMonthlyRefill');
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }
        const monthlyAllowance = CoinService.getMonthlyAllowance(user.tier || 'free');
        const daysUntilRefill = CoinService.getDaysUntilNextRefill(user);
        const isEligibleForRefill = CoinService.isEligibleForMonthlyRefill(user);
        res.json({
            success: true,
            data: {
                currentBalance: user.coins || 0,
                tier: user.tier || 'free',
                monthlyAllowance,
                daysUntilRefill,
                isEligibleForRefill,
                subscriptionStatus: user.subscription?.status || 'none',
                lastRefill: user.lastMonthlyRefill
            }
        });
    }
    catch (error) {
        console.error('Error getting coin info:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
// Manual monthly refill endpoint (for users to claim their monthly coins)
router.post('/claim-monthly', requireAuth, async (req, res) => {
    try {
        const userId = req.userId;
        const result = await CoinService.processMonthlyRefill(userId);
        if (result.success) {
            res.json({
                success: true,
                message: result.message,
                data: {
                    coinsAdded: result.coinsAdded,
                    newBalance: result.newBalance,
                    nextRefillDate: result.nextRefillDate
                }
            });
        }
        else {
            res.status(400).json({
                success: false,
                error: result.message
            });
        }
    }
    catch (error) {
        console.error('Error claiming monthly coins:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
// Admin endpoint to process all monthly refills (for scheduled jobs)
router.post('/process-all-monthly', requireAuth, async (req, res) => {
    try {
        // This should be admin-only in production
        const result = await CoinService.processAllMonthlyRefills();
        res.json({
            success: true,
            message: 'Batch monthly refill completed',
            data: result
        });
    }
    catch (error) {
        console.error('Error processing all monthly refills:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
export default router;
