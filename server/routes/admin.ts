import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { UserBanService } from '../services/UserBanService.js';
import { UserModel } from '../db/models/UserModel.js';
import { ViolationModel } from '../db/models/ViolationModel.js';
import { AccountDeletionService } from '../services/AccountDeletionService.js';

const router = Router();

// Admin authentication middleware
const requireAdmin = async (req: Request, res: Response, next: any) => {
  try {
    const userId = (req as any).user?.uid;
    const user = await UserModel.findById(userId);
    
    // In production, you'd have proper admin role checking
    // For now, check if user email is in admin list
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim());
    
    if (!user || !adminEmails.includes(user.email)) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    res.status(500).json({ error: 'Admin check failed' });
  }
};

/**
 * GET /admin/violations
 * Get all violations with pagination and filtering
 */
router.get('/violations', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const violationType = req.query.violationType as string;
    const severity = req.query.severity as string;
    const userId = req.query.userId as string;

    const filter: any = {};
    if (violationType) filter.violationType = violationType;
    if (severity) filter.severity = severity;
    if (userId) filter.userId = userId;

    const violations = await ViolationModel
      .find(filter)
      .populate('userId', 'username email accountStatus')
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await ViolationModel.countDocuments(filter);

    res.json({
      violations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching violations:', error);
    res.status(500).json({ error: 'Failed to fetch violations' });
  }
});

/**
 * GET /admin/users/:userId/violations
 * Get all violations for a specific user
 */
router.get('/users/:userId/violations', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const violations = await UserBanService.getUserViolations(userId, 100);
    
    const user = await UserModel.findById(userId, 'username email accountStatus banInfo securityInfo');
    
    res.json({
      user,
      violations,
      summary: {
        totalViolations: violations.length,
        ageViolations: violations.filter(v => v.violationType === 'age_violation').length,
        recentViolations: violations.filter(v => 
          new Date(v.timestamp).getTime() > Date.now() - (30 * 24 * 60 * 60 * 1000)
        ).length
      }
    });
  } catch (error) {
    console.error('Error fetching user violations:', error);
    res.status(500).json({ error: 'Failed to fetch user violations' });
  }
});

/**
 * POST /admin/users/:userId/ban
 * Ban a user
 */
router.post('/users/:userId/ban', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { banType, banReason, customMessage, banDurationHours, evidence } = req.body;
    const adminId = (req as any).user?.uid;

    if (!banType || !banReason || !evidence) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await UserBanService.banUser({
      userId,
      banType,
      banReason,
      banDurationHours,
      customMessage,
      bannedBy: adminId,
      evidence: {
        violatingMessage: evidence.violatingMessage || 'Admin action',
        detectedPatterns: evidence.detectedPatterns || [],
        conversationContext: evidence.conversationContext,
        characterId: evidence.characterId,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'admin-panel',
        deviceFingerprint: evidence.deviceFingerprint,
        sessionId: evidence.sessionId,
        endpoint: 'admin_action'
      }
    });

    if (result.success) {
      res.json({ success: true, violationId: result.violationId });
    } else {
      res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ error: 'Failed to ban user' });
  }
});

/**
 * POST /admin/users/:userId/unban
 * Unban a user
 */
router.post('/users/:userId/unban', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const adminId = (req as any).user?.uid;

    const success = await UserBanService.unbanUser(userId, 'admin_action', adminId);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to unban user' });
    }
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ error: 'Failed to unban user' });
  }
});

/**
 * GET /admin/users/:userId/compliance-report
 * Export compliance report for a user
 */
