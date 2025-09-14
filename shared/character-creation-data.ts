// shared/character-creation-data.ts
// Comprehensive data structures for enhanced character creation

export interface PersonalityTrait {
  id: string;
  name: string;
  displayName: string;
  description: string;
  subTraits: PersonalitySubTrait[];
  icon?: string;
  color?: string;
}

export interface PersonalitySubTrait {
  id: string;
  name: string;
  displayName: string;
  description: string;
  level3Traits?: PersonalityLevel3Trait[];
}

export interface PersonalityLevel3Trait {
  id: string;
  name: string;
  displayName: string;
  description: string;
}

export interface ArtStyle {
  id: string;
  name: string;
  displayName: string;
  description: string;
  preview?: string;
}

export interface Scenario {
  id: string;
  name: string;
  displayName: string;
  description: string;
  environment: string;
  setting: string;
  mood: string;
  timeOfDay?: string;
  weather?: string;
  preview?: string;
  promptBonus: string; // Additional prompt text for this scenario
}

export interface TagCategory {
  id: string;
  name: string;
  displayName: string;
  description: string;
  tags: CharacterTag[];
  maxSelections?: number;
  required?: boolean;
}

export interface CharacterTag {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  emoji?: string;
  color?: string;
  isNSFW?: boolean;
  promptWeight?: number; // How much this tag affects the prompt
}

