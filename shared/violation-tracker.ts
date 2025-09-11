// User violation tracking and banning system
export interface UserViolation {
  id: string;
  userId: string;
  username?: string;
  violationType: 'content_filter' | 'reprogramming' | 'harassment' | 'spam';
  severity: 'low' | 'medium' | 'high' | 'critical';
  content: string;
  blockedWords: string[];
  context: 'chat' | 'image_generation' | 'profile' | 'other';
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
  resolved: boolean;
  moderatorAction?: 'warned' | 'restricted' | 'suspended' | 'banned';
  moderatorNotes?: string;
}

export interface UserViolationSummary {
  userId: string;
  username?: string;
  totalViolations: number;
  recentViolations: number; // Last 7 days
  severityBreakdown: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  lastViolation?: Date;
  status: 'active' | 'warned' | 'restricted' | 'suspended' | 'banned';
  banExpiresAt?: Date;
  restrictionsExpiresAt?: Date;
}

export class UserViolationTracker {
  private violations: Map<string, UserViolation[]> = new Map();
  private userSummaries: Map<string, UserViolationSummary> = new Map();

  // Log a new violation
  async logViolation(violation: Omit<UserViolation, 'id' | 'timestamp' | 'resolved'>): Promise<UserViolation> {
    const newViolation: UserViolation = {
      ...violation,
      id: this.generateViolationId(),
      timestamp: new Date(),
      resolved: false
    };

    // Add to violations list
    const userViolations = this.violations.get(violation.userId) || [];
    userViolations.push(newViolation);
    this.violations.set(violation.userId, userViolations);

    // Update user summary
    this.updateUserSummary(violation.userId);

    // Auto-moderate based on violation (async)
    await this.autoModerate(violation.userId, newViolation);

    return newViolation;
  }

  // Get user violation summary
  getUserSummary(userId: string): UserViolationSummary | null {
    return this.userSummaries.get(userId) || null;
  }

  // Check if user should be banned/restricted
  shouldRestrictUser(userId: string): {
    shouldRestrict: boolean;
    action: 'warn' | 'restrict' | 'suspend' | 'ban';
    reason: string;
    duration?: number; // in hours
  } {
    const summary = this.getUserSummary(userId);
    if (!summary) {
      return { shouldRestrict: false, action: 'warn', reason: '' };
    }

    // Critical violations = immediate ban
    if (summary.severityBreakdown.critical > 0) {
      return {
        shouldRestrict: true,
        action: 'ban',
        reason: 'Critical content violations (minors, rape, bestiality, etc.)'
      };
    }

    // High severity violations
    if (summary.severityBreakdown.high >= 3) {
      return {
        shouldRestrict: true,
        action: 'ban',
        reason: 'Multiple high-severity content violations'
      };
    } else if (summary.severityBreakdown.high >= 1) {
      return {
        shouldRestrict: true,
        action: 'suspend',
        reason: 'High-severity content violations',
        duration: 24 * 7 // 7 days
      };
    }

    // Medium severity violations
    if (summary.severityBreakdown.medium >= 5) {
      return {
        shouldRestrict: true,
        action: 'suspend',
        reason: 'Repeated content violations',
        duration: 24 * 3 // 3 days
      };
    } else if (summary.severityBreakdown.medium >= 3) {
      return {
        shouldRestrict: true,
        action: 'restrict',
        reason: 'Multiple content violations',
        duration: 24 // 24 hours
      };
    }

    // Recent violations (spam behavior)
    if (summary.recentViolations >= 10) {
      return {
        shouldRestrict: true,
        action: 'restrict',
        reason: 'Excessive recent violations',
        duration: 12 // 12 hours
      };
    }

    // Warning threshold
    if (summary.totalViolations >= 5) {
      return {
        shouldRestrict: true,
        action: 'warn',
        reason: 'Multiple content violations'
      };
    }

    return { shouldRestrict: false, action: 'warn', reason: '' };
  }

  private generateViolationId(): string {
    return 'violation_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private updateUserSummary(userId: string): void {
    const userViolations = this.violations.get(userId) || [];
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const severityBreakdown = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    let recentViolations = 0;
    let lastViolation: Date | undefined;

    for (const violation of userViolations) {
      severityBreakdown[violation.severity]++;
      
      if (violation.timestamp > sevenDaysAgo) {
        recentViolations++;
      }

      if (!lastViolation || violation.timestamp > lastViolation) {
        lastViolation = violation.timestamp;
      }
    }

    const currentSummary = this.userSummaries.get(userId);
    
    this.userSummaries.set(userId, {
      userId,
      username: currentSummary?.username,
      totalViolations: userViolations.length,
      recentViolations,
      severityBreakdown,
      lastViolation,
      status: this.calculateUserStatus(severityBreakdown, recentViolations),
      banExpiresAt: currentSummary?.banExpiresAt,
      restrictionsExpiresAt: currentSummary?.restrictionsExpiresAt
    });
  }