router.get('/users/:userId/compliance-report', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const report = await UserBanService.exportComplianceReport(userId);
    
    if (!report) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="compliance_report_${userId}_${new Date().toISOString().split('T')[0]}.json"`);
    
    res.json(report);
  } catch (error) {
    console.error('Error generating compliance report:', error);
    res.status(500).json({ error: 'Failed to generate compliance report' });
  }
});

/**
 * GET /admin/dashboard
 * Get admin dashboard statistics
 */
router.get('/dashboard', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    const last7Days = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const last30Days = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Get violation statistics
    const [
      totalViolations,
      violations24h,
      violations7d,
      violations30d,
      ageViolations30d,
      bannedUsers,
      suspendedUsers,
      recentViolations
    ] = await Promise.all([
      ViolationModel.countDocuments({}),
      ViolationModel.countDocuments({ timestamp: { $gte: last24Hours } }),
      ViolationModel.countDocuments({ timestamp: { $gte: last7Days } }),
      ViolationModel.countDocuments({ timestamp: { $gte: last30Days } }),
      ViolationModel.countDocuments({ 
        violationType: 'age_violation',
        timestamp: { $gte: last30Days }
      }),
      UserModel.countDocuments({ 'banInfo.isBanned': true, 'banInfo.banType': 'permanent' }),
      UserModel.countDocuments({ 'banInfo.isBanned': true, 'banInfo.banType': 'temporary' }),
      ViolationModel.find({})
        .populate('userId', 'username email')
        .sort({ timestamp: -1 })
        .limit(10)
    ]);

    // Get top violation types
    const violationTypes = await ViolationModel.aggregate([
      { $match: { timestamp: { $gte: last30Days } } },
      { $group: { _id: '$violationType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get daily violation trends (last 7 days)
    const dailyTrends = await ViolationModel.aggregate([
      { $match: { timestamp: { $gte: last7Days } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          count: { $sum: 1 },
          ageViolations: {
            $sum: { $cond: [{ $eq: ['$violationType', 'age_violation'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      statistics: {
        totalViolations,
        violations24h,
        violations7d,
        violations30d,
        ageViolations30d,
        bannedUsers,
        suspendedUsers
      },
      violationTypes,
      dailyTrends,
      recentViolations
    });
  } catch (error) {
    console.error('Error generating dashboard:', error);
    res.status(500).json({ error: 'Failed to generate dashboard' });
  }
});

/**
 * GET /admin/users
 * Search and list users with filtering
 */
router.get('/users', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const banType = req.query.banType as string;

    const filter: any = {};
    
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.accountStatus = status;
    }
    
    if (banType) {
      filter['banInfo.banType'] = banType;
    }

    const users = await UserModel
      .find(filter, 'username email accountStatus banInfo securityInfo createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await UserModel.countDocuments(filter);

    // Get violation counts for each user
    const usersWithViolations = await Promise.all(
      users.map(async (user) => {
        const violationCount = await ViolationModel.countDocuments({ userId: user._id });
        return {
          ...user.toObject(),
          violationCount
        };
      })
    );

    res.json({
      users: usersWithViolations,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * DELETE /admin/users/:userId/delete-account
 * Permanently delete a user account and all associated data
 */
router.delete('/users/:userId/delete-account', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = (req as any).user?.uid;

    if (!reason) {
      return res.status(400).json({ error: 'Deletion reason is required' });
    }

    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`🗑️ ADMIN ACCOUNT DELETION: Admin ${adminId} deleting account for user ${userId} (${user.username}), reason: ${reason}`);

    // Delete the account
    const result = await AccountDeletionService.deleteUserAccount(userId, `Admin deletion: ${reason}`);

    if (result.success) {
      res.json({
        success: true,
        message: 'Account deleted successfully',
        deletedData: result.deletedData
      });
    } else {
      res.status(500).json({ error: result.message });
    }
  } catch (error) {
    console.error('Error deleting user account:', error);
    res.status(500).json({ error: 'Failed to delete user account' });
  }
});

/**
 * POST /admin/users/batch-delete-accounts
 * Delete multiple user accounts (for permanently banned users)
 */
router.post('/users/batch-delete-accounts', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userIds, reason } = req.body;
    const adminId = (req as any).user?.uid;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Deletion reason is required' });
    }

    console.log(`🗑️ BATCH ACCOUNT DELETION: Admin ${adminId} deleting ${userIds.length} accounts, reason: ${reason}`);

    // Delete multiple accounts
    const result = await AccountDeletionService.deleteMultipleAccounts(userIds, `Batch admin deletion: ${reason}`);

    res.json({
      success: result.success,
      message: `Batch deletion completed: ${result.results.filter(r => r.success).length}/${userIds.length} accounts deleted`,
      results: result.results
    });
  } catch (error) {
    console.error('Error batch deleting user accounts:', error);
    res.status(500).json({ error: 'Failed to batch delete user accounts' });
  }
});

/**
 * GET /admin/users/permanently-banned
 * Get list of permanently banned users that should have their accounts deleted
 */
router.get('/users/permanently-banned', requireAuth, requireAdmin, async (req: Request, res: Response) => {
  try {
    // Find users with permanent bans
    const permanentlyBannedUsers = await UserModel.find({
      'banInfo.banType': 'permanent',
      'banInfo.isActive': true
    }, 'username email banInfo createdAt');

    // Get violation counts for each banned user
    const bannedUsersWithViolations = await Promise.all(
      permanentlyBannedUsers.map(async (user) => {
        const violationCount = await ViolationModel.countDocuments({ userId: user._id });
        const criticalViolations = await ViolationModel.countDocuments({ 
          userId: user._id, 
          severity: 'critical' 
        });
        
        return {
          ...user.toObject(),
          violationCount,
          criticalViolations
        };
      })
    );

    res.json({
      permanentlyBannedUsers: bannedUsersWithViolations,
      totalCount: bannedUsersWithViolations.length
    });
  } catch (error) {
    console.error('Error fetching permanently banned users:', error);
    res.status(500).json({ error: 'Failed to fetch permanently banned users' });
  }
});

export default router;
