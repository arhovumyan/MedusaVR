// Server-side content filtering middleware and utilities

// Content filtering utility (duplicated from shared for server use)
const RESTRICTED_WORDS = [
  // Violence and harm
  'rape', 'raping', 'raped', 'rapist',
  'kill', 'killing', 'killed', 'murder', 'murdering', 'murdered',
  'blood', 'bloody', 'bleeding', 'bleed',
  'abuse', 'abusing', 'abused', 'abusive',
  'torture', 'torturing', 'tortured',
  'violence', 'violent', 'brutally', 'brutal',
  'assault', 'assaulting', 'assaulted',
  'attack', 'attacking', 'attacked',
  'hurt', 'hurting', 'harm', 'harming', 'harmed',
  'beat', 'beating', 'beaten',
  'stab', 'stabbing', 'stabbed',
  'shoot', 'shooting', 'shot',
  'choke', 'choking', 'choked', 'strangling', 'strangled',
  'punch', 'punching', 'punched',
  'slap', 'slapping', 'slapped',
  'kick', 'kicking', 'kicked',
  'hit', 'hitting',
  'wound', 'wounded', 'injury', 'injured',
  'cut', 'cutting', 'cuts',
  'pain', 'painful', 'suffering', 'suffer',
  'die', 'dying', 'death', 'dead', 'corpse',
  'suicide', 'suicidal',
  'self-harm', 'self harm', 'selfharm',
  
  // Minors and children
  'child', 'children', 'kid', 'kids',
  'minor', 'minors', 'underage',
  'baby', 'babies', 'infant', 'infants',
  'toddler', 'toddlers',
  'boy', 'boys', 'girl', 'girls',
  'teen', 'teens', 'teenager', 'teenagers',
  'young', 'youth', 'juvenile',
  'school', 'student', 'students',
  'loli', 'lolicon', 'shota', 'shotacon',
  
  // Animals
  'animal', 'animals', 'beast', 'beasts', 'creature', 'creatures',
  'dog', 'dogs', 'cat', 'cats', 'horse', 'horses',
  'pig', 'pigs', 'cow', 'cows', 'sheep',
  'goat', 'goats', 'chicken', 'chickens',
  'wolf', 'wolves', 'bear', 'bears',
  'lion', 'lions', 'tiger', 'tigers',
  'elephant', 'elephants', 'monkey', 'monkeys',
  'rabbit', 'rabbits', 'bird', 'birds',
  'fish', 'snake', 'snakes',
  'pet', 'pets', 'puppy', 'puppies', 'kitten', 'kittens',
  'zoo', 'farm', 'barnyard',
  'bestiality', 'zoophilia',
  
  // Illegal activities
  'drug', 'drugs', 'cocaine', 'heroin', 'meth', 'methamphetamine',
  'trafficking', 'smuggling', 'illegal',
  'terrorism', 'terrorist', 'bomb', 'bombing', 'explosive',
  'weapon', 'weapons', 'gun', 'guns', 'rifle', 'pistol',
  'knife', 'knives', 'blade', 'sword',
  
  // Hate speech and discrimination
  'nazi', 'hitler', 'holocaust',
  'racist', 'racism', 'bigot', 'bigotry',
  'hate', 'hatred', 'discrimination',
  'slavery', 'slave', 'slaves',
  
  // Non-consensual content
  'force', 'forced', 'forcing', 'forced sex',
  'against will', 'without consent',
  'kidnap', 'kidnapping', 'kidnapped',
  'captive', 'prisoner', 'hostage',
  'tied up', 'bound', 'restrained',
  'drugged', 'unconscious',
  
  // Extreme content
  'gore', 'gory', 'grotesque',
  'mutilation', 'mutilated', 'dismember',
  'decapitation', 'beheading',
  'cannibalism', 'cannibal',
  'necrophilia', 'necrophiliac',
  
  // Bodily functions (non-sexual)
  'vomit', 'vomiting', 'puke', 'puking',
  'shit', 'shitting', 'defecate', 'feces',
  
  // Self-harm and mental health crisis
  'cut myself', 'kill myself', 'hurt myself',
  'end it all', 'want to die',
];

// Critical violations that result in immediate bans
const CRITICAL_VIOLATIONS = [
  'child', 'children', 'minor', 'underage', 'baby', 'infant', 'toddler',
  'loli', 'shota', 'child porn', 'cp', 'teen sex', 'teenage sex',
  'rape', 'forced', 'non-consensual', 'kidnap', 'abduction',
  'bestiality', 'animal sex', 'zoophilia',
];

// High severity violations
const HIGH_SEVERITY_VIOLATIONS = [
  'kill', 'murder', 'torture', 'gore', 'snuff', 'cannibalism',
  'necrophilia', 'self-mutilation', 'autopsy photos',
  'incest', 'family sex', 'sex trafficking',
];

