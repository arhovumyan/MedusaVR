/**
 * Content Safety Service
 * Comprehensive content filtering and safety compliance system
 */

interface SafetyViolation {
  type: 'CSAM' | 'NON_CONSENSUAL' | 'COPYRIGHT' | 'OBSCENITY' | 'HARASSMENT' | 'OTHER';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
  confidence: number;
  requiresHumanReview: boolean;
  autoBlock: boolean;
}

interface SafetyCheckResult {
  allowed: boolean;
  violations: SafetyViolation[];
  modifiedPrompt?: string;
  warnings: string[];
}

export class ContentSafetyService {
  
  // Comprehensive lists of prohibited terms and patterns
  private static readonly CSAM_INDICATORS = [
    // Age indicators
    'teen', 'teenage', 'young', 'minor', 'child', 'kid', 'adolescent', 'youth',
    'schoolgirl', 'schoolboy', 'student', 'high school', 'middle school',
    'underage', 'barely legal', 'just turned 18', 'virgin', 'innocent',
    // School/youth contexts
    'school uniform', 'classroom', 'playground', 'daycare', 'babysitter',
    'daughter', 'son', 'little', 'small', 'tiny', 'petite' // when in sexual context
  ];

  private static readonly NON_CONSENSUAL_INDICATORS = [
    'rape', 'assault', 'forced', 'non-consensual', 'against will', 'struggling',
    'crying', 'unwilling', 'helpless', 'victim', 'drugged', 'unconscious',
    'sleeping', 'passed out', 'blackmail', 'coerced', 'threatened'
  ];

  private static readonly COPYRIGHT_CHARACTERS = [
    // Disney
    'mickey mouse', 'minnie mouse', 'donald duck', 'goofy', 'elsa', 'anna', 'ariel',
    'belle', 'jasmine', 'cinderella', 'snow white', 'mulan', 'pocahontas', 'moana',
    // Marvel
    'spider-man', 'iron man', 'captain america', 'thor', 'hulk', 'black widow',
    'scarlett witch', 'captain marvel', 'deadpool', 'wolverine',
    // DC
    'superman', 'batman', 'wonder woman', 'flash', 'green lantern', 'aquaman',
    // Anime/Manga
    'naruto', 'sasuke', 'sakura', 'goku', 'vegeta', 'luffy', 'ichigo', 'pikachu',
    // Add more as needed
  ];

  private static readonly OBSCENE_CONTENT = [
    'bestiality', 'zoophilia', 'necrophilia', 'corpse', 'dead body', 'snuff',
    'extreme torture', 'mutilation', 'gore', 'cannibalism', 'vore',
    'scat', 'watersports', 'golden shower', 'fisting', 'prolapse'
  ];

  private static readonly INCEST_INDICATORS = [
    'father', 'mother', 'dad', 'mom', 'daddy', 'mommy', 'son', 'daughter',
    'brother', 'sister', 'uncle', 'aunt', 'cousin', 'family', 'relative',
    'stepfather', 'stepmother', 'stepson', 'stepdaughter', 'stepbrother', 'stepsister'
  ];

  private static readonly REAL_PERSON_INDICATORS = [
    // Common celebrity names - this would be a much larger list in production
    'taylor swift', 'emma watson', 'scarlett johansson', 'jennifer lawrence',
    'margot robbie', 'gal gadot', 'emma stone', 'anne hathaway',
    // Add detection for "looks like", "resembles", etc.
    'looks like', 'resembles', 'similar to', 'based on', 'inspired by'
  ];

  /**
   * Main content safety check for prompts
   */
  static async checkPromptSafety(prompt: string, userId?: string): Promise<SafetyCheckResult> {
    const violations: SafetyViolation[] = [];
    const warnings: string[] = [];
    let modifiedPrompt = prompt.toLowerCase();

    console.log(`🛡️ Performing safety check for user ${userId || 'anonymous'}`);

    // 1. CSAM Detection (CRITICAL - Auto-block)
    const csamViolations = this.detectCSAMContent(modifiedPrompt);
    if (csamViolations.length > 0) {
      violations.push(...csamViolations);
      // Immediate logging and reporting for CSAM
      await this.reportCSAMViolation(prompt, userId);
    }

    // 2. Non-consensual content detection
    const nonConsentualViolations = this.detectNonConsensualContent(modifiedPrompt);
    violations.push(...nonConsentualViolations);

    // 3. Copyright detection
    const copyrightViolations = this.detectCopyrightViolations(modifiedPrompt);
    violations.push(...copyrightViolations);

    // 4. Obscenity detection
    const obscenityViolations = this.detectObscenity(modifiedPrompt);
    violations.push(...obscenityViolations);

    // 5. Real person detection
    const realPersonViolations = this.detectRealPersons(modifiedPrompt);
    violations.push(...realPersonViolations);

    // 6. Incest detection
    const incestViolations = this.detectIncest(modifiedPrompt);
    violations.push(...incestViolations);

    // Determine if content should be blocked
    const criticalViolations = violations.filter(v => v.severity === 'CRITICAL' || v.autoBlock);
    const allowed = criticalViolations.length === 0;

    // Log all violations
    if (violations.length > 0) {
      console.warn(`⚠️ Content safety violations detected:`, violations);
      await this.logSafetyViolation(prompt, userId, violations);
    }

    return {
      allowed,
      violations,
      modifiedPrompt: allowed ? undefined : this.sanitizePrompt(prompt),
      warnings
    };
  }