  private calculateUserStatus(severityBreakdown: any, recentViolations: number): 'active' | 'warned' | 'restricted' | 'suspended' | 'banned' {
    if (severityBreakdown.critical > 0 || severityBreakdown.high >= 3) {
      return 'banned';
    }
    if (severityBreakdown.high >= 1 || severityBreakdown.medium >= 5) {
      return 'suspended';
    }
    if (severityBreakdown.medium >= 3 || recentViolations >= 10) {
      return 'restricted';
    }
    if (severityBreakdown.medium >= 1 || recentViolations >= 5) {
      return 'warned';
    }
    return 'active';
  }

  private async autoModerate(userId: string, violation: UserViolation): Promise<void> {
    const restriction = this.shouldRestrictUser(userId);
    
    if (restriction.shouldRestrict) {
      const summary = this.userSummaries.get(userId);
      if (summary) {
        summary.status = restriction.action === 'ban' ? 'banned' : 
                         restriction.action === 'suspend' ? 'suspended' :
                         restriction.action === 'restrict' ? 'restricted' : 'warned';

        if (restriction.duration) {
          const expiresAt = new Date(Date.now() + restriction.duration * 60 * 60 * 1000);
          if (restriction.action === 'ban' || restriction.action === 'suspend') {
            summary.banExpiresAt = expiresAt;
          } else {
            summary.restrictionsExpiresAt = expiresAt;
          }
        }

        this.userSummaries.set(userId, summary);
      }

      // Log the moderation action
      console.log(`🚨 AUTO-MODERATION: User ${userId} ${restriction.action}ed for: ${restriction.reason}`);
      
      // Handle permanent bans - trigger account deletion
      if (restriction.action === 'ban' && !restriction.duration) {
        console.log(`🚨 PERMANENT BAN DETECTED: Scheduling account deletion for user ${userId}`);
        
        // Import and use AccountDeletionService for permanent bans
        try {
          // Dynamic import to avoid circular dependencies
          const { AccountDeletionService } = await import('../server/services/AccountDeletionService.js');
          const deletionResult = await AccountDeletionService.scheduleAccountDeletion(
            userId, 
            `Permanent ban: ${restriction.reason}`
          );
          
          if (deletionResult) {
            console.log(`✅ Account deletion scheduled successfully for permanently banned user: ${userId}`);
          } else {
            console.error(`❌ Failed to schedule account deletion for permanently banned user: ${userId}`);
          }
        } catch (importError) {
          console.error(`❌ Error importing AccountDeletionService for user ${userId}:`, importError);
        }
      }
      
      // Here you would typically:
      // 1. Update database
      // 2. Send notification to user
      // 3. Log to audit trail
      // 4. Notify moderators for critical violations
    }
  }

  // Check if user is currently restricted
  isUserRestricted(userId: string): {
    isRestricted: boolean;
    type?: 'warned' | 'restricted' | 'suspended' | 'banned';
    reason?: string;
    expiresAt?: Date;
  } {
    const summary = this.getUserSummary(userId);
    if (!summary) {
      return { isRestricted: false };
    }

    const now = new Date();

    // Check permanent ban
    if (summary.status === 'banned' && (!summary.banExpiresAt || summary.banExpiresAt > now)) {
      return {
        isRestricted: true,
        type: 'banned',
        reason: 'Account banned for severe content violations',
        expiresAt: summary.banExpiresAt
      };
    }

    // Check suspension
    if (summary.status === 'suspended' && (!summary.banExpiresAt || summary.banExpiresAt > now)) {
      return {
        isRestricted: true,
        type: 'suspended',
        reason: 'Account suspended for content violations',
        expiresAt: summary.banExpiresAt
      };
    }

    // Check restrictions
    if (summary.status === 'restricted' && (!summary.restrictionsExpiresAt || summary.restrictionsExpiresAt > now)) {
      return {
        isRestricted: true,
        type: 'restricted',
        reason: 'Account restricted for content violations',
        expiresAt: summary.restrictionsExpiresAt
      };
    }

    return { isRestricted: false };
  }
}

// Global instance
export const violationTracker = new UserViolationTracker();

export default {
  UserViolationTracker,
  violationTracker
};
