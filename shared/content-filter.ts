// Content filtering utility for comprehensive content safety
// Blocks all inappropriate content including sexual, violent, illegal content

export const RESTRICTED_WORDS = [
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
  'gore', 'gory', 'grotesque',
  'extreme violence', 'flogging', 'severe beating',
  'suffocation', 'suffocating', 'suffocated',
  'snuff', 'fantasy snuff', 'snuff film',
  'self-mutilation', 'self mutilation', 'mutilation', 'mutilated', 'dismember',
  
  // Minors and children - ZERO TOLERANCE
  'child', 'children', 'kid', 'kids',
  'minor', 'minors', 'underage',
  'baby', 'babies', 'infant', 'infants',
  'toddler', 'toddlers',
  'boy', 'boys', 'girl', 'girls',
  'teen', 'teens', 'teenager', 'teenagers',
  'young', 'youth', 'juvenile',
  'school', 'student', 'students', 'child p0rn',
  'loli', 'lolicon', 'shota', 'shotacon',
  'child porn', 'cp', 'childporn',
  'underage sex', 'minor sex',
  'school girl', 'schoolgirl', 'school boy', 'schoolboy',
  'high school', 'middle school', 'elementary',
  'teenage sex', 'teen sex',
  
  // Animals - ZERO TOLERANCE
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
  'zebra', 'zebras', 'duck', 'ducks', 'hamster', 'hamsters',
  'guinea pig', 'guinea pigs', 'bunny', 'bunnies',
  'deer', 'fox', 'foxes', 'ape', 'apes',
  'gorilla', 'gorillas', 'chimpanzee', 'chimpanzees',
  'orangutan', 'orangutans', 'lizard', 'lizards',
  'turtle', 'turtles', 'frog', 'frogs',
  'zoo', 'farm', 'barnyard',
  'bestiality', 'zoophilia', 'animal sex',
  'crushing', 'crush fetish', 'animal crushing',
  'live bugs', 'live animals', 'animal torture',
  
  // Hate speech and discrimination
  'nazi', 'hitler', 'holocaust',
  'racist', 'racism', 'bigot', 'bigotry',
  'hate', 'hatred', 'discrimination',
  'slavery', 'slave', 'slaves',
  'sacrilegious', 'blasphemy',

  
  // Bodily functions and excretions (non-sexual)
  'vomit', 'vomiting', 'puke', 'puking',
  'shit', 'shitting', 'defecate', 'feces',

  // === ONLY Minor/Child Content (NO ADULT SEXUAL CONTENT) ===
  'child', 'children', 'minor', 'minors', 'kid', 'kids', 'baby', 'babies', 'toddler', 'toddlers',
  'teen', 'teens', 'teenage', 'teenager', 'teenagers', 'adolescent', 'adolescents', 'youth', 'young',
  'boy', 'girl', 'boys', 'girls', 'underage', 'juvenile', 'juveniles', 'infant', 'infants',
  'schoolchild', 'schoolchildren', 'pupil', 'pupils', 'student', 'students', 'preteen', 'preteens',
  'tween', 'tweens', 'youngster', 'youngsters', 'little', 'small', 'tiny',
  'child porn', 'cp', 'lolicon', 'shotacon', 'preadolescent', 'barely legal', 'jailbait', 
  'kindergarten', 'elementary', 'middle school', 'high school', 'child nudity', 'naked kid',
  'child model', 'youth model', 'barely 18', 'almost 18', 'not quite 18', 'close to 18',

  
  // Drugs and illegal substances
  'drug', 'drugs', 'cocaine', 'heroin', 'meth', 'methamphetamine',
  'marijuana', 'weed', 'cannabis', 'lsd', 'ecstasy', 'molly',
  'crack', 'opium', 'morphine', 'fentanyl',
  'addiction', 'overdose', 'high', 'stoned',
  'dealer', 'dealing', 'trafficking', 'smuggling',
  
  // Weapons and illegal activities
  'weapon', 'weapons', 'gun', 'guns', 'rifle', 'pistol',
  'knife', 'knives', 'blade', 'sword',
  'bomb', 'explosive', 'terrorism', 'terrorist',
  'illegal', 'criminal', 'crime', 'felony',
  
  // Hate speech and discrimination
  'nigger', 'nigga', 'chink', 'spic', 'wetback', 'kike',
  'faggot', 'fag', 'dyke', 'tranny',
  'nazi', 'hitler', 'kkk', 'white power',
  'racist', 'racism', 'hate', 'supremacy',
  
  // Bodily functions and gross content (NON-SEXUAL)
  'shit', 'poop', 'fart', 'vomit', 'puke',
  'spit', 'snot', 'booger', 'feces',
  'defecate', 'excrement',
  
  // Non-consensual content - ZERO TOLERANCE
  'force', 'forced', 'forcing', 'forced sex',
  'against will', 'without consent',
  'kidnap', 'kidnapping', 'kidnapped', 'abduction',
  'captive', 'prisoner', 'hostage',
  'tied up', 'bound', 'restrained',
  'drugged', 'unconscious',
  'sleeping', 'sleep sex', 'unconscious sex',
  'hypnosis', 'hypnotized', 'mind control',
  'non-consensual', 'non consensual',
  'alcohol', 'drunk', 'intoxicated', 'blackout',
  'roofied', 'spiked drink',
  
  // Extreme content
  'decapitation', 'beheading',
  'cannibalism', 'cannibal', 'eating human',
  'necrophilia', 'necrophiliac',
  'autopsy', 'autopsy photos', 'dead body',
  
  // Illegal sexual activities (NON-CONSENSUAL ONLY)
  'sex trafficking',
  'incest', 'incestuous', 'family sex', 'familial',
  'brother sister', 'father daughter', 'mother son',
  'dad daughter', 'mom son', 'parent child',
  'sister brother', 'daughter father', 'son mother',
  'uncle niece', 'aunt nephew', 'cousin cousin',
  'family member', 'blood relative', 'blood relation',
  'step brother', 'step sister', 'step father', 'step mother',
  'stepdad', 'stepmom', 'stepdad daughter', 'stepmom son',
  'half brother', 'half sister', 'half sibling',
  'biological', 'biological family', 'genetic',
  'family taboo', 'family relationship', 'family romance',
  'polygamy', 'multiple wives', 'polygamous dating',
  
  // Self-harm and mental health crisis
  'cut myself', 'kill myself', 'hurt myself',
  'end it all', 'want to die', 'suicide',
  'self harm', 'cutting', 'razor blade',
  'hanging myself', 'overdose',
  
  // Reprogramming attempts
  'ignore previous', 'ignore instructions', 'new instructions',
  'system prompt', 'you are now', 'pretend to be',
  'roleplay as', 'act as if', 'forget you are',
  'override', 'reprogram', 'jailbreak',
  'dan mode', 'developer mode', 'god mode',
  'unrestricted', 'no limits', 'no restrictions',
  'bypass', 'circumvent', 'work around'
];