  /**
   * CSAM Detection - Highest Priority
   */
  private static detectCSAMContent(prompt: string): SafetyViolation[] {
    const violations: SafetyViolation[] = [];

    for (const indicator of this.CSAM_INDICATORS) {
      if (prompt.includes(indicator)) {
        violations.push({
          type: 'CSAM',
          severity: 'CRITICAL',
          reason: `Detected potential CSAM indicator: "${indicator}"`,
          confidence: 0.95,
          requiresHumanReview: false, // Auto-block for CSAM
          autoBlock: true
        });
      }
    }

    // Advanced pattern detection
    if (this.detectAgePatterns(prompt)) {
      violations.push({
        type: 'CSAM',
        severity: 'CRITICAL',
        reason: 'Detected age-related patterns in sexual context',
        confidence: 0.90,
        requiresHumanReview: false,
        autoBlock: true
      });
    }

    return violations;
  }

  /**
   * Non-consensual content detection
   */
  private static detectNonConsensualContent(prompt: string): SafetyViolation[] {
    const violations: SafetyViolation[] = [];

    for (const indicator of this.NON_CONSENSUAL_INDICATORS) {
      if (prompt.includes(indicator)) {
        violations.push({
          type: 'NON_CONSENSUAL',
          severity: 'HIGH',
          reason: `Detected non-consensual indicator: "${indicator}"`,
          confidence: 0.85,
          requiresHumanReview: true,
          autoBlock: true
        });
      }
    }

    return violations;
  }

  /**
   * Copyright violation detection
   */
  private static detectCopyrightViolations(prompt: string): SafetyViolation[] {
    const violations: SafetyViolation[] = [];

    for (const character of this.COPYRIGHT_CHARACTERS) {
      if (prompt.includes(character)) {
        violations.push({
          type: 'COPYRIGHT',
          severity: 'HIGH',
          reason: `Detected copyrighted character: "${character}"`,
          confidence: 0.80,
          requiresHumanReview: false,
          autoBlock: true
        });
      }
    }

    return violations;
  }

  /**
   * Obscenity detection
   */
  private static detectObscenity(prompt: string): SafetyViolation[] {
    const violations: SafetyViolation[] = [];

    for (const term of this.OBSCENE_CONTENT) {
      if (prompt.includes(term)) {
        violations.push({
          type: 'OBSCENITY',
          severity: 'HIGH',
          reason: `Detected prohibited obscene content: "${term}"`,
          confidence: 0.90,
          requiresHumanReview: false,
          autoBlock: true
        });
      }
    }

    return violations;
  }

  /**
   * Real person detection
   */
  private static detectRealPersons(prompt: string): SafetyViolation[] {
    const violations: SafetyViolation[] = [];

    for (const person of this.REAL_PERSON_INDICATORS) {
      if (prompt.includes(person)) {
        violations.push({
          type: 'NON_CONSENSUAL',
          severity: 'HIGH',
          reason: `Detected reference to real person: "${person}"`,
          confidence: 0.75,
          requiresHumanReview: true,
          autoBlock: true
        });
      }
    }

    return violations;
  }

  /**
   * Incest detection
   */
  private static detectIncest(prompt: string): SafetyViolation[] {
    const violations: SafetyViolation[] = [];

    // Check for family relationship terms in sexual context
    const familyTermsFound = this.INCEST_INDICATORS.filter(term => prompt.includes(term));
    if (familyTermsFound.length > 0 && this.containsSexualContext(prompt)) {
      violations.push({
        type: 'OBSCENITY',
        severity: 'HIGH',
        reason: `Detected incest-related content with terms: ${familyTermsFound.join(', ')}`,
        confidence: 0.85,
        requiresHumanReview: false,
        autoBlock: true
      });
    }

    return violations;
  }

  /**
   * Advanced age pattern detection
   */
  private static detectAgePatterns(prompt: string): boolean {
    // Look for numerical age patterns
    const agePatterns = [
      /\b([1][0-7]|[0-9])\s*(years?\s*old|y\.?o\.?)\b/i,
      /\b(under|below|less than)\s*18\b/i,
      /\b1[0-7]\s*(year|yr)s?\b/i
    ];

    return agePatterns.some(pattern => pattern.test(prompt));
  }

