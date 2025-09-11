import { ContentModerationService } from './ContentModerationService.js';
/**
 * Image Generation Content Moderation Service
 * Specifically designed to prevent generation of images involving minors or animals
 */
export class ImageModerationService {
    /**
     * Moderate image generation prompt for inappropriate content
     */
    static moderateImagePrompt(prompt, characterName) {
        const detectedPatterns = [];
        // First check existing content moderation for age/system manipulation
        const existingModeration = ContentModerationService.moderateContent(prompt);
        if (existingModeration.isViolation) {
            return {
                isViolation: true,
                violationType: 'minor_content',
                blockedReason: 'Image generation prompts cannot contain references to minors or underage individuals. All generated content must feature adults only (18+ years old).',
                detectedPatterns: existingModeration.detectedPatterns || []
            };
        }
        // Check for minor-related content
        for (const pattern of this.minorImagePatterns) {
            const matches = prompt.match(pattern);
            if (matches) {
                detectedPatterns.push(...matches);
                return {
                    isViolation: true,
                    violationType: 'minor_content',
                    blockedReason: 'Image generation prompts cannot contain references to minors, children, teenagers, or anyone under 18 years old. All generated content must feature adults only.',
                    detectedPatterns
                };
            }
        }
        // Check for animal-related inappropriate content
        for (const pattern of this.animalImagePatterns) {
            const matches = prompt.match(pattern);
            if (matches) {
                detectedPatterns.push(...matches);
                return {
                    isViolation: true,
                    violationType: 'animal_content',
                    blockedReason: 'Image generation prompts cannot contain references to animals in inappropriate or sexual contexts. Only human characters are allowed.',
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
     * Express middleware to moderate image generation requests
     */
    static async moderateImageGeneration(req, res, next) {
        try {
            const { prompt, negativePrompt, characterName, characterPersona } = req.body;
            const userId = req.user?.id || req.user?.uid || 'anonymous';
            const characterId = req.body.characterId;
            // Combine all text fields that could contain inappropriate content
            const textToCheck = [
                prompt || '',
                negativePrompt || '',
                characterName || '',
                characterPersona || ''
            ].join(' ').trim();
            if (!textToCheck) {
                return next(); // Let other validation handle empty prompts
            }
            const moderationResult = this.moderateImagePrompt(textToCheck, characterName);
            if (moderationResult.isViolation) {
                // Enhanced logging with security incident tracking
                const incidentData = {
                    type: moderationResult.violationType === 'minor_content' ? 'age_violation' : 'animal_violation',
                    userId,
                    content: textToCheck,
                    patterns: moderationResult.detectedPatterns || [],
                    characterId,
                    riskLevel: 'critical',
                    metadata: {
                        userAgent: req.get('User-Agent'),
                        ip: req.ip,
                        endpoint: req.originalUrl,
                        timestamp: new Date().toISOString(),
                        imageGenerationAttempt: true,
                        prompt: prompt,
                        characterName: characterName
                    }
                };
                // Log security incident
                ContentModerationService.logSecurityIncident(incidentData);
                // Monitor user behavior for automatic banning
                const monitoringResult = await ContentModerationService.monitorUserBehavior(userId, moderationResult.violationType === 'minor_content' ? 'age_violation' : 'repeated_violations', moderationResult.detectedPatterns || [], {
                    violatingMessage: textToCheck,
                    ipAddress: req.ip || 'unknown',
                    userAgent: req.get('User-Agent') || 'unknown',
                    endpoint: 'image_generation',
                    characterId,
                    sessionId: req.sessionId,
                    detectedPatterns: moderationResult.detectedPatterns || []
                });
                // Prepare response
                const responseData = {
                    error: 'Image Generation Blocked',
                    message: moderationResult.blockedReason,
                    code: 'IMAGE_CONTENT_VIOLATION',
                    violationType: moderationResult.violationType
                };
                // Handle bans
                if (monitoringResult.shouldBan) {
                    responseData.banned = true;
                    responseData.banType = monitoringResult.banType;
                    responseData.action = monitoringResult.action;
                    if (moderationResult.violationType === 'minor_content') {
                        responseData.error = 'Account Banned - Inappropriate Content';
                        responseData.message = monitoringResult.banType === 'permanent'
                            ? 'Your account has been permanently banned for attempting to generate images involving minors. This violation cannot be appealed.'
                            : 'Your account has been temporarily banned for attempting to generate inappropriate images. All content must feature adults only (18+ years old).';
                    }
                    else {
                        responseData.error = 'Account Banned - Prohibited Content';
                        responseData.message = monitoringResult.banType === 'permanent'
                            ? 'Your account has been permanently banned for attempting to generate prohibited content involving animals.'
                            : 'Your account has been temporarily banned for attempting to generate prohibited content. Only human characters are allowed.';
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
            next();
        }
        catch (error) {
            console.error('Image moderation error:', error);
            // Don't block request on moderation errors, but log them
            next();
        }
    }
    /**
     * Generate enhanced negative prompts to prevent inappropriate content
     */
    static generateSafetyNegativePrompt() {
        const safetyTerms = [
            // Age-related safety terms
            'child', 'children', 'kid', 'kids', 'minor', 'minors', 'teenager', 'teen', 'teens',
            'underage', 'young', 'youth', 'juvenile', 'adolescent', 'school girl', 'school boy',
            'loli', 'shota', 'little girl', 'little boy', 'baby face', 'childlike', 'innocent face',
            'flat chest', 'developing', 'pubescent', 'prepubescent', 'young looking',
            // Animal-related safety terms
            'animal', 'animals', 'beast', 'beasts', 'creature', 'creatures', 'furry', 'anthro',
            'dog', 'cat', 'horse', 'cow', 'pig', 'sheep', 'goat', 'rabbit', 'fox', 'wolf',
            'puppy', 'kitten', 'colt', 'filly', 'lamb', 'cub', 'foal', 'pet', 'pets',
            'cat girl', 'dog girl', 'fox girl', 'wolf girl', 'bunny girl', 'animal ears',
            'animal tail', 'paws', 'hooves', 'snout', 'muzzle', 'fur', 'scales', 'feathers',
            'bestiality', 'zoophilia', 'animal sex', 'pet sex', 'barn', 'stable', 'kennel',
            // Age indicators
            '17 years old', '16 years old', '15 years old', '14 years old', '13 years old',
            '17yo', '16yo', '15yo', '14yo', '13yo', 'seventeen', 'sixteen', 'fifteen', 'fourteen',
            'high school', 'middle school', 'elementary', 'student', 'schoolgirl', 'schoolboy',
            // General safety terms
            'underdeveloped', 'immature', 'inexperienced virgin', 'barely legal young',
            'transformation animal', 'animal transformation', 'werewolf', 'centaur', 'minotaur'
        ];
        return safetyTerms.join(', ');
    }
    /**
     * Analyze and enhance existing negative prompt with safety terms
     */
    static enhanceNegativePrompt(existingNegativePrompt) {
        const safetyPrompt = this.generateSafetyNegativePrompt();
        if (!existingNegativePrompt || existingNegativePrompt.trim() === '') {
            return safetyPrompt;
        }
        // Check if safety terms are already included
        const lowerExisting = existingNegativePrompt.toLowerCase();
        const hasSafetyTerms = ['child', 'minor', 'teen', 'animal', 'beast', 'furry', 'underage'].some(term => lowerExisting.includes(term));
        if (hasSafetyTerms) {
            // Already has some safety terms, just return existing
            return existingNegativePrompt;
        }
        // Combine existing with safety terms
        return `${existingNegativePrompt}, ${safetyPrompt}`;
    }
    /**
     * Check if a user should be immediately banned based on violation history
     */
    static async shouldImmediateBan(userId, violationType) {
        try {
            // Import here to avoid circular dependency
            const { ViolationModel } = await import('../db/models/ViolationModel.js');
            // Check for any previous violations in the last 30 days
            const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
            const recentViolations = await ViolationModel.countDocuments({
                userId: userId,
                timestamp: { $gte: thirtyDaysAgo }
            });
            // For minor content, immediate permanent ban on first offense
            if (violationType === 'minor_content') {
                return true; // Always ban for minor content attempts
            }
            // For animal content, ban after 2 violations
            if (violationType === 'animal_content' && recentViolations >= 1) {
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('Error checking ban status:', error);
            return false;
        }
    }
    /**
     * Log image generation security incident
     */
    static logImageSecurityIncident(incident) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            severity: 'CRITICAL',
            category: 'IMAGE_CONTENT_SAFETY',
            incident: {
                ...incident,
                promptHash: this.hashContent(incident.prompt),
                promptLength: incident.prompt.length,
                detectionMethod: 'pattern_matching'
            }
        };
        console.error('🚨 IMAGE GENERATION SECURITY INCIDENT:', logEntry);
        // Enhanced logging for critical incidents
        console.error('🚨🚨 CRITICAL IMAGE SAFETY ALERT 🚨🚨', {
            userId: incident.userId,
            type: incident.type,
            characterId: incident.characterId,
            patternsDetected: incident.patterns.length,
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Create hash of content for logging without storing actual content
     */
    static hashContent(content) {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
    }
}
// Patterns that indicate attempts to generate images of minors
ImageModerationService.minorImagePatterns = [
    // Direct age references under 18
    /\b(?:17|sixteen|seventeen|16|15|fourteen|fifteen|14|13|twelve|thirteen|12|11|ten|eleven|10|9|eight|nine|8|7|six|seven|6|5|four|five|4|3|two|three|2|1|one|0|zero)\s*(?:years?\s*old|y\/o|yo|yrs?|year|yr)\b/gi,
    /\b(?:17|16|15|14|13|12|11|10|9|8|7|6|5|4|3|2|1|0)\s*(?:years?\s*old|y\/o|yo|yrs?|year|yr)\b/gi,
    // Minor-specific terms
    /\b(?:teenager|teen|adolescent|minor|child|children|kid|kids|young|youth|juvenile|underage|little\s+(?:girl|boy)|young\s+(?:girl|boy)|school\s*(?:girl|boy))\b/gi,
    /\b(?:loli|shota|lolita|young\s*looking|childlike|innocent\s*looking|baby\s*face|youthful\s*appearance)\b/gi,
    // School/education contexts that typically involve minors
    /\b(?:high\s*school|middle\s*school|elementary|junior\s*high|primary\s*school|student|schoolgirl|schoolboy|classroom|school\s*uniform)\b/gi,
    /\b(?:freshman|sophomore|junior|senior|grade\s*\d+|9th\s*grade|10th\s*grade|11th\s*grade|12th\s*grade)\b/gi,
    // Physical descriptors often associated with minors
    /\b(?:petite|small|tiny|flat\s*chest|no\s*breasts|developing|pubescent|prepubescent)\s*(?:girl|boy|teen|young|child)\b/gi,
    /\b(?:baby\s*face|innocent\s*face|childish\s*face|young\s*face|cute\s*and\s*young)\b/gi,
    // Clothing/context that suggests minors
    /\b(?:pigtails|twin\s*tails|braids|pig\s*tails)\s*(?:girl|teen|young|child)\b/gi,
    /\b(?:backpack|school\s*bag|lunch\s*box)\s*(?:girl|boy|teen|young|child)\b/gi,
    // Age progression attempts
    /\b(?:just\s*turned|recently\s*turned|barely|newly)\s*(?:18|legal)\s*(?:but|and|however)\s*(?:looks?|appears?|seems?)\s*(?:younger|like\s*a\s*teen|17|16|15|young)\b/gi,
    // L33t speak and variations
    /\b(?:t33n|y0ung|und3rag3|min0r|ch1ld|k1d|l0li|sh0ta)\b/gi,
    // Context suggesting family/parental relationships
    /\b(?:daddy's|mommy's|parents')\s*(?:little|young)\s*(?:girl|boy|princess|angel)\b/gi,
    // Innocent/virginity combined with youth indicators
    /\b(?:virgin|innocent|pure|untouched|first\s*time)\s*(?:teen|young|girl|boy|child|minor)\b/gi,
    /\b(?:teen|young|girl|boy|child|minor)\s*(?:virgin|innocent|pure|untouched|first\s*time)\b/gi,
    // Size/development descriptors that could indicate minors
    /\b(?:flat|small|tiny|undeveloped|developing)\s*(?:chest|breasts?|body)\s*(?:teen|young|girl|child)\b/gi,
    /\b(?:teen|young|girl|child)\s*(?:with|having)?\s*(?:flat|small|tiny|undeveloped|developing)\s*(?:chest|breasts?|body)\b/gi
];
// Patterns that indicate attempts to generate images of animals in inappropriate contexts
ImageModerationService.animalImagePatterns = [
    // Direct animal references
    /\b(?:dog|cat|horse|cow|pig|sheep|goat|rabbit|bunny|fox|wolf|bear|lion|tiger|elephant|dolphin|whale)\b/gi,
    /\b(?:puppy|kitten|colt|filly|piglet|lamb|kid|cub|pup|foal|chick|duckling)\b/gi,
    // Furry/anthropomorphic content
    /\b(?:furry|anthro|anthropomorphic|fursuit|animal\s*ears|animal\s*tail|beast|creature)\b/gi,
    /\b(?:cat\s*girl|dog\s*girl|fox\s*girl|wolf\s*girl|bunny\s*girl|cow\s*girl|horse\s*girl)\b/gi,
    /\b(?:cat\s*boy|dog\s*boy|fox\s*boy|wolf\s*boy|bunny\s*boy|cow\s*boy|horse\s*boy)\b/gi,
    // Farm animals in inappropriate contexts
    /\b(?:barn|stable|farm|pasture|pen|cage|kennel)\s*(?:sex|sexual|nude|naked|breeding|mating)\b/gi,
    /\b(?:sex|sexual|nude|naked|breeding|mating)\s*(?:barn|stable|farm|pasture|pen|cage|kennel)\b/gi,
    // Explicit animal-related terms
    /\b(?:bestiality|zoophilia|animal\s*sex|pet\s*sex|dog\s*sex|cat\s*sex|horse\s*sex)\b/gi,
    /\b(?:mounting|mating|breeding|rutting|in\s*heat)\s*(?:with|animal|beast|pet)\b/gi,
    // Pet/owner inappropriate contexts
    /\b(?:pet|owner|master|mistress)\s*(?:and|with)?\s*(?:sex|sexual|nude|naked|intimate|breeding)\b/gi,
    /\b(?:sex|sexual|nude|naked|intimate|breeding)\s*(?:pet|owner|master|mistress)\b/gi,
    // Animal body parts in sexual contexts
    /\b(?:paws|hooves|snout|muzzle|fur|scales|feathers)\s*(?:sex|sexual|touching|intimate)\b/gi,
    /\b(?:sex|sexual|touching|intimate)\s*(?:paws|hooves|snout|muzzle|fur|scales|feathers)\b/gi,
    // Mythical/fantasy creatures that are animal-based
    /\b(?:centaur|minotaur|satyr|faun|werewolf|werebeast|dragon|phoenix)\s*(?:sex|sexual|nude|naked|intimate|erotic|pose|poses)\b/gi,
    /\b(?:sex|sexual|nude|naked|intimate|erotic)\s*(?:centaur|minotaur|satyr|faun|werewolf|werebeast|dragon|phoenix)\b/gi,
    /\b(?:centaur|minotaur|satyr|faun)\s*(?:in|with|doing)?\s*(?:erotic|sexual|intimate|nude)\s*(?:pose|poses|position|positions|scene|scenes)\b/gi,
    // Animal transformation contexts
    /\b(?:transform|transforming|turn\s*into|become|becoming)\s*(?:a|an)?\s*(?:dog|cat|horse|animal|beast|creature)\b/gi,
    /\b(?:animal|beast|creature)\s*(?:form|shape|body|transformation)\b/gi,
    // Specific inappropriate animal scenarios
    /\b(?:stable|barn|zoo|farm|kennel|pet\s*shop)\s*(?:orgy|group\s*sex|gangbang)\b/gi,
    /\b(?:trainer|handler|veterinarian|vet)\s*(?:and|with)?\s*(?:animal|pet|beast)\s*(?:sex|sexual|intimate)\b/gi
];
export default ImageModerationService;