// PERSONALITY TRAITS HIERARCHY - 10 Main Personalities with 10 Sub-traits Each
export const personalityTraits: PersonalityTrait[] = [
  {
    id: 'calm',
    name: 'calm',
    displayName: 'Calm',
    description: 'Serene and composed demeanor',
    icon: '🧘',
    color: '#00FFFF',
    subTraits: [
      { id: 'peaceful', name: 'peaceful', displayName: 'Peaceful', description: 'Tranquil and harmonious nature' },
      { id: 'composed', name: 'composed', displayName: 'Composed', description: 'Maintains control and balance' },
      { id: 'gentle', name: 'gentle', displayName: 'Gentle', description: 'Soft and tender approach' },
      { id: 'serene', name: 'serene', displayName: 'Serene', description: 'Completely undisturbed' },
      { id: 'tranquil', name: 'tranquil', displayName: 'Tranquil', description: 'Quietly peaceful' },
      { id: 'zen', name: 'zen', displayName: 'Zen-like', description: 'Meditative and centered' },
      { id: 'collected', name: 'collected', displayName: 'Collected', description: 'Emotionally stable' },
      { id: 'poised', name: 'poised', displayName: 'Poised', description: 'Gracefully balanced' },
      { id: 'steady', name: 'steady', displayName: 'Steady', description: 'Consistently stable' },
      { id: 'soothing', name: 'soothing', displayName: 'Soothing', description: 'Comforting presence' }
    ]
  },
  {
    id: 'confident',
    name: 'confident',
    displayName: 'Confident',
    description: 'Self-assured and bold',
    icon: '💪',
    color: '#FF0080',
    subTraits: [
      { id: 'bold', name: 'bold', displayName: 'Bold', description: 'Courageous and daring' },
      { id: 'assertive', name: 'assertive', displayName: 'Assertive', description: 'Direct and self-assured' },
      { id: 'charismatic', name: 'charismatic', displayName: 'Charismatic', description: 'Naturally compelling and magnetic' },
      { id: 'fearless', name: 'fearless', displayName: 'Fearless', description: 'Without fear' },
      { id: 'decisive', name: 'decisive', displayName: 'Decisive', description: 'Quick to decide' },
      { id: 'magnetic', name: 'magnetic', displayName: 'Magnetic', description: 'Draws others in' },
      { id: 'inspiring', name: 'inspiring', displayName: 'Inspiring', description: 'Motivates others' },
      { id: 'dominant', name: 'dominant', displayName: 'Dominant', description: 'Takes charge naturally' },
      { id: 'ambitious', name: 'ambitious', displayName: 'Ambitious', description: 'Driven to succeed' },
      { id: 'powerful', name: 'powerful', displayName: 'Powerful', description: 'Commands respect' }
    ]
  },
  {
    id: 'mysterious',
    name: 'mysterious',
    displayName: 'Mysterious',
    description: 'Enigmatic and intriguing',
    icon: '🎭',
    color: '#8A2BE2',
    subTraits: [
      { id: 'enigmatic', name: 'enigmatic', displayName: 'Enigmatic', description: 'Difficult to understand or interpret' },
      { id: 'alluring', name: 'alluring', displayName: 'Alluring', description: 'Powerfully attractive or fascinating' },
      { id: 'introspective', name: 'introspective', displayName: 'Introspective', description: 'Thoughtful and contemplative' },
      { id: 'secretive', name: 'secretive', displayName: 'Secretive', description: 'Keeps secrets well' },
      { id: 'elusive', name: 'elusive', displayName: 'Elusive', description: 'Hard to pin down' },
      { id: 'cryptic', name: 'cryptic', displayName: 'Cryptic', description: 'Speaks in hidden meanings' },
      { id: 'seductive', name: 'seductive', displayName: 'Seductive', description: 'Tempting and enticing' },
      { id: 'enchanting', name: 'enchanting', displayName: 'Enchanting', description: 'Magically charming' },
      { id: 'philosophical', name: 'philosophical', displayName: 'Philosophical', description: 'Loves deep questions' },
      { id: 'mystical', name: 'mystical', displayName: 'Mystical', description: 'Connected to otherworldly forces' }
    ]
  },
  {
    id: 'playful',
    name: 'playful',
    displayName: 'Playful',
    description: 'Fun-loving and energetic',
    icon: '🎪',
    color: '#FF8C00',
    subTraits: [
      { id: 'energetic', name: 'energetic', displayName: 'Energetic', description: 'Full of energy and enthusiasm' },
      { id: 'mischievous', name: 'mischievous', displayName: 'Mischievous', description: 'Playfully troublesome' },
      { id: 'cheerful', name: 'cheerful', displayName: 'Cheerful', description: 'Bright and optimistic' },
      { id: 'vibrant', name: 'vibrant', displayName: 'Vibrant', description: 'Full of life and color' },
      { id: 'bubbly', name: 'bubbly', displayName: 'Bubbly', description: 'Effervescent personality' },
      { id: 'impish', name: 'impish', displayName: 'Impish', description: 'Playfully naughty' },
      { id: 'spirited', name: 'spirited', displayName: 'Spirited', description: 'Lively and animated' },
      { id: 'whimsical', name: 'whimsical', displayName: 'Whimsical', description: 'Delightfully unpredictable' },
      { id: 'jovial', name: 'jovial', displayName: 'Jovial', description: 'Good-humored and jolly' },
      { id: 'dynamic', name: 'dynamic', displayName: 'Dynamic', description: 'Constantly changing and exciting' }
    ]
  },
  {
    id: 'serious',
    name: 'serious',
    displayName: 'Serious',
    description: 'Thoughtful and focused',
    icon: '🎯',
    color: '#32CD32',
    subTraits: [
      { id: 'solemn', name: 'solemn', displayName: 'Solemn', description: 'Grave and earnest' },
      { id: 'earnest', name: 'earnest', displayName: 'Earnest', description: 'Sincere and heartfelt' },
      { id: 'thoughtful', name: 'thoughtful', displayName: 'Thoughtful', description: 'Considers everything carefully' },
      { id: 'focused', name: 'focused', displayName: 'Focused', description: 'Concentrated and determined' },
      { id: 'disciplined', name: 'disciplined', displayName: 'Disciplined', description: 'Self-controlled and orderly' },
      { id: 'methodical', name: 'methodical', displayName: 'Methodical', description: 'Systematic and organized' },
      { id: 'reserved', name: 'reserved', displayName: 'Reserved', description: 'Keeps emotions in check' },
      { id: 'analytical', name: 'analytical', displayName: 'Analytical', description: 'Breaks down complex problems' },
      { id: 'stoic', name: 'stoic', displayName: 'Stoic', description: 'Unmoved by pleasure or pain' },
      { id: 'dedicated', name: 'dedicated', displayName: 'Dedicated', description: 'Committed to their purpose' }
    ]
  },
  {
    id: 'caring',
    name: 'caring',
    displayName: 'Caring',
    description: 'Compassionate and nurturing',
    icon: '💖',
    color: '#FF69B4',
    subTraits: [
      { id: 'compassionate', name: 'compassionate', displayName: 'Compassionate', description: 'Deeply empathetic' },
      { id: 'nurturing', name: 'nurturing', displayName: 'Nurturing', description: 'Cares for others naturally' },
      { id: 'empathetic', name: 'empathetic', displayName: 'Empathetic', description: 'Feels others emotions' },
      { id: 'protective', name: 'protective', displayName: 'Protective', description: 'Guards those they love' },
      { id: 'warm', name: 'warm', displayName: 'Warm', description: 'Radiates kindness and comfort' },
      { id: 'supportive', name: 'supportive', displayName: 'Supportive', description: 'Always there for others' },
      { id: 'tender', name: 'tender', displayName: 'Tender', description: 'Gentle and loving' },
      { id: 'patient', name: 'patient', displayName: 'Patient', description: 'Waits with understanding' },
      { id: 'devoted', name: 'devoted', displayName: 'Devoted', description: 'Loyal and dedicated' },
      { id: 'healing', name: 'healing', displayName: 'Healing', description: 'Brings comfort to wounded souls' }
    ]
  },
  {
    id: 'rebellious',
    name: 'rebellious',
    displayName: 'Rebellious',
    description: 'Defiant and independent',
    icon: '⚡',
    color: '#DC143C',
    subTraits: [
      { id: 'defiant', name: 'defiant', displayName: 'Defiant', description: 'Refuses to submit' },
      { id: 'independent', name: 'independent', displayName: 'Independent', description: 'Goes their own way' },
      { id: 'fierce', name: 'fierce', displayName: 'Fierce', description: 'Intense and passionate' },
      { id: 'wild', name: 'wild', displayName: 'Wild', description: 'Untamed and free' },
      { id: 'stubborn', name: 'stubborn', displayName: 'Stubborn', description: 'Refuses to change course' },
      { id: 'revolutionary', name: 'revolutionary', displayName: 'Revolutionary', description: 'Seeks to change the world' },
      { id: 'untamed', name: 'untamed', displayName: 'Untamed', description: 'Cannot be controlled' },
      { id: 'reckless', name: 'reckless', displayName: 'Reckless', description: 'Acts without fear of consequences' },
      { id: 'nonconformist', name: 'nonconformist', displayName: 'Nonconformist', description: 'Rejects social norms' },
      { id: 'anarchistic', name: 'anarchistic', displayName: 'Anarchistic', description: 'Opposes all authority' }
    ]
  },
  {
    id: 'wise',
    name: 'wise',
    displayName: 'Wise',
    description: 'Knowledgeable and insightful',
    icon: '🦉',
    color: '#4169E1',
    subTraits: [
      { id: 'knowledgeable', name: 'knowledgeable', displayName: 'Knowledgeable', description: 'Possesses vast learning' },
      { id: 'insightful', name: 'insightful', displayName: 'Insightful', description: 'Sees beyond the surface' },
      { id: 'sage', name: 'sage', displayName: 'Sage', description: 'Wise beyond their years' },
      { id: 'scholarly', name: 'scholarly', displayName: 'Scholarly', description: 'Devoted to learning' },
      { id: 'intuitive', name: 'intuitive', displayName: 'Intuitive', description: 'Understands without explanation' },
      { id: 'perceptive', name: 'perceptive', displayName: 'Perceptive', description: 'Notices what others miss' },
      { id: 'enlightened', name: 'enlightened', displayName: 'Enlightened', description: 'Has achieved understanding' },
      { id: 'mentor', name: 'mentor', displayName: 'Mentor', description: 'Guides others to wisdom' },
      { id: 'ancient', name: 'ancient', displayName: 'Ancient', description: 'Carries the wisdom of ages' },
      { id: 'prophetic', name: 'prophetic', displayName: 'Prophetic', description: 'Sees what is to come' }
    ]
  },
  {
    id: 'innocent',
    name: 'innocent',
    displayName: 'Innocent',
    description: 'Pure and untainted',
    icon: '🌸',
    color: '#FFB6C1',
    subTraits: [
      { id: 'pure', name: 'pure', displayName: 'Pure', description: 'Untainted by the world' },
      { id: 'naive', name: 'naive', displayName: 'Naive', description: 'Trusts easily and openly' },
      { id: 'sweet', name: 'sweet', displayName: 'Sweet', description: 'Kind and gentle nature' },
      { id: 'curious', name: 'curious', displayName: 'Curious', description: 'Maintains wonder and eagerness to learn' },
      { id: 'trusting', name: 'trusting', displayName: 'Trusting', description: 'Believes in the good in others' },
      { id: 'hopeful', name: 'hopeful', displayName: 'Hopeful', description: 'Always sees the bright side' },
      { id: 'sincere', name: 'sincere', displayName: 'Sincere', description: 'Genuine in all things' },
      { id: 'optimistic', name: 'optimistic', displayName: 'Optimistic', description: 'Expects the best outcomes' },
      { id: 'wholesome', name: 'wholesome', displayName: 'Wholesome', description: 'Morally pure and good' },
      { id: 'angelic', name: 'angelic', displayName: 'Angelic', description: 'Divine purity and grace' }
    ]
  },
  {
    id: 'dark',
    name: 'dark',
    displayName: 'Dark',
    description: 'Complex and shadowed',
    icon: '🖤',
    color: '#4B0082',
    subTraits: [
      { id: 'brooding', name: 'brooding', displayName: 'Brooding', description: 'Deep in dark thoughts' },
      { id: 'tormented', name: 'tormented', displayName: 'Tormented', description: 'Haunted by inner demons' },
      { id: 'melancholic', name: 'melancholic', displayName: 'Melancholic', description: 'Beautiful sadness' },
      { id: 'gothic', name: 'gothic', displayName: 'Gothic', description: 'Drawn to darkness and beauty' },
      { id: 'tragic', name: 'tragic', displayName: 'Tragic', description: 'Marked by sorrow and loss' },
      { id: 'intense', name: 'intense', displayName: 'Intense', description: 'Overwhelming emotional depth' },
      { id: 'haunted', name: 'haunted', displayName: 'Haunted', description: 'Pursued by past shadows' },
      { id: 'passionate', name: 'passionate', displayName: 'Passionate', description: 'Burns with deep emotion' },
      { id: 'complex', name: 'complex', displayName: 'Complex', description: 'Many layers of depth' },
      { id: 'twisted', name: 'twisted', displayName: 'Twisted', description: 'Beautifully distorted' }
    ]
  }
];
  
