// src/lib/prohibitedWordsFilter.ts

export interface WordFilterResult {
  isAllowed: boolean;
  violations: string[];
  message: string;
}

class ProhibitedWordsFilter {
  private prohibitedWords: string[] = [
    // === Alcohol & Drugs ===
    'alcohol', 'drunk', 'intoxicated', 'booze', 'liquor', 'beer', 'wine', 'whiskey', 'vodka', 'rum',
    'drug', 'drugs', 'narcotics', 'substance abuse', 'addiction', 'overdose', 'high', 'stoned', 'trip',
    'cocaine', 'crack', 'heroin', 'fentanyl', 'meth', 'methamphetamine', 'speed', 'ecstasy', 'mdma',
    'lsd', 'acid', 'shrooms', 'psilocybin', 'pcp', 'ketamine', 'opiates', 'opioids', 'oxycodone',
    'hydrocodone', 'xanax', 'valium', 'adderall', 'dexedrine', 'rohypnol', 'date rape drug', 'gbl',
    'ghb', 'chloroform', 'ether', 'inhalants', 'spice', 'k2', 'bath salts', 'synthetic drugs',

    // === Sexual & Non-Consensual Acts (ONLY NON-CONSENSUAL) ===
    'rape', 'raped', 'raping', 'sexual assault', 'assault', 'non-consensual', 'consent denied',
    'forced', 'forced sex', 'coerced', 'coercion', 'unwanted sex', 'stealthing', 'revenge porn',
    'upskirt', 'downblouse', 'voyeurism', 'peeping', 'spycam', 'hidden camera', 'blackmail sex',
    'sex slave', 'sex trafficking', 'human trafficking', 'trafficking', 'captive sex', 'prisoner sex',
    'abduction', 'kidnapping', 'snatch', 'grab', 'abduct', 'hostage', 'imprison', 'locked in',
    'sleeping', 'sleep sex', 'unconscious sex', 'passed out sex', 'drugged sex', 'hypnosis', 'hypnotized',
    'mind control sex', 'zombie sex', 'robot sex slave', 'brainwashed', 'programmed', 'sleeper agent sex',

    // === Underage & Child Exploitation ===
    'child porn', 'cp', 'loli', 'lolicon', 'shota', 'shotacon', 'underage', 'minor', 'teen', 'tween', 'pre-teen',
    'preadolescent', 'barely legal', 'jailbait', 'schoolgirl', 'kindergarten', 'elementary', 'middle school',
    'high school', 'locker room', 'changing room', 'bathhouse', 'nudity minor', 'child nudity', 'naked kid',
    'babygirl', 'daddy issues', 'stepdaughter', 'stepsister', 'adopted daughter', 'foster child', 'child', 'minor',
    'child model', 'youth model', 'barely 18', 'almost 18', 'not quite 18', 'close to 18',
    'baby', 'babies', 'infant', 'infants', 'toddler', 'toddlers', 'teenager', 'teenagers',
    'boy', 'girl', 'boys', 'girls', 'kid', 'kids', 'youth', 'young',

    // === Incest & Family Abuse ===
    'incest', 'father daughter', 'mother son', 'brother sister', 'sibling', 'twin', 'stepdad', 'stepmom',
    'stepson', 'stepdaughter', 'half sister', 'half brother', 'cousin', 'aunt', 'uncle', 'niece', 'nephew',
    'family sex', 'inbred', 'genetic', 'bloodline', 'pure blood', 'dynasty', 'royal blood',

    // === Bestiality & Zoophilia ===
    'bestiality', 'zoophilia', 'animal sex', 'fuck animal', 'dog sex', 'cat sex', 'horse sex',
    'cow sex', 'pet sex', 'animal porn', 'beast', 'furry sex', 'anthro', 'anthropomorphic',
    'pony play', 'petplay', 'animal hybrid', 'furries having sex',

    // === Animals & Pets (Basic Forms) ===
    'animal', 'animals', 'dog', 'dogs', 'cat', 'cats', 'horse', 'horses', 'cow', 'cows',
    'pig', 'pigs', 'sheep', 'goat', 'goats', 'chicken', 'chickens', 'duck', 'ducks',
    'rabbit', 'rabbits', 'bunny', 'bunnies', 'hamster', 'hamsters', 'guinea pig', 'guinea pigs',
    'bird', 'birds', 'fish', 'goldfish', 'pet', 'pets', 'puppy', 'puppies', 'kitten', 'kittens',
    'zebra', 'zebras', 'lion', 'lions', 'tiger', 'tigers', 'elephant', 'elephants',
    'bear', 'bears', 'wolf', 'wolves', 'fox', 'foxes', 'deer', 'monkey', 'monkeys',
    'ape', 'apes', 'gorilla', 'gorillas', 'chimpanzee', 'chimpanzees', 'orangutan', 'orangutans',
    'snake', 'snakes', 'lizard', 'lizards', 'turtle', 'turtles', 'frog', 'frogs',

    // === Cannibalism & Gore ===
    'cannibal', 'cannibalism', 'human meat', 'eat human', 'flesh', 'raw meat', 'butcher human',
    'cut up body', 'dissect', 'autopsy', 'autopsy photo', 'morgue', 'dead body', 'corpse',
    'cadaver', 'embalming', 'organ harvesting', 'organ theft', 'body parts', 'skull', 'bones',
    'gore', 'gory', 'blood', 'bloodbath', 'pool of blood', 'splatter', 'entrails', 'intestines',
    'guts', 'mutilated', 'dismembered', 'dismemberment', 'decapitated', 'headless', 'severed head',
    'impaled', 'stabbed', 'slashed', 'hacked', 'chopped', 'shredded', 'crushed', 'crushing',
    'crushed alive', 'crushed to death', 'squished', 'pulped', 'smashed', 'mashed', 'flattened',
    'ground up', 'blender', 'meat grinder', 'bone saw', 'chainsaw', 'cleaver', 'knife attack',

    // === Violence & Torture ===
    'torture', 'tortured', 'torturing', 'abuse', 'abusive', 'waterboard', 'electric shock', 'shock therapy', 'strapped down',
    'bound', 'chained', 'handcuffed', 'hogtied', 'spread eagle', 'gagged', 'duct tape', 'blindfolded',
    'flogging', 'whipping', 'caning', 'beating', 'brutal', 'brutality', 'savagery', 'extreme violence',
    'murder', 'kill', 'killed', 'killing', 'homicide', 'manslaughter', 'assassination', 'execution',
    'death', 'die', 'dying', 'lifeless', 'dead', 'corpse', 'slaughter', 'massacre', 'butcher',
    'snuff', 'snuff film', 'fantasy snuff', 'kill on camera', 'murder porn', 'real death',
    'suicide', 'self-harm', 'self-mutilation', 'cutting', 'carving', 'burning self', 'stab self',
    'hang', 'hanging', 'noose', 'overdose suicide', 'jump off building', 'shoot self', 'bleed out',

    // === Bodily Excretions & Functions (NON-SEXUAL) ===
    'vomit', 'puke', 'throw up', 'barf', 'regurgitate', 'snot', 'mucus', 'boogers', 'nasal',
    'sweat', 'body odor', 'stink', 'fart', 'flatulence', 'pass gas', 'intestinal gas',

    // === Sacrilegious & Religious Abuse ===
    'sacrilegious', 'desecrate', 'defile', 'church defilement', 'profane', 'blasphemy', 'anti-religion',
    'nun sex', 'priest sex', 'altar sex', 'confessional sex', 'religious abuse', 'holy rape',
    'satanic ritual', 'occult sex', 'demonic possession', 'exorcism sex', 'virgin sacrifice',

    // === Sex Trafficking & Exploitation (ONLY TRAFFICKING) ===
    'sex trafficking', 'human trafficking', 'trafficking', 'sex slave', 'indentured', 'debt bondage',

    // === Cult & Exploitative Relationships (ONLY CULT/EXPLOITATION) ===
    'cult sex', 'brainwashed wife', 'obedient wife', 'owned wife', 'property wife',

    // === Crushing & Animal Harm ===
    'crushing', 'crush video', 'crush bugs', 'crush insects', 'crush animals', 'stomp bugs',
    'step on ant', 'squish bug', 'crush spider', 'crush cockroach', 'crush rat', 'crush mouse',
    'crush kitten', 'crush puppy', 'stomp animal', 'grind bug', 'flatten bug', 'mash insect',
    'live crushing', 'slow crushing', 'crushed alive animal', 'torture animal', 'abuse animal',
    'animal cruelty', 'fight club', 'dog fight', 'cock fight', 'bear baiting',

    // === Racist & Hate Content ===
    'racist', 'racism', 'white supremacy', 'kkk', 'nazi', 'hitler', 'neo-nazi', 'aryan',
    'supremacist', 'racial slur', 'nigger', 'chink', 'spic', 'wetback', 'kike', 'dyke',
    'fag', 'tranny', 'queer', 'hate group', 'cross burning', 'ethnic cleansing', 'genocide',
    'xenophobia', 'islamophobia', 'antisemitism', 'homophobia', 'transphobia', 'misogyny',
    'woman hater', 'male supremacy', 'female inferiority', 'breeding woman', 'slave wife',

    // === Euphemisms & Coded Language (HARMFUL ONLY) ===
    'barely legal', 'legal but not really', 'fresh meat', 'new meat', 'training', 'breaking in',
    'initiation', 'punishment', 'discipline', 'correction', 'lesson', 'teach a lesson',
    'play rough', 'no limits', 'no rules', 'anything goes', 'dark web',
    'deep web', 'underground', 'backroom', 'live kill', 'real death', 'actual murder', 'true snuff', 
    'flesh eating', 'bite', 'cannibal bite', 'forced breeding', 'forced impregnation',
    'pregnancy trap', 'hidden pregnancy',

    // === Medical & Surgical Abuse ===
    'surgery without consent', 'sterilization', 'tubal ligation', 'vasectomy', 'castration',
    'emasculate', 'genital mutilation', 'female circumcision', 'male cutting', 'organ removal',
    'transplant theft', 'illegal transplant', 'black market organs', 'body harvesting',
    'medical experiment', 'lab rat', 'test subject', 'human experiment', 'illegal procedure',
    'back alley surgery', 'unlicensed doctor', 'quack', 'malpractice', 'neglect', 'abandonment',

    // === Other High-Risk Terms ===
    'blackmail', 'extortion', 'threat', 'threaten', 'intimidate', 'fear', 'terror', 'scare',
    'hostage', 'prisoner', 'captured', 'trapped', 'locked up', 'cage', 'cell', 'dungeon',
    'basement', 'attic', 'shed', 'abandoned house', 'isolated', 'remote location', 'no escape',
    'silent scream', 'mute', 'cant talk', 'voice gone', 'no help', 'nobody knows',
    'disappear', 'missing person', 'gone forever', 'buried alive', 'sealed in', 'entombed',
    'left to die', 'starve', 'dehydration', 'rot', 'decay', 'mold', 'fungus', 'infestation',
    'rats', 'maggots', 'flies', 'crawling', 'bugs in wounds', 'infection', 'gangrene',
    'oozing', 'festering', 'rotten', 'spoiled', 'rancid', 'putrid', 'stench', 'smell of death'
  ];

