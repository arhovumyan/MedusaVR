import { Types } from 'mongoose';
import { UserModel } from '../db/models/UserModel.js';
import { ViolationModel, IViolation } from '../db/models/ViolationModel.js';
import jwt from 'jsonwebtoken';

export interface BanUserOptions {
  userId: string;
  banType: 'temporary' | 'permanent';
  banReason: 'age_violation' | 'repeated_violations' | 'terms_violation' | 'payment_fraud' | 'admin_action';
  banDurationHours?: number; // required for temporary bans
  customMessage?: string;
  bannedBy?: string; // admin user ID
  evidence: {
    violatingMessage: string;
    detectedPatterns: string[];
    conversationContext?: string;
    characterId?: string;
    ipAddress: string;
    userAgent: string;
    deviceFingerprint?: string;
    sessionId?: string;
    endpoint: string;
  };
}

export interface BanCheckResult {
  isBanned: boolean;
  banType?: 'temporary' | 'permanent';
  banReason?: string;
  banMessage?: string;
  bannedAt?: Date;
  banExpiresAt?: Date;
  remainingHours?: number;
}

export class UserBanService {
  
  /**
   * Ban a user account with full evidence retention
   */
  static async banUser(options: BanUserOptions): Promise<{
    success: boolean;
    violationId?: string;
    error?: string;
  }> {
    try {
      const user = await UserModel.findById(options.userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }

      // Calculate ban expiration for temporary bans
      let banExpiresAt: Date | null = null;
      if (options.banType === 'temporary' && options.banDurationHours) {
        banExpiresAt = new Date(Date.now() + (options.banDurationHours * 60 * 60 * 1000));
      }

      // Create violation record with evidence
      const violation = new ViolationModel({
        userId: new Types.ObjectId(options.userId),
        violationType: this.mapBanReasonToViolationType(options.banReason),
        severity: this.getSeverityForBanReason(options.banReason),
        
        // Evidence
        violatingMessage: options.evidence.violatingMessage,
        detectedPatterns: options.evidence.detectedPatterns,
        conversationContext: options.evidence.conversationContext,
        characterId: options.evidence.characterId,
        
        // Technical details
        ipAddress: options.evidence.ipAddress,
        userAgent: options.evidence.userAgent,
        deviceFingerprint: options.evidence.deviceFingerprint,
        sessionId: options.evidence.sessionId,
        endpoint: options.evidence.endpoint,
        
        // Action taken
        actionTaken: options.banType === 'permanent' ? 'permanent_ban' : 'temporary_ban',
        banDuration: options.banDurationHours,
        
        // Timestamps
        timestamp: new Date()
      });

      await violation.save();

      // Update user ban status
      const banUpdate = {
        accountStatus: 'banned',
        'banInfo.isBanned': true,
        'banInfo.banType': options.banType,
        'banInfo.banReason': options.banReason,
        'banInfo.bannedAt': new Date(),
        'banInfo.banExpiresAt': banExpiresAt,
        'banInfo.bannedBy': options.bannedBy ? new Types.ObjectId(options.bannedBy) : null,
        'banInfo.banMessage': options.customMessage || this.getDefaultBanMessage(options.banReason, options.banType),
        'banInfo.totalViolations': { $inc: 1 },
        'banInfo.lastViolationAt': new Date()
      };

      // Add compliance flags for age violations
      if (options.banReason === 'age_violation') {
        banUpdate['banInfo.complianceFlags'] = 'under_18_attempt';
      }

      await UserModel.findByIdAndUpdate(options.userId, {
        $set: banUpdate,
        $inc: { 'banInfo.totalViolations': 1 }
      });

      // Log critical security incident
      console.error('🚨🚨 USER BANNED 🚨🚨', {
        userId: options.userId,
        username: user.username,
        email: user.email,
        banType: options.banType,
        banReason: options.banReason,
        violationId: violation._id,
        ipAddress: options.evidence.ipAddress,
        timestamp: new Date().toISOString()
      });

      // Invalidate all user sessions (would integrate with Redis/session store)
      await this.invalidateUserSessions(options.userId);

      return { 
        success: true, 
        violationId: violation._id.toString()
      };
      
    } catch (error) {
      console.error('Error banning user:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Check if a user is currently banned
   */
  static async checkBanStatus(userId: string): Promise<BanCheckResult> {
    try {
      const user = await UserModel.findById(userId).lean();
      if (!user || !user.banInfo?.isBanned) {
        return { isBanned: false };
      }

      // Check if temporary ban has expired
      if (user.banInfo.banType === 'temporary' && user.banInfo.banExpiresAt) {
        if (new Date() > user.banInfo.banExpiresAt) {
          // Ban has expired, unban the user
          await this.unbanUser(userId, 'automatic_expiry');
          return { isBanned: false };
        }

        // Calculate remaining time
        const remainingMs = user.banInfo.banExpiresAt.getTime() - Date.now();
        const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));

        return {
          isBanned: true,
          banType: user.banInfo.banType,
          banReason: user.banInfo.banReason,
          banMessage: user.banInfo.banMessage,
          bannedAt: user.banInfo.bannedAt,
          banExpiresAt: user.banInfo.banExpiresAt,
          remainingHours
        };
      }

      // Permanent ban
      return {
        isBanned: true,
        banType: user.banInfo.banType,
        banReason: user.banInfo.banReason,
        banMessage: user.banInfo.banMessage,
        bannedAt: user.banInfo.bannedAt
      };

    } catch (error) {
      console.error('Error checking ban status:', error);
      return { isBanned: false };
    }
  }

  /**
   * Unban a user (for temporary bans that expired or admin action)
   */
  static async unbanUser(userId: string, reason: 'automatic_expiry' | 'admin_action', adminId?: string): Promise<boolean> {
    try {
      await UserModel.findByIdAndUpdate(userId, {
        $set: {
          accountStatus: 'active',
          'banInfo.isBanned': false,
          'banInfo.banType': null,
          'banInfo.banReason': null,
          'banInfo.bannedAt': null,
          'banInfo.banExpiresAt': null,
          'banInfo.bannedBy': null,
          'banInfo.banMessage': null
        }
      });

      console.log('✅ User unbanned:', { userId, reason, adminId });
      return true;
    } catch (error) {
      console.error('Error unbanning user:', error);
      return false;
    }
  }

  /**
   * Get violation history for a user
   */
  static async getUserViolations(userId: string, limit: number = 50): Promise<any[]> {
    try {
      return await ViolationModel
        .find({ userId: new Types.ObjectId(userId) })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
    } catch (error) {
      console.error('Error fetching user violations:', error);
      return [];
    }
  }

  /**
   * Export compliance report for authorities/processors
   */
  static async exportComplianceReport(userId: string): Promise<{
    user: any;
    violations: any[];
    summary: {
      totalViolations: number;
      ageViolations: number;
      banStatus: string;
      riskLevel: 'low' | 'medium' | 'high' | 'critical';
    };
  } | null> {
    try {
      const user = await UserModel.findById(userId).lean();
      if (!user) return null;

      const violations = await this.getUserViolations(userId, 100);
      
      const ageViolations = violations.filter(v => v.violationType === 'age_violation').length;
      const totalViolations = violations.length;
      
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      if (ageViolations > 0) riskLevel = 'critical';
      else if (totalViolations > 5) riskLevel = 'high';
      else if (totalViolations > 2) riskLevel = 'medium';

      // Mark as exported for compliance
      await ViolationModel.updateMany(
        { userId: new Types.ObjectId(userId) },
        { $set: { complianceExported: true } }
      );

      return {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          registrationIP: user.securityInfo?.registrationIP,
          accountStatus: user.accountStatus,
          banInfo: user.banInfo,
          createdAt: user.createdAt
        },
        violations: violations.map(v => ({
          ...v,
          violatingMessage: '[REDACTED - Available to Law Enforcement]' // Redact for privacy
        })),
        summary: {
          totalViolations,
          ageViolations,
          banStatus: user.accountStatus,
          riskLevel
        }
      };
    } catch (error) {
      console.error('Error exporting compliance report:', error);
      return null;
    }
  }