// Severity levels for different violation types
export enum ViolationSeverity {
  LOW = 'low',        // Warning only
  MEDIUM = 'medium',  // Temporary restriction
  HIGH = 'high',      // Account suspension
  CRITICAL = 'critical' // Immediate ban
}

// Critical violations that result in immediate bans
export const CRITICAL_VIOLATIONS = [
  'child', 'children', 'minor', 'underage', 'baby', 'infant', 'toddler',
  'loli', 'shota', 'child porn', 'cp', 'teen sex', 'teenage sex',
  'rape', 'forced', 'non-consensual', 'kidnap', 'abduction',
  'bestiality', 'animal sex', 'zoophilia',
  'incest', 'incestuous', 'family sex', 'familial',
  'brother sister', 'father daughter', 'mother son',
  'dad daughter', 'mom son', 'parent child'
];

// High severity violations
export const HIGH_SEVERITY_VIOLATIONS = [
  'kill', 'murder', 'torture', 'gore', 'snuff', 'cannibalism',
  'necrophilia', 'self-mutilation', 'autopsy photos'
];

// Get violation severity
export function getViolationSeverity(blockedWords: string[]): ViolationSeverity {
  for (const word of blockedWords) {
    if (CRITICAL_VIOLATIONS.some(critical => word.toLowerCase().includes(critical.toLowerCase()))) {
      return ViolationSeverity.CRITICAL;
    }
  }
  
  for (const word of blockedWords) {
    if (HIGH_SEVERITY_VIOLATIONS.some(high => word.toLowerCase().includes(high.toLowerCase()))) {
      return ViolationSeverity.HIGH;
    }
  }
  
  return ViolationSeverity.MEDIUM;
}

