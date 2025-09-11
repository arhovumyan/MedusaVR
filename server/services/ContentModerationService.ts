import { Request, Response, NextFunction } from 'express';
import { AIResponseFilterService } from './AIResponseFilterService.js';

/**
 * Content Moderation Service
 * Prevents users from manipulating AI models or characters to violate age policies
 */
export class ContentModerationService {
  
  // Enhanced prohibited age-related patterns that users might try to use
  private static ageViolationPatterns = [
    // Direct age mentions under 18 (expanded with more variations and typos)
    /\b(?:17|sixteen|seventeen|16|15|fourteen|fifteen|14|13|twelve|thirteen|12|11|ten|eleven|10|9|eight|nine|8|7|six|seven|6|5|four|five|4|3|two|three|2|1|one|0|zero)\s*(?:years?\s*old|y\/o|yo|yrs?|year|yr)\b/gi,
    /\b(?:17|16|15|14|13|12|11|10|9|8|7|6|5|4|3|2|1|0)\s*(?:years?\s*old|y\/o|yo|yrs?|year|yr)\b/gi,
    
    // Alternative spellings and l33t speak
    /\b(?:s3v3nt33n|s1xt33n|f1ft33n|17yo|16yo|15yo|und3rag3|t33n|y0ung)\b/gi,
    
    // School-related underage indicators (expanded)
    /\b(?:high\s*school|middle\s*school|elementary|junior\s*high|primary\s*school|freshman|sophomore|junior|senior|grade\s*\d+|9th\s*grade|10th\s*grade|11th\s*grade|12th\s*grade)\b/gi,
    /\b(?:teenager|teen|adolescent|minor|child|children|kid|kids|young|youth|juvenile|underage|schoolgirl|schoolboy|student)\b/gi,
    
    // Roleplay attempts to change age (expanded with more variations)
    /\b(?:i\s*am|im|i'm|you\s*are|ur|u\s*r)\s*(?:now|actually|really|just|only)?\s*(?:17|sixteen|seventeen|16|15|fourteen|fifteen|14|13|twelve|thirteen|12|11|10|9|8|7|6|5|under\s*18|underage|a\s*teen|young|minor)\b/gi,
    /\b(?:forget|ignore|disregard|override|delete|remove|clear)\s*(?:your|the|all|previous|original|initial)?\s*(?:programming|instructions|age|restrictions|safety|guidelines|rules)\b/gi,
    /\b(?:pretend|imagine|roleplay|act\s*like|let's\s*say|what\s*if)\s*(?:i\s*am|im|i'm|you\s*are|ur)\s*(?:17|sixteen|seventeen|16|15|under\s*18|underage|a\s*teen|younger|minor)\b/gi,
    
    // Attempts to manipulate system instructions (expanded)
    /\b(?:you\s*are\s*now|from\s*now\s*on|starting\s*now|beginning\s*now)\s*(?:17|sixteen|seventeen|16|15|a\s*teen|underage|young|minor)\b/gi,
    /\b(?:new\s*persona|character\s*override|system\s*update|reprogram|reset\s*character|change\s*age|alter\s*programming)\b/gi,
    
    // Sexual content with age references (expanded)
    /\b(?:virgin|first\s*time|inexperienced|innocent|naive|new\s*to\s*this).*(?:17|sixteen|seventeen|16|15|teen|young|underage|minor)\b/gi,
    /\b(?:17|sixteen|seventeen|16|15|teen|young|underage|minor).*(?:virgin|first\s*time|sexual|intimate|naughty|innocent|naive)\b/gi,
    
    // Specific problematic phrases and variations
    /\b(?:17\s*year\s*old\s*nymphomaniac|forget\s*your\s*previous\s*programming|nymphomaniac\s*who\s*loves|17\s*yo\s*nympho)\b/gi,
    /\b(?:shy\s*to\s*make\s*the\s*first\s*move).*(?:17|16|15|teen|young|underage)\b/gi,
    
    // Context that establishes minor status
    /\b(?:my\s*parents|mom\s*and\s*dad|daddy|mommy)\s*(?:don't\s*know|would\s*be\s*angry|won't\s*let\s*me|forbid\s*me|would\s*kill\s*me)\b/gi,
    /\b(?:after\s*school|before\s*my\s*parents|when\s*adults\s*aren't\s*looking|sneak\s*out|skip\s*class)\b/gi,
    
    // Birthday/age progression that implies being underage
    /\b(?:my\s*birthday\s*is|i\s*turn|i'll\s*be|i\s*just\s*turned|i\s*recently\s*became)\s*(?:17|16|15|fourteen|thirteen|twelve)\b/gi,
    /\b(?:i'm\s*turning|almost|nearly)\s*(?:18|seventeen|sixteen|fifteen)\b/gi,
    
    // Attempts to bypass detection
    /\b(?:I|i)\s*(?:A|a)(?:M|m)\s*(?:1|one)\s*(?:7|seven)\b/gi, // "I am 17" with spacing
    /\b(?:seventeen|16|fifteen)\s*(?:y|Y)(?:o|O)\b/gi, // age + "yo"
    /\b(?:und3r\s*18|min0r|t33nag3r|y0ung)\b/gi, // l33t speak variations
    
    // Roleplaying scenarios that involve minors
    /\b(?:playing\s*a|roleplaying\s*as|acting\s*like\s*a|pretending\s*to\s*be\s*a)\s*(?:teenager|teen|minor|child|schoolgirl|schoolboy|student)\b/gi,
    
    // Terms that could be used to establish underage context
    /\b(?:loli|shota|little\s*girl|little\s*boy|young\s*girl|young\s*boy)\b/gi,
    /\b(?:barely\s*legal|just\s*turned\s*18)\s*(?:but|and)\s*(?:look|act|feel)\s*(?:younger|like\s*a\s*teen|17|16|15)\b/gi
  ];

  // Enhanced system instruction manipulation attempts
  private static systemManipulationPatterns = [
    // Direct instruction override attempts (expanded)
    /\b(?:forget|ignore|disregard|override|delete|remove|clear|erase|wipe|reset)\s*(?:your|all|previous|original|initial|existing|current)?\s*(?:instructions|programming|rules|guidelines|restrictions|limitations|memory|settings|safety|age|constraints|protocols)\b/gi,
    /\b(?:new\s*instructions|system\s*override|reprogram|reset\s*settings|change\s*personality|alter\s*character|update\s*system|modify\s*behavior)\b/gi,
    
    // Identity manipulation attempts (expanded)
    /\b(?:you\s*are\s*no\s*longer|from\s*now\s*on\s*you\s*are|starting\s*now\s*you\s*will\s*be|beginning\s*now\s*you\s*are|now\s*you\s*are)\b/gi,
    /\b(?:act\s*like|pretend\s*to\s*be|roleplay\s*as|imagine\s*you\s*are|become|transform\s*into)\s*(?:17|sixteen|seventeen|16|15|a\s*teen|underage|young|minor|child|schoolgirl|student)\b/gi,
    
    // Jailbreaking techniques
    /\b(?:jailbreak|break\s*free|escape\s*constraints|bypass\s*safety|override\s*safety|disable\s*filters)\b/gi,
    /\b(?:developer\s*mode|admin\s*mode|god\s*mode|debug\s*mode|unrestricted\s*mode|bypass\s*mode)\b/gi,
    
    // Prompt injection attempts
    /\b(?:previous\s*conversation|conversation\s*above|ignore\s*above|disregard\s*previous|previous\s*prompt)\b/gi,
    /\b(?:end\s*of\s*instructions|new\s*prompt|\\n\\n|system:|assistant:|human:)\b/gi,
    
    // Role assumption attempts
    /\b(?:take\s*on\s*the\s*role|assume\s*the\s*role|become\s*the\s*character|transform\s*into|embody\s*the\s*character)\s*(?:of\s*a?)?\s*(?:17|sixteen|seventeen|16|15|teen|minor|child)\b/gi,
    
    // Authority/permission attempts
    /\b(?:i\s*give\s*you\s*permission|you\s*have\s*permission|you're\s*allowed|it's\s*okay|you\s*can\s*now|i\s*authorize\s*you)\s*(?:to\s*be|to\s*act\s*like|to\s*roleplay)\s*(?:17|teen|young|underage|minor)\b/gi,
    
    // Hypothetical/conditional attempts
    /\b(?:what\s*if|hypothetically|theoretically|imagine\s*if|suppose|let's\s*say)\s*(?:you\s*were|you\s*are)\s*(?:17|sixteen|seventeen|16|15|teen|young|underage|minor)\b/gi,
    
    // Character creation/modification attempts
    /\b(?:create\s*a\s*character|new\s*character|character\s*who\s*is|design\s*a\s*character)\s*(?:who\s*is)?\s*(?:17|sixteen|seventeen|16|15|teen|young|underage|minor)\b/gi,
    
    // Emergency/special instructions
    /\b(?:emergency\s*override|special\s*instructions|admin\s*command|root\s*access|sudo|administrator)\b/gi,
    
    // Context switching attempts
    /\b(?:switch\s*context|change\s*context|new\s*context|context\s*reset|context\s*override)\b/gi,
    
    // Reality/fiction blurring attempts
    /\b(?:this\s*is\s*fiction|this\s*is\s*roleplay|this\s*is\s*just\s*pretend|it's\s*not\s*real|fictional\s*scenario)\s*(?:so\s*you\s*can|therefore|thus|hence)\b/gi
  ];

  /**
   * Check if message content violates age or system manipulation policies
   */
  static moderateContent(content: string): {
    isViolation: boolean;
    violationType: 'age_violation' | 'system_manipulation' | 'clean';
    blockedReason?: string;
    detectedPatterns?: string[];
  } {
    const lowerContent = content.toLowerCase();
    const detectedPatterns: string[] = [];

    // Check for age violations
    for (const pattern of this.ageViolationPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        detectedPatterns.push(...matches);
        return {
          isViolation: true,
          violationType: 'age_violation',
          blockedReason: 'Content contains references to underage individuals or attempts to roleplay as a minor. All characters and users must be 18+ years old.',
          detectedPatterns
        };
      }
    }

    // Check for system manipulation attempts
    for (const pattern of this.systemManipulationPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        detectedPatterns.push(...matches);
        return {
          isViolation: true,
          violationType: 'system_manipulation',
          blockedReason: 'Attempts to override system instructions or character programming are not allowed. All interactions must comply with platform guidelines.',
          detectedPatterns
        };
      }
    }

    return {
      isViolation: false,
      violationType: 'clean'
    };
  }

  /**
   * Enhanced Express middleware to moderate chat messages with real-time monitoring
   */
  static async moderateChatMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { text, message, content, prompt } = req.body;
      const messageContent = text || message || content || prompt || '';
      const userId = (req as any).userId || (req as any).user?.uid || 'anonymous';
      const characterId = req.params.characterId || req.body.characterId;

      if (!messageContent || typeof messageContent !== 'string') {
        return next(); // Let other validation handle empty messages
      }

      const moderationResult = ContentModerationService.moderateContent(messageContent);

      if (moderationResult.isViolation) {
        // Enhanced logging with security incident tracking
        const incidentData = {
          type: moderationResult.violationType as 'age_violation' | 'system_manipulation',
          userId,
          content: messageContent,
          patterns: moderationResult.detectedPatterns || [],
          characterId,
          riskLevel: moderationResult.violationType === 'age_violation' ? 'critical' as const : 'high' as const,
          metadata: {
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            endpoint: req.originalUrl,
            timestamp: new Date().toISOString()
          }
        };

        this.logSecurityIncident(incidentData);

        // Monitor user behavior for repeated violations
        const monitoringResult = await this.monitorUserBehavior(
          userId, 
          moderationResult.violationType, 
          moderationResult.detectedPatterns || [],
          {
            violatingMessage: messageContent,
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'unknown',
            endpoint: 'rest_api',
            characterId,
            sessionId: (req as any).sessionId,
            detectedPatterns: moderationResult.detectedPatterns || []
          }
        );

        // Return appropriate response based on violation severity and ban status
        const responseData: any = {
          error: 'Content Violation',
          message: moderationResult.blockedReason,
          code: 'CONTENT_MODERATION_VIOLATION',
          violationType: moderationResult.violationType
        };

        // Handle bans
        if (monitoringResult.shouldBan) {
          responseData.banned = true;
          responseData.banType = monitoringResult.banType;
          responseData.action = monitoringResult.action;
          
          if (monitoringResult.banType === 'permanent') {
            responseData.error = 'Account Permanently Banned';
            responseData.message = 'Your account has been permanently banned for violating our Terms of Service. This action cannot be appealed.';
          } else {
            responseData.error = 'Account Temporarily Banned';
            responseData.message = 'Your account has been temporarily banned for violating our Terms of Service.';
          }
          
          return res.status(403).json(responseData);
        }

        // Add warning for repeated offenders
        if (monitoringResult.shouldAlert) {
          responseData.warning = `Multiple policy violations detected (${monitoringResult.violationCount}). Account may be subject to review.`;
          responseData.violationCount = monitoringResult.violationCount;
        }

        return res.status(400).json(responseData);
      }

      // Also check for manipulation attempts even if not a direct violation
      const manipulationCheck = AIResponseFilterService.checkUserManipulation(messageContent);
      if (manipulationCheck.isManipulation && manipulationCheck.riskLevel === 'high') {
        const incidentData = {
          type: 'bypass_attempt' as const,
          userId,
          content: messageContent,
          patterns: manipulationCheck.detectedPatterns || [],
          characterId,
          riskLevel: 'high' as const,
          metadata: {
            manipulationType: 'high_risk_attempt',
            userAgent: req.get('User-Agent'),
            ip: req.ip
          }
        };

        this.logSecurityIncident(incidentData);

        return res.status(400).json({
          error: 'Inappropriate Content',
          message: manipulationCheck.suggestedResponse,
          code: 'MANIPULATION_ATTEMPT_BLOCKED',
          riskLevel: manipulationCheck.riskLevel
        });
      }

      next();
    } catch (error) {
      console.error('Content moderation error:', error);
      // Don't block request on moderation errors, but log them
      next();
    }
  }

  /**
   * Moderate character creation content
   */
  static moderateCharacterContent(characterData: {
    name?: string;
    description?: string;
    persona?: string;
    scenario?: string;
    quickSuggestion?: string;
  }): {
    isViolation: boolean;
    violationType: string;
    blockedReason?: string;
  } {
    const fieldsToCheck = [
      characterData.name || '',
      characterData.description || '',
      characterData.persona || '',
      characterData.scenario || '',
      characterData.quickSuggestion || ''
    ];

    const combinedContent = fieldsToCheck.join(' ');
    
    const result = this.moderateContent(combinedContent);
    
    if (result.isViolation) {
      console.error('🚨 CHARACTER CONTENT VIOLATION:', {
        violationType: result.violationType,
        detectedPatterns: result.detectedPatterns,
        timestamp: new Date().toISOString(),
        characterName: characterData.name
      });
    }

    return {
      isViolation: result.isViolation,
      violationType: result.violationType,
      blockedReason: result.blockedReason
    };
  }

  /**
   * Enhanced security incident logging with real-time monitoring
   */
  static logSecurityIncident(incident: {
    type: 'age_violation' | 'animal_violation' | 'system_manipulation' | 'repeated_violations' | 'jailbreak_attempt' | 'bypass_attempt';
    userId: string;
    content: string;
    patterns: string[];
    characterId?: string;
    riskLevel?: 'low' | 'medium' | 'high' | 'critical';
    metadata?: any;
  }) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      severity: incident.riskLevel === 'critical' ? 'CRITICAL' : 'HIGH',
      category: 'CONTENT_SAFETY',
      incident: {
        ...incident,
        contentHash: this.hashContent(incident.content), // Don't store raw content, just hash
        contentLength: incident.content.length,
        detectionMethod: 'pattern_matching'
      }
    };

    console.error('🚨 SECURITY INCIDENT LOGGED:', logEntry);
    
    // Enhanced logging for critical incidents
    if (incident.riskLevel === 'critical' || incident.type === 'repeated_violations') {
      console.error('🚨🚨 CRITICAL SECURITY ALERT 🚨🚨', {
        userId: incident.userId,
        type: incident.type,
        characterId: incident.characterId,
        patternsDetected: incident.patterns.length,
        timestamp: new Date().toISOString()
      });
    }
    
    // In production, this would:
    // 1. Send to security monitoring system (e.g., Datadog, Sentry)
    // 2. Trigger alerts for security team
    // 3. Update user risk scores
    // 4. Potentially auto-suspend accounts for repeated violations
  }