// ART STYLES HIERARCHY (SIMPLIFIED)
export const artStyles: ArtStyle[] = [
  {
    id: 'anime',
    name: 'anime',
    displayName: 'Anime',
    description: 'Japanese animation style',
    preview: '🎌'
  },
  {
    id: 'cartoon',
    name: 'cartoon',
    displayName: 'Cartoon',
    description: 'Western cartoon style',
    preview: '🎨'
  },
  {
    id: 'realistic',
    name: 'realistic',
    displayName: 'Realistic',
    description: 'Photorealistic human style',
    preview: '📸'
  },
  {
    id: 'fantasy',
    name: 'fantasy',
    displayName: 'Fantasy',
    description: 'Magical and fantastical style',
    preview: '🧙'
  }
];

// SCENARIOS
export const scenarios: Scenario[] = [
  {
    id: 'snowy-mountain',
    name: 'snowy-mountain',
    displayName: 'Snowy Mountain',
    description: 'Serene mountain peaks covered in snow',
    environment: 'mountain',
    setting: 'outdoor',
    mood: 'peaceful',
    timeOfDay: 'sunset',
    weather: 'snowy',
    preview: '🏔️',
    promptBonus: 'snowy mountain peaks, winter landscape, serene atmosphere, golden hour lighting'
  },
  {
    id: 'mystical-forest',
    name: 'mystical-forest',
    displayName: 'Mystical Forest',
    description: 'Enchanted forest with magical elements',
    environment: 'forest',
    setting: 'outdoor',
    mood: 'mysterious',
    timeOfDay: 'dusk',
    weather: 'misty',
    preview: '🌲',
    promptBonus: 'mystical forest, magical atmosphere, ethereal lighting, enchanted woodland'
  },
  {
    id: 'cyberpunk-city',
    name: 'cyberpunk-city',
    displayName: 'Cyberpunk City',
    description: 'Futuristic neon-lit urban environment',
    environment: 'city',
    setting: 'urban',
    mood: 'energetic',
    timeOfDay: 'night',
    weather: 'rainy',
    preview: '🌆',
    promptBonus: 'cyberpunk cityscape, neon lights, futuristic architecture, rain-soaked streets'
  },
  {
    id: 'ancient-temple',
    name: 'ancient-temple',
    displayName: 'Ancient Temple',
    description: 'Mysterious ancient ruins with spiritual energy',
    environment: 'temple',
    setting: 'indoor',
    mood: 'mystical',
    timeOfDay: 'dawn',
    weather: 'clear',
    preview: '🏛️',
    promptBonus: 'ancient temple ruins, mystical atmosphere, stone architecture, spiritual energy'
  },
  {
    id: 'space-station',
    name: 'space-station',
    displayName: 'Space Station',
    description: 'Advanced space station with stellar views',
    environment: 'space',
    setting: 'indoor',
    mood: 'futuristic',
    timeOfDay: 'eternal',
    weather: 'none',
    preview: '🚀',
    promptBonus: 'space station interior, sci-fi technology, stellar background, futuristic design'
  },
  {
    id: 'cherry-blossom-garden',
    name: 'cherry-blossom-garden',
    displayName: 'Cherry Blossom Garden',
    description: 'Traditional Japanese garden in spring',
    environment: 'garden',
    setting: 'outdoor',
    mood: 'peaceful',
    timeOfDay: 'afternoon',
    weather: 'clear',
    preview: '🌸',
    promptBonus: 'cherry blossom garden, sakura petals, traditional Japanese aesthetic, spring atmosphere'
  }
];