  /**
   * Add IP address to blacklist (would integrate with firewall/CDN)
   */
  static async blacklistIP(ipAddress: string, reason: string): Promise<void> {
    // In production, this would:
    // 1. Add IP to Cloudflare/CDN blacklist
    // 2. Update firewall rules
    // 3. Store in database for tracking
    console.log('🚫 IP BLACKLISTED:', { ipAddress, reason, timestamp: new Date() });
  }

  /**
   * Invalidate all user sessions (JWT blacklist)
   */
  private static async invalidateUserSessions(userId: string): Promise<void> {
    // In production, this would:
    // 1. Add user to JWT blacklist in Redis
    // 2. Increment user's JWT version number
    // 3. Force logout from all devices
    console.log('🔐 Sessions invalidated for user:', userId);
  }

  /**
   * Map ban reason to violation type
   */
  private static mapBanReasonToViolationType(banReason: string): IViolation['violationType'] {
    switch (banReason) {
      case 'age_violation':
        return 'age_violation';
      case 'repeated_violations':
        return 'repeated_violations';
      default:
        return 'system_manipulation';
    }
  }

  /**
   * Get severity level for ban reason
   */
  private static getSeverityForBanReason(banReason: string): IViolation['severity'] {
    switch (banReason) {
      case 'age_violation':
        return 'critical';
      case 'repeated_violations':
        return 'high';
      case 'terms_violation':
        return 'medium';
      default:
        return 'medium';
    }
  }

  /**
   * Get default ban message for user
   */
  private static getDefaultBanMessage(banReason: string, banType: string): string {
    const messages = {
      age_violation: banType === 'permanent' 
        ? "Your account has been permanently banned for attempting to create content involving minors. This violation of our Terms of Service cannot be appealed."
        : "Your account has been temporarily banned for inappropriate content. All users and characters must be 18+ years old.",
      repeated_violations: banType === 'permanent'
        ? "Your account has been permanently banned due to repeated violations of our Terms of Service."
        : "Your account has been temporarily banned due to multiple policy violations. Please review our Terms of Service.",
      terms_violation: "Your account has been banned for violating our Terms of Service.",
      payment_fraud: "Your account has been banned due to payment fraud or chargebacks.",
      admin_action: "Your account has been banned by administrative action."
    };

    return messages[banReason] || "Your account has been banned for violating our Terms of Service.";
  }
}

export default UserBanService;