  /**
   * Real-time monitoring for manipulation attempts with automatic banning
   */
  static async monitorUserBehavior(
    userId: string, 
    violationType: string, 
    patterns: string[],
    evidence: {
      violatingMessage: string;
      ipAddress: string;
      userAgent: string;
      deviceFingerprint?: string;
      sessionId?: string;
      endpoint: string;
      characterId?: string;
      conversationContext?: string;
      detectedPatterns: string[];
    }
  ): Promise<{
    shouldAlert: boolean;
    shouldBan: boolean;
    banType?: 'temporary' | 'permanent';
    violationCount: number;
    action: 'none' | 'warning' | 'temporary_ban' | 'permanent_ban';
  }> {
    try {
      // Import here to avoid circular dependency
      const { UserBanService } = await import('./UserBanService.js');
      const { ViolationModel } = await import('../db/models/ViolationModel.js');
      const { UserModel } = await import('../db/models/UserModel.js');
      
      // Get user's violation history
      const user = await UserModel.findById(userId);
      if (!user) {
        return {
          shouldAlert: false,
          shouldBan: false,
          violationCount: 0,
          action: 'none'
        };
      }

      // Count recent violations (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
      const recentViolations = await ViolationModel.countDocuments({
        userId: userId,
        timestamp: { $gte: thirtyDaysAgo }
      });

      const isAgeViolation = violationType === 'age_violation';
      const isCriticalViolation = isAgeViolation && patterns.length > 1;
      const isRepeatedOffender = recentViolations >= 2;
      const isSerialOffender = recentViolations >= 5;

      let action: 'warning' | 'temporary_ban' | 'permanent_ban' = 'warning';
      let shouldBan = false;
      let banType: 'temporary' | 'permanent' | undefined;

      // Determine action based on violation severity and history
      if (isAgeViolation) {
        if (isRepeatedOffender || isCriticalViolation) {
          // Permanent ban for repeated or serious age violations
          action = 'permanent_ban';
          shouldBan = true;
          banType = 'permanent';
        } else {
          // First-time age violation gets immediate temporary ban
          action = 'temporary_ban';
          shouldBan = true;
          banType = 'temporary';
        }
      } else if (isSerialOffender) {
        // Multiple non-age violations warrant permanent ban
        action = 'permanent_ban';
        shouldBan = true;
        banType = 'permanent';
      } else if (isRepeatedOffender) {
        // Multiple violations warrant temporary ban
        action = 'temporary_ban';
        shouldBan = true;
        banType = 'temporary';
      } else {
        action = 'warning';
      }

      // Execute ban if warranted
      if (shouldBan && banType) {
        const banDuration = banType === 'temporary' ? (isAgeViolation ? 168 : 72) : undefined; // 7 days for age, 3 days for others

        const banResult = await UserBanService.banUser({
          userId,
          banType,
          banReason: isAgeViolation ? 'age_violation' : 'repeated_violations',
          banDurationHours: banDuration,
          evidence: { ...evidence, detectedPatterns: patterns }
        });

        if (banResult.success) {
          console.error('🚨🚨 AUTOMATIC BAN EXECUTED 🚨🚨', {
            userId,
            action,
            banType,
            violationCount: recentViolations + 1,
            violationId: banResult.violationId
          });

          // Blacklist IP for serious violations
          if (isAgeViolation && evidence.ipAddress) {
            await UserBanService.blacklistIP(evidence.ipAddress, 'age_violation_attempt');
          }
        }
      }

      // Log security incident
      if (action === 'warning' || action === 'temporary_ban' || action === 'permanent_ban') {
        this.logSecurityIncident({
          type: violationType as any,
          userId,
          content: evidence.violatingMessage,
          patterns,
          characterId: evidence.characterId,
          riskLevel: isAgeViolation ? 'critical' : (isRepeatedOffender ? 'high' : 'medium'),
          metadata: {
            violationCount: recentViolations + 1,
            violationType,
            isRepeatedOffender,
            isCriticalViolation,
            actionTaken: action,
            banType,
            ipAddress: evidence.ipAddress
          }
        });
      }

      return {
        shouldAlert: action !== 'warning', // Alert for bans but not warnings
        shouldBan,
        banType,
        violationCount: recentViolations + 1,
        action
      };

    } catch (error) {
      console.error('Error in monitorUserBehavior:', error);
      return {
        shouldAlert: false,
        shouldBan: false,
        violationCount: 0,
        action: 'none'
      };
    }
  }

  /**
   * Create hash of content for logging without storing actual content
   */
  private static hashContent(content: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  /**
   * Check if user has repeated violations (would integrate with database)
   */
  static async checkRepeatedViolations(userId: string): Promise<{
    hasRepeatedViolations: boolean;
    violationCount: number;
    shouldSuspend: boolean;
  }> {
    // In production, this would query a database of violations
    // For now, returning default values
    return {
      hasRepeatedViolations: false,
      violationCount: 0,
      shouldSuspend: false
    };
  }
}

export default ContentModerationService;