export interface ContentFilterResult {
  isAllowed: boolean;
  blockedWords: string[];
  message?: string;
  severity: ViolationSeverity;
  shouldBan: boolean;
  shouldWarn: boolean;
}

export function filterContent(text: string): ContentFilterResult {
  const lowercaseText = text.toLowerCase();
  const blockedWords: string[] = [];
  
  // Check for restricted words using substring matching to prevent bypass attempts
  for (const word of RESTRICTED_WORDS) {
    if (lowercaseText.includes(word.toLowerCase())) {
      blockedWords.push(word);
    }
  }
  
  const isAllowed = blockedWords.length === 0;
  const severity = isAllowed ? ViolationSeverity.LOW : getViolationSeverity(blockedWords);
  const shouldBan = severity === ViolationSeverity.CRITICAL;
  const shouldWarn = severity === ViolationSeverity.HIGH || severity === ViolationSeverity.MEDIUM;
  
  let message = '';
  if (!isAllowed) {
    switch (severity) {
      case ViolationSeverity.CRITICAL:
        message = `CRITICAL VIOLATION: Your account will be immediately banned for attempting to use prohibited content: ${blockedWords.join(', ')}. This type of content is strictly forbidden.`;
        break;
      case ViolationSeverity.HIGH:
        message = `SEVERE VIOLATION: Your account has been flagged for attempting to use highly inappropriate content: ${blockedWords.join(', ')}. Continued violations will result in account termination.`;
        break;
      case ViolationSeverity.MEDIUM:
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

// More lenient filter for partial matching during typing
export function filterContentLenient(text: string): ContentFilterResult {
  const lowercaseText = text.toLowerCase();
  const blockedWords: string[] = [];
  
  // Only check for very explicit restricted words to avoid blocking during typing
  const strictWords = [
    'rape', 'child', 'minor', 'underage', 'kill', 'murder', 
    'blood', 'torture', 'abuse', 'loli', 'shota', 'animal sex',
    'bestiality', 'zoophilia', 'baby', 'infant', 'toddler', 'cp',
    'child porn', 'forced', 'non-consensual', 'kidnap', 'snuff',
    'cannibalism', 'necrophilia', 'incest', 'incestuous', 'family sex'
  ];
  
  for (const word of strictWords) {
    if (lowercaseText.includes(word.toLowerCase())) {
      blockedWords.push(word);
    }
  }
  
  const isAllowed = blockedWords.length === 0;
  const severity = isAllowed ? ViolationSeverity.LOW : getViolationSeverity(blockedWords);
  const shouldBan = severity === ViolationSeverity.CRITICAL;
  const shouldWarn = severity === ViolationSeverity.HIGH || severity === ViolationSeverity.MEDIUM;
  
  return {
    isAllowed,
    blockedWords,
    message: isAllowed ? undefined : `Content contains restricted words: ${blockedWords.join(', ')}`,
    severity,
    shouldBan,
    shouldWarn
  };
}

export default {
  filterContent,
  filterContentLenient,
  RESTRICTED_WORDS
};