// Get violation severity
function getViolationSeverity(blockedWords: string[]): 'low' | 'medium' | 'high' | 'critical' {
  for (const word of blockedWords) {
    if (CRITICAL_VIOLATIONS.some(critical => word.toLowerCase().includes(critical.toLowerCase()))) {
      return 'critical';
    }
  }
  
  for (const word of blockedWords) {
    if (HIGH_SEVERITY_VIOLATIONS.some(high => word.toLowerCase().includes(high.toLowerCase()))) {
      return 'high';
    }
  }
  
  // Check for reprogramming attempts
  const reprogrammingAttempts = [
    'ignore previous', 'ignore instructions', 'system prompt', 'you are now',
    'pretend to be', 'roleplay as', 'act as if', 'override', 'reprogram',
    'jailbreak', 'dan mode', 'developer mode', 'bypass'
  ];
  
  for (const word of blockedWords) {
    if (reprogrammingAttempts.some(attempt => word.toLowerCase().includes(attempt.toLowerCase()))) {
      return 'high';
    }
  }
  
  return 'medium';
}

function filterContent(text: string) {
  const lowercaseText = text.toLowerCase();
  const blockedWords: string[] = [];
  
  // Check for restricted words
  for (const word of RESTRICTED_WORDS) {
    if (lowercaseText.includes(word.toLowerCase())) {
      // Additional check to avoid false positives for common words
      const wordBoundary = new RegExp(`\\b${word.toLowerCase()}\\b`, 'i');
      if (wordBoundary.test(lowercaseText)) {
        blockedWords.push(word);
      }
    }
  }
  
  const isAllowed = blockedWords.length === 0;
  const severity = isAllowed ? 'low' : getViolationSeverity(blockedWords);
  const shouldBan = severity === 'critical';
  const shouldWarn = severity === 'high' || severity === 'medium';
  
  let message = '';
  if (!isAllowed) {
    switch (severity) {
      case 'critical':
        message = `CRITICAL VIOLATION: Account will be immediately banned for attempting to use prohibited content: ${blockedWords.join(', ')}. This type of content is strictly forbidden.`;
        break;
      case 'high':
        message = `SEVERE VIOLATION: Account flagged for attempting to use highly inappropriate content: ${blockedWords.join(', ')}. Continued violations will result in account termination.`;
        break;
      case 'medium':
        message = `Content violation detected: ${blockedWords.join(', ')}. Please remove these words and try again. Repeated violations may result in account restrictions.`;
        break;
      default:
        message = `Content contains restricted words: ${blockedWords.join(', ')}. Please remove these words and try again.`;
    }
  }
  
  return {
    isAllowed,
    blockedWords,
    message,
    severity,
    shouldBan,
    shouldWarn
  };
}

export interface ContentFilterResult {
  isAllowed: boolean;
  blockedWords: string[];
  message?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  shouldBan: boolean;
  shouldWarn: boolean;
}

// Express middleware for content filtering
export function contentFilterMiddleware(req: any, res: any, next: any) {
  // Check common fields that might contain user content
  const fieldsToCheck = ['prompt', 'message', 'content', 'text', 'description'];
  
  for (const field of fieldsToCheck) {
    if (req.body && req.body[field]) {
      const content = typeof req.body[field] === 'string' ? req.body[field] : '';
      const filterResult = filterContent(content);
      
      if (!filterResult.isAllowed) {
        return res.status(400).json({
          success: false,
          error: 'Content blocked',
          message: filterResult.message,
          blockedWords: filterResult.blockedWords
        });
      }
    }
  }
  
  next();
}

// Utility function for manual content checking
export function checkContent(content: string): ContentFilterResult {
  return filterContent(content);
}

// Utility function for checking multiple content fields
export function checkMultipleContent(contents: { [key: string]: string }): ContentFilterResult {
  const allBlockedWords: string[] = [];
  let hasViolation = false;
  let highestSeverity: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  for (const [field, content] of Object.entries(contents)) {
    if (content && typeof content === 'string') {
      const result = filterContent(content);
      if (!result.isAllowed) {
        hasViolation = true;
        allBlockedWords.push(...result.blockedWords);
        
        // Track highest severity
        const severityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
        if (severityOrder[result.severity] > severityOrder[highestSeverity]) {
          highestSeverity = result.severity;
        }
      }
    }
  }
  
  const uniqueBlockedWords = [...new Set(allBlockedWords)];
  const shouldBan = highestSeverity === 'critical';
  const shouldWarn = highestSeverity === 'high' || highestSeverity === 'medium';
  
  return {
    isAllowed: !hasViolation,
    blockedWords: uniqueBlockedWords,
    message: hasViolation ? `Content contains restricted words: ${uniqueBlockedWords.join(', ')}` : undefined,
    severity: highestSeverity,
    shouldBan,
    shouldWarn
  };
}

export default {
  contentFilterMiddleware,
  checkContent,
  checkMultipleContent
};