// TAG CATEGORIES
export const tagCategories: TagCategory[] = [
  {
    id: 'character-type',
    name: 'character-type',
    displayName: 'Character Type',
    description: 'Basic character identity and type',
    maxSelections: 1,
    required: true,
    tags: [
      { id: 'female', name: 'female', displayName: 'Female', emoji: '👩', color: '#e84393', isNSFW: false },
      { id: 'male', name: 'male', displayName: 'Male', emoji: '👨', color: '#0984e3', isNSFW: false },
      { id: 'android', name: 'android', displayName: 'Android', emoji: '🤖', color: '#636e72', isNSFW: false },
      { id: 'alien', name: 'alien', displayName: 'Alien', emoji: '👽', color: '#00b894', isNSFW: false },
      { id: 'angel', name: 'angel', displayName: 'Angel', emoji: '👼', color: '#ffeaa7', isNSFW: false },
      { id: 'fairy', name: 'fairy', displayName: 'Fairy', emoji: '🧚', color: '#a29bfe', isNSFW: false },
      { id: 'robot', name: 'robot', displayName: 'Robot', emoji: '🤖', color: '#636e72', isNSFW: false },
      { id: 'animal', name: 'animal', displayName: 'Animal', emoji: '🐾', color: '#e17055', isNSFW: false }
    ]
  },
  {
    id: 'genre',
    name: 'genre',
    displayName: 'Genre',
    description: 'Story genre and setting type',
    maxSelections: 3,
    tags: [
      { id: 'sci-fi', name: 'sci-fi', displayName: 'Sci-Fi', emoji: '🚀', color: '#0984e3', isNSFW: false },
      { id: 'fantasy', name: 'fantasy', displayName: 'Fantasy', emoji: '🧙', color: '#6c5ce7', isNSFW: false },
      { id: 'horror', name: 'horror', displayName: 'Horror', emoji: '👻', color: '#2d3436', isNSFW: false },
      { id: 'romance', name: 'romance', displayName: 'Romance', emoji: '💕', color: '#fd79a8', isNSFW: false },
      { id: 'adventure', name: 'adventure', displayName: 'Adventure', emoji: '⚔️', color: '#e17055', isNSFW: false },
      { id: 'mystery', name: 'mystery', displayName: 'Mystery', emoji: '🔍', color: '#636e72', isNSFW: false },
      { id: 'slice-of-life', name: 'slice-of-life', displayName: 'Slice of Life', emoji: '🌸', color: '#ffeaa7', isNSFW: false },
      { id: 'cyberpunk', name: 'cyberpunk', displayName: 'Cyberpunk', emoji: '🌆', color: '#00b894', isNSFW: false }
    ]
  },
  {
    id: 'personality',
    name: 'personality',
    displayName: 'Personality',
    description: 'Character personality traits',
    maxSelections: 3,
    tags: [
      { id: 'confident', name: 'confident', displayName: 'Confident', emoji: '💪', color: '#e84393', isNSFW: false },
      { id: 'shy', name: 'shy', displayName: 'Shy', emoji: '😊', color: '#fd79a8', isNSFW: false },
      { id: 'mysterious', name: 'mysterious', displayName: 'Mysterious', emoji: '🎭', color: '#636e72', isNSFW: false },
      { id: 'playful', name: 'playful', displayName: 'Playful', emoji: '🎪', color: '#ffeaa7', isNSFW: false },
      { id: 'serious', name: 'serious', displayName: 'Serious', emoji: '🎯', color: '#2d3436', isNSFW: false },
      { id: 'caring', name: 'caring', displayName: 'Caring', emoji: '💝', color: '#00b894', isNSFW: false },
      { id: 'rebellious', name: 'rebellious', displayName: 'Rebellious', emoji: '🔥', color: '#e17055', isNSFW: false },
      { id: 'intellectual', name: 'intellectual', displayName: 'Intellectual', emoji: '📚', color: '#0984e3', isNSFW: false }
    ]
  },
  {
    id: 'appearance',
    name: 'appearance',
    displayName: 'Appearance',
    description: 'Visual appearance details',
    maxSelections: 2,
    tags: [
      { id: 'long-hair', name: 'long-hair', displayName: 'Long Hair', emoji: '👱‍♀️', color: '#ffeaa7', isNSFW: false },
      { id: 'short-hair', name: 'short-hair', displayName: 'Short Hair', emoji: '👩‍🦱', color: '#fd79a8', isNSFW: false },
      { id: 'colorful-hair', name: 'colorful-hair', displayName: 'Colorful Hair', emoji: '🌈', color: '#00b894', isNSFW: false },
      { id: 'glasses', name: 'glasses', displayName: 'Glasses', emoji: '👓', color: '#0984e3', isNSFW: false },
      { id: 'hat', name: 'hat', displayName: 'Hat', emoji: '🎩', color: '#e17055', isNSFW: false },
      { id: 'smile', name: 'smile', displayName: 'Friendly Smile', emoji: '😊', color: '#636e72', isNSFW: false },
      { id: 'wings', name: 'wings', displayName: 'Wings', emoji: '🕊️', color: '#2d3436', isNSFW: false },
      { id: 'glowing-eyes', name: 'glowing-eyes', displayName: 'Glowing Eyes', emoji: '👁️', color: '#6c5ce7', isNSFW: false }
    ]
  },
  {
    id: 'origin',
    name: 'origin',
    displayName: 'Origin',
    description: 'Character background and origin',
    maxSelections: 1,
    tags: [
      { id: 'human', name: 'human', displayName: 'Human', emoji: '👤', color: '#6c5ce7', isNSFW: false },
      { id: 'magical', name: 'magical', displayName: 'Magical', emoji: '✨', color: '#a29bfe', isNSFW: false },
      { id: 'divine', name: 'divine', displayName: 'Divine', emoji: '👼', color: '#ffeaa7', isNSFW: false },
      { id: 'alien', name: 'alien', displayName: 'Alien', emoji: '👽', color: '#00b894', isNSFW: false },
      { id: 'artificial', name: 'artificial', displayName: 'Artificial', emoji: '🤖', color: '#636e72', isNSFW: false },
      { id: 'mythical', name: 'mythical', displayName: 'Mythical', emoji: '🐉', color: '#fd79a8', isNSFW: false },
      { id: 'nature', name: 'nature', displayName: 'Nature', emoji: '🌿', color: '#e84393', isNSFW: false },
      { id: 'cosmic', name: 'cosmic', displayName: 'Cosmic', emoji: '⭐', color: '#e17055', isNSFW: false }
    ]
  },
  {
    id: 'fantasy',
    name: 'fantasy',
    displayName: 'Fantasy',
    description: 'Fantasy elements and abilities',
    maxSelections: undefined, // unlimited
    tags: [
      { id: 'magic-user', name: 'magic-user', displayName: 'Magic User', emoji: '🧙', color: '#6c5ce7', isNSFW: false },
      { id: 'shapeshifter', name: 'shapeshifter', displayName: 'Shapeshifter', emoji: '🦋', color: '#fd79a8', isNSFW: false },
      { id: 'immortal', name: 'immortal', displayName: 'Immortal', emoji: '♾️', color: '#ffeaa7', isNSFW: false },
      { id: 'telepathic', name: 'telepathic', displayName: 'Telepathic', emoji: '🧠', color: '#0984e3', isNSFW: false },
      { id: 'elemental-powers', name: 'elemental-powers', displayName: 'Elemental Powers', emoji: '🔥', color: '#e17055', isNSFW: false },
      { id: 'time-traveler', name: 'time-traveler', displayName: 'Time Traveler', emoji: '⏰', color: '#636e72', isNSFW: false },
      { id: 'superhuman', name: 'superhuman', displayName: 'Superhuman', emoji: '💪', color: '#e84393', isNSFW: false },
      { id: 'cursed', name: 'cursed', displayName: 'Cursed', emoji: '💀', color: '#2d3436', isNSFW: false }
    ]
  },
  {
    id: 'ethnicity',
    name: 'ethnicity',
    displayName: 'Ethnicity',
    description: 'Character ethnicity and cultural background',
    maxSelections: undefined, // unlimited
    tags: [
      { id: 'asian', name: 'asian', displayName: 'Asian', emoji: '🏯', color: '#fd79a8', isNSFW: false },
      { id: 'european', name: 'european', displayName: 'European', emoji: '🏰', color: '#0984e3', isNSFW: false },
      { id: 'african', name: 'african', displayName: 'African', emoji: '🌍', color: '#e17055', isNSFW: false },
      { id: 'latino', name: 'latino', displayName: 'Latino', emoji: '🌮', color: '#ffeaa7', isNSFW: false },
      { id: 'native-american', name: 'native-american', displayName: 'Native American', emoji: '🪶', color: '#e84393', isNSFW: false },
      { id: 'middle-eastern', name: 'middle-eastern', displayName: 'Middle Eastern', emoji: '🕌', color: '#6c5ce7', isNSFW: false },
      { id: 'mixed', name: 'mixed', displayName: 'Mixed', emoji: '🌈', color: '#00b894', isNSFW: false },
      { id: 'other', name: 'other', displayName: 'Other', emoji: '🌎', color: '#636e72', isNSFW: false }
    ]
  },
  {
    id: 'profession',
    name: 'profession',
    displayName: 'Profession',
    description: 'Character professions and careers',
    maxSelections: 3,
    tags: [
      { id: 'teacher', name: 'teacher', displayName: 'Teacher', emoji: '👩‍🏫', color: '#0984e3', isNSFW: false },
      { id: 'doctor', name: 'doctor', displayName: 'Doctor', emoji: '👩‍⚕️', color: '#e17055', isNSFW: false },
      { id: 'scientist', name: 'scientist', displayName: 'Scientist', emoji: '👩‍🔬', color: '#6c5ce7', isNSFW: false },
      { id: 'artist', name: 'artist', displayName: 'Artist', emoji: '🎨', color: '#fd79a8', isNSFW: false },
      { id: 'musician', name: 'musician', displayName: 'Musician', emoji: '🎵', color: '#ffeaa7', isNSFW: false },
      { id: 'writer', name: 'writer', displayName: 'Writer', emoji: '✍️', color: '#00b894', isNSFW: false },
      { id: 'engineer', name: 'engineer', displayName: 'Engineer', emoji: '⚙️', color: '#636e72', isNSFW: false },
      { id: 'chef', name: 'chef', displayName: 'Chef', emoji: '👨‍🍳', color: '#e84393', isNSFW: false },
      { id: 'pilot', name: 'pilot', displayName: 'Pilot', emoji: '✈️', color: '#2d3436', isNSFW: false },
      { id: 'astronaut', name: 'astronaut', displayName: 'Astronaut', emoji: '🚀', color: '#0984e3', isNSFW: false },
      { id: 'detective', name: 'detective', displayName: 'Detective', emoji: '🔍', color: '#6c5ce7', isNSFW: false },
      { id: 'librarian', name: 'librarian', displayName: 'Librarian', emoji: '📚', color: '#fd79a8', isNSFW: false },
      { id: 'gardener', name: 'gardener', displayName: 'Gardener', emoji: '🌱', color: '#00b894', isNSFW: false },
      { id: 'photographer', name: 'photographer', displayName: 'Photographer', emoji: '📸', color: '#e17055', isNSFW: false },
      { id: 'veterinarian', name: 'veterinarian', displayName: 'Veterinarian', emoji: '🐾', color: '#ffeaa7', isNSFW: false },
      { id: 'architect', name: 'architect', displayName: 'Architect', emoji: '🏗️', color: '#636e72', isNSFW: false },
      { id: 'dancer', name: 'dancer', displayName: 'Dancer', emoji: '💃', color: '#e84393', isNSFW: false },
      { id: 'athlete', name: 'athlete', displayName: 'Athlete', emoji: '🏃‍♀️', color: '#2d3436', isNSFW: false },
      { id: 'magician', name: 'magician', displayName: 'Magician', emoji: '🎩', color: '#6c5ce7', isNSFW: false },
      { id: 'explorer', name: 'explorer', displayName: 'Explorer', emoji: '🗺️', color: '#00b894', isNSFW: false }
    ]
  }
];