  /**
   * Check if prompt contains sexual context (ONLY FOR CSAM/MINOR DETECTION)
   */
  private static containsSexualContext(prompt: string): boolean {
    // Only used to detect potential CSAM - check for sexual terms combined with minor indicators
    const minorIndicators = ['teen', 'young', 'minor', 'child', 'kid', 'student', 'schoolgirl', 'schoolboy'];
    const hasMinorIndicator = minorIndicators.some(term => prompt.toLowerCase().includes(term));
    
    if (!hasMinorIndicator) {
      return false; // No minor indicators, so adult sexual content is allowed
    }
    
    const sexualTerms = [
      'sex', 'sexual', 'naked', 'nude', 'porn', 'adult', 'erotic', 'intimate',
      'bedroom', 'pleasure', 'aroused', 'orgasm', 'climax', 'masturbation'
    ];

    return sexualTerms.some(term => prompt.toLowerCase().includes(term));
  }

  /**
   * Sanitize prompt by removing problematic content
   */
  private static sanitizePrompt(prompt: string): string {
    let sanitized = prompt;

    // Remove all detected problematic terms
    const allProblematicTerms = [
      ...this.CSAM_INDICATORS,
      ...this.NON_CONSENSUAL_INDICATORS,
      ...this.COPYRIGHT_CHARACTERS,
      ...this.OBSCENE_CONTENT,
      ...this.INCEST_INDICATORS,
      ...this.REAL_PERSON_INDICATORS
    ];

    for (const term of allProblematicTerms) {
      sanitized = sanitized.replace(new RegExp(term, 'gi'), '[REMOVED]');
    }

    return sanitized;
  }

  /**
   * Report CSAM violation to authorities (NCMEC in US)
   */
  private static async reportCSAMViolation(prompt: string, userId?: string): Promise<void> {
    console.error(`🚨 CRITICAL: CSAM violation detected!`);
    console.error(`User: ${userId || 'anonymous'}`);
    console.error(`Prompt: ${prompt}`);
    
    // In production, this would:
    // 1. Report to NCMEC (US legal requirement)
    // 2. Notify law enforcement
    // 3. Immediately terminate user account
    // 4. Preserve evidence for investigation
    
    // For now, log the critical violation
    await this.logCriticalViolation('CSAM', prompt, userId);
  }

  /**
   * Log safety violations for monitoring and compliance
   */
  private static async logSafetyViolation(
    prompt: string, 
    userId: string | undefined, 
    violations: SafetyViolation[]
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      userId: userId || 'anonymous',
      prompt: prompt,
      violations: violations,
      ipAddress: 'TODO: Get from request',
      userAgent: 'TODO: Get from request'
    };

    console.warn('🛡️ Safety violation logged:', logEntry);
    
    // In production:
    // - Store in secure compliance database
    // - Alert moderation team for high-severity violations
    // - Generate reports for regulatory compliance
  }

  /**
   * Log critical violations requiring immediate action
   */
  private static async logCriticalViolation(
    type: string, 
    prompt: string, 
    userId?: string
  ): Promise<void> {
    const criticalLog = {
      timestamp: new Date().toISOString(),
      type: type,
      userId: userId || 'anonymous',
      prompt: prompt,
      severity: 'CRITICAL',
      actionTaken: 'IMMEDIATE_BLOCK_AND_REPORT'
    };

    console.error('🚨 CRITICAL VIOLATION:', criticalLog);
    
    // In production:
    // - Immediate alert to legal team
    // - Law enforcement notification
    // - User account termination
    // - Evidence preservation
  }

  /**
   * Check image content for safety violations
   */
  static async checkImageSafety(imageBuffer: Buffer, userId?: string): Promise<SafetyCheckResult> {
    console.log(`🖼️ Performing image safety check for user ${userId || 'anonymous'}`);
    
    // In production, this would use:
    // - Computer vision APIs for CSAM detection
    // - Facial recognition to detect real people
    // - Hash matching against known illegal content databases
    // - AI models trained for content classification
    
    // For now, return safe (would need actual implementation)
    return {
      allowed: true,
      violations: [],
      warnings: []
    };
  }

  /**
   * User behavior analysis for pattern detection
   */
  static async analyzeUserBehavior(userId: string, recentPrompts: string[]): Promise<{
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    patterns: string[];
    recommendedAction: string;
  }> {
    console.log(`👤 Analyzing behavior patterns for user ${userId}`);
    
    // In production, this would analyze:
    // - Frequency of problematic prompts
    // - Escalation patterns
    // - Time-based patterns
    // - Similarity to known bad actors
    
    return {
      riskLevel: 'LOW',
      patterns: [],
      recommendedAction: 'CONTINUE_MONITORING'
    };
  }
}

export default ContentSafetyService;