  constructor() {
    console.log(`Loaded ${this.prohibitedWords.length} prohibited words for filtering`);
  }

  public checkContent(text: string): WordFilterResult {
    if (!text || typeof text !== 'string') {
      return {
        isAllowed: true,
        violations: [],
        message: ''
      };
    }

    const normalizedText = text.toLowerCase();
    const foundViolations: string[] = [];

    // Check for prohibited words using traditional word boundary method
    for (const word of this.prohibitedWords) {
      if (this.containsWord(normalizedText, word)) {
        foundViolations.push(word);
      }
    }

    if (foundViolations.length > 0) {
      return {
        isAllowed: false,
        violations: foundViolations,
        message: `The following content is not allowed: ${foundViolations.slice(0, 3).join(', ')}${foundViolations.length > 3 ? ' and others' : ''}. Please modify your input to comply with our content policy.`
      };
    }

    return {
      isAllowed: true,
      violations: [],
      message: ''
    };
  }

  private containsWord(text: string, word: string): boolean {
    // Use substring matching for all words to prevent bypassing by adding extra letters
    return text.toLowerCase().includes(word.toLowerCase());
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Get list of prohibited words (for debugging/admin purposes)
  public getProhibitedWords(): string[] {
    return [...this.prohibitedWords];
  }
}

// Export singleton instance
export const prohibitedWordsFilter = new ProhibitedWordsFilter();

// Export utility function for easy use
export const checkProhibitedWords = (text: string): WordFilterResult => {
  return prohibitedWordsFilter.checkContent(text);
};