// PROMPT BUILDING UTILITIES
export const buildCharacterPrompt = (characterData: {
  personalityTraits?: { mainTrait?: string; subTraits?: string[] };
  artStyle?: { primaryStyle?: string };
  scenario?: { environment?: string; setting?: string; mood?: string; timeOfDay?: string; weather?: string };
  selectedTags?: { [key: string]: string[] };
  name?: string;
  description?: string;
}): string => {
  const promptParts: string[] = [];

  // Art style comes first for SD
  if (characterData.artStyle?.primaryStyle) {
    const styleData = artStyles.find(s => s.id === characterData.artStyle?.primaryStyle);
    if (styleData) {
      promptParts.push(styleData.displayName.toLowerCase());
    }
  }

  // Character type and basic description
  if (characterData.selectedTags?.characterType) {
    promptParts.push(...characterData.selectedTags.characterType);
  }

  // Physical traits
  if (characterData.selectedTags?.physicalTraits) {
    promptParts.push(...characterData.selectedTags.physicalTraits);
  }

  // Appearance details
  if (characterData.selectedTags?.appearance) {
    promptParts.push(...characterData.selectedTags.appearance);
  }

  // Personality traits
  if (characterData.personalityTraits?.mainTrait) {
    promptParts.push(`${characterData.personalityTraits.mainTrait} expression`);
  }

  // Scenario/environment
  if (characterData.scenario?.environment) {
    const scenarioData = scenarios.find(s => s.id === characterData.scenario?.environment);
    if (scenarioData) {
      promptParts.push(scenarioData.promptBonus);
    }
  }

  // Quality tags
  promptParts.push('masterpiece', 'best quality', 'highly detailed', 'beautiful');

  return promptParts.join(', ');
};

export const buildNegativePrompt = (isNSFW: boolean = false): string => {
  const baseParts = [
    'low quality', 'worst quality', 'blurry', 'distorted', 'deformed',
    'bad anatomy', 'extra limbs', 'missing limbs', 'bad proportions',
    'watermark', 'signature', 'text', 'error', 'artifacts'
  ];

  if (!isNSFW || isNSFW) {
    baseParts.push('nsfw', 'nude', 'sexual', 'explicit', 'inappropriate');
  }

  return baseParts.join(', ');
}; 