// shared/tags-config.ts
// Centralized tag configuration for the application

export interface SharedTag {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  emoji?: string;
  color?: string;
  isNSFW?: boolean;
  category: string;
}

export interface SharedTagCategory {
  id: string;
  name: string;
  displayName: string;
  description: string;
  tags: SharedTag[];
  maxSelections?: number;
  required?: boolean;
}

// CENTRALIZED TAG CONFIGURATION
// This is the single source of truth for all tag definitions in the application
export const SHARED_TAG_CATEGORIES: SharedTagCategory[] = [
  {
    id: 'character-type',
    name: 'character-type',
    displayName: 'Character Type',
    description: 'Basic character identity and type',
    maxSelections: 1,
    required: true,
    tags: [
      { id: 'female', name: 'female', displayName: 'Female', emoji: '👩', color: '#e84393', isNSFW: false, category: 'Character Type' },
      { id: 'male', name: 'male', displayName: 'Male', emoji: '👨', color: '#0984e3', isNSFW: false, category: 'Character Type' },
      { id: 'non-binary', name: 'non-binary', displayName: 'Non-Binary', emoji: '🌈', color: '#fdcb6e', isNSFW: false, category: 'Character Type' },
      { id: 'android', name: 'android', displayName: 'Android', emoji: '🤖', color: '#636e72', isNSFW: false, category: 'Character Type' },
      { id: 'alien', name: 'alien', displayName: 'Alien', emoji: '👽', color: '#00b894', isNSFW: false, category: 'Character Type' },
      { id: 'demon', name: 'demon', displayName: 'Demon', emoji: '😈', color: '#e17055', isNSFW: false, category: 'Character Type' },
      { id: 'angel', name: 'angel', displayName: 'Angel', emoji: '👼', color: '#ffeaa7', isNSFW: false, category: 'Character Type' },
      { id: 'vampire', name: 'vampire', displayName: 'Vampire', emoji: '🧛', color: '#a29bfe', isNSFW: false, category: 'Character Type' }
    ]
  },
  {
    id: 'genre',
    name: 'genre',
    displayName: 'Genre',
    description: 'Story genre and setting type',
    maxSelections: 3,
    tags: [
      { id: 'sci-fi', name: 'sci-fi', displayName: 'Sci-Fi', emoji: '🚀', color: '#0984e3', isNSFW: false, category: 'Genre' },
      { id: 'fantasy', name: 'fantasy', displayName: 'Fantasy', emoji: '🧙', color: '#6c5ce7', isNSFW: false, category: 'Genre' },
      { id: 'horror', name: 'horror', displayName: 'Horror', emoji: '👻', color: '#2d3436', isNSFW: false, category: 'Genre' },
      { id: 'romance', name: 'romance', displayName: 'Romance', emoji: '💕', color: '#fd79a8', isNSFW: false, category: 'Genre' },
      { id: 'adventure', name: 'adventure', displayName: 'Adventure', emoji: '⚔️', color: '#e17055', isNSFW: false, category: 'Genre' },
      { id: 'mystery', name: 'mystery', displayName: 'Mystery', emoji: '🔍', color: '#636e72', isNSFW: false, category: 'Genre' },
      { id: 'slice-of-life', name: 'slice-of-life', displayName: 'Slice of Life', emoji: '🌸', color: '#ffeaa7', isNSFW: false, category: 'Genre' },
      { id: 'cyberpunk', name: 'cyberpunk', displayName: 'Cyberpunk', emoji: '🌆', color: '#00b894', isNSFW: false, category: 'Genre' }
    ]
  },
  {
    id: 'personality',
    name: 'personality',
    displayName: 'Personality',
    description: 'Character personality traits',
    maxSelections: 3,
    tags: [
      { id: 'confident', name: 'confident', displayName: 'Confident', emoji: '💪', color: '#e84393', isNSFW: false, category: 'Personality' },
      { id: 'shy', name: 'shy', displayName: 'Shy', emoji: '😊', color: '#fd79a8', isNSFW: false, category: 'Personality' },
      { id: 'mysterious', name: 'mysterious', displayName: 'Mysterious', emoji: '🎭', color: '#636e72', isNSFW: false, category: 'Personality' },
      { id: 'playful', name: 'playful', displayName: 'Playful', emoji: '🎪', color: '#ffeaa7', isNSFW: false, category: 'Personality' },
      { id: 'serious', name: 'serious', displayName: 'Serious', emoji: '🎯', color: '#2d3436', isNSFW: false, category: 'Personality' },
      { id: 'caring', name: 'caring', displayName: 'Caring', emoji: '💝', color: '#00b894', isNSFW: false, category: 'Personality' },
      { id: 'rebellious', name: 'rebellious', displayName: 'Rebellious', emoji: '🔥', color: '#e17055', isNSFW: false, category: 'Personality' },
      { id: 'intellectual', name: 'intellectual', displayName: 'Intellectual', emoji: '📚', color: '#0984e3', isNSFW: false, category: 'Personality' }
    ]
  },
  {
    id: 'appearance',
    name: 'appearance',
    displayName: 'Appearance',
    description: 'Visual appearance details',
    maxSelections: 2,
    tags: [
      { id: 'long-hair', name: 'long-hair', displayName: 'Long Hair', emoji: '👱‍♀️', color: '#ffeaa7', isNSFW: false, category: 'Appearance' },
      { id: 'short-hair', name: 'short-hair', displayName: 'Short Hair', emoji: '👩‍🦱', color: '#fd79a8', isNSFW: false, category: 'Appearance' },
      { id: 'colorful-hair', name: 'colorful-hair', displayName: 'Colorful Hair', emoji: '🌈', color: '#00b894', isNSFW: false, category: 'Appearance' },
      { id: 'glasses', name: 'glasses', displayName: 'Glasses', emoji: '👓', color: '#0984e3', isNSFW: false, category: 'Appearance' },
      { id: 'tattoos', name: 'tattoos', displayName: 'Tattoos', emoji: '🎨', color: '#e17055', isNSFW: false, category: 'Appearance' },
      { id: 'piercings', name: 'piercings', displayName: 'Piercings', emoji: '💍', color: '#636e72', isNSFW: false, category: 'Appearance' },
      { id: 'scars', name: 'scars', displayName: 'Scars', emoji: '⚔️', color: '#2d3436', isNSFW: false, category: 'Appearance' },
      { id: 'glowing-eyes', name: 'glowing-eyes', displayName: 'Glowing Eyes', emoji: '👁️', color: '#6c5ce7', isNSFW: false, category: 'Appearance' }
    ]
  },
  {
    id: 'origin',
    name: 'origin',
    displayName: 'Origin',
    description: 'Character background and origin',
    maxSelections: 1,
    tags: [
      { id: 'human', name: 'human', displayName: 'Human', emoji: '👤', color: '#6c5ce7', isNSFW: false, category: 'Origin' },
      { id: 'magical', name: 'magical', displayName: 'Magical', emoji: '✨', color: '#a29bfe', isNSFW: false, category: 'Origin' },
      { id: 'divine', name: 'divine', displayName: 'Divine', emoji: '👼', color: '#ffeaa7', isNSFW: false, category: 'Origin' },
      { id: 'demonic', name: 'demonic', displayName: 'Demonic', emoji: '😈', color: '#e17055', isNSFW: false, category: 'Origin' },
      { id: 'alien', name: 'alien', displayName: 'Alien', emoji: '👽', color: '#00b894', isNSFW: false, category: 'Origin' },
      { id: 'artificial', name: 'artificial', displayName: 'Artificial', emoji: '🤖', color: '#636e72', isNSFW: false, category: 'Origin' },
      { id: 'mythical', name: 'mythical', displayName: 'Mythical', emoji: '🐉', color: '#fd79a8', isNSFW: false, category: 'Origin' },
      { id: 'elemental', name: 'elemental', displayName: 'Elemental', emoji: '🔥', color: '#e84393', isNSFW: false, category: 'Origin' }
    ]
  },
  {
    id: 'sexuality',
    name: 'sexuality',
    displayName: 'Sexuality',
    description: 'Character sexuality and orientation',
    maxSelections: 1,
    tags: [
      { id: 'straight', name: 'straight', displayName: 'Straight', emoji: '💝', color: '#fd79a8', isNSFW: false, category: 'Sexuality' },
      { id: 'gay', name: 'gay', displayName: 'Gay', emoji: '🏳️‍🌈', color: '#0984e3', isNSFW: false, category: 'Sexuality' },
      { id: 'lesbian', name: 'lesbian', displayName: 'Lesbian', emoji: '🏳️‍🌈', color: '#e84393', isNSFW: false, category: 'Sexuality' },
      { id: 'bisexual', name: 'bisexual', displayName: 'Bisexual', emoji: '💜', color: '#6c5ce7', isNSFW: false, category: 'Sexuality' },
      { id: 'pansexual', name: 'pansexual', displayName: 'Pansexual', emoji: '💛', color: '#ffeaa7', isNSFW: false, category: 'Sexuality' },
      { id: 'asexual', name: 'asexual', displayName: 'Asexual', emoji: '🖤', color: '#2d3436', isNSFW: false, category: 'Sexuality' },
      { id: 'demisexual', name: 'demisexual', displayName: 'Demisexual', emoji: '💚', color: '#00b894', isNSFW: false, category: 'Sexuality' }
    ]
  },
  {
    id: 'fantasy',
    name: 'fantasy',
    displayName: 'Fantasy',
    description: 'Fantasy elements and abilities',
    maxSelections: undefined, // unlimited
    tags: [
      { id: 'magic-user', name: 'magic-user', displayName: 'Magic User', emoji: '🧙', color: '#6c5ce7', isNSFW: false, category: 'Fantasy' },
      { id: 'shapeshifter', name: 'shapeshifter', displayName: 'Shapeshifter', emoji: '🦋', color: '#fd79a8', isNSFW: false, category: 'Fantasy' },
      { id: 'immortal', name: 'immortal', displayName: 'Immortal', emoji: '♾️', color: '#ffeaa7', isNSFW: false, category: 'Fantasy' },
      { id: 'telepathic', name: 'telepathic', displayName: 'Telepathic', emoji: '🧠', color: '#0984e3', isNSFW: false, category: 'Fantasy' },
      { id: 'elemental-powers', name: 'elemental-powers', displayName: 'Elemental Powers', emoji: '🔥', color: '#e17055', isNSFW: false, category: 'Fantasy' },
      { id: 'time-traveler', name: 'time-traveler', displayName: 'Time Traveler', emoji: '⏰', color: '#636e72', isNSFW: false, category: 'Fantasy' },
      { id: 'superhuman', name: 'superhuman', displayName: 'Superhuman', emoji: '💪', color: '#e84393', isNSFW: false, category: 'Fantasy' },
      { id: 'cursed', name: 'cursed', displayName: 'Cursed', emoji: '💀', color: '#2d3436', isNSFW: false, category: 'Fantasy' }
    ]
  },
  {
    id: 'content-rating',
    name: 'content-rating',
    displayName: 'Content Rating',
    description: 'Content appropriateness level',
    maxSelections: 1,
    required: true,
    tags: [
      { id: 'sfw', name: 'sfw', displayName: 'SFW', emoji: '✅', color: '#00b894', isNSFW: false, category: 'Content Rating' },
      { id: 'nsfw', name: 'nsfw', displayName: 'NSFW', emoji: '🔞', color: '#e17055', isNSFW: true, category: 'Content Rating' },
      { id: 'suggestive', name: 'suggestive', displayName: 'Suggestive', emoji: '😏', color: '#fdcb6e', isNSFW: false, category: 'Content Rating' }
    ]
  },
  {
    id: 'ethnicity',
    name: 'ethnicity',
    displayName: 'Ethnicity',
    description: 'Character ethnicity and cultural background',
    maxSelections: undefined, // unlimited
    tags: [
      { id: 'asian', name: 'asian', displayName: 'Asian', emoji: '🏯', color: '#fd79a8', isNSFW: false, category: 'Ethnicity' },
      { id: 'european', name: 'european', displayName: 'European', emoji: '🏰', color: '#0984e3', isNSFW: false, category: 'Ethnicity' },
      { id: 'african', name: 'african', displayName: 'African', emoji: '🌍', color: '#e17055', isNSFW: false, category: 'Ethnicity' },
      { id: 'latino', name: 'latino', displayName: 'Latino', emoji: '🌮', color: '#ffeaa7', isNSFW: false, category: 'Ethnicity' },
      { id: 'native-american', name: 'native-american', displayName: 'Native American', emoji: '🪶', color: '#e84393', isNSFW: false, category: 'Ethnicity' },
      { id: 'middle-eastern', name: 'middle-eastern', displayName: 'Middle Eastern', emoji: '🕌', color: '#6c5ce7', isNSFW: false, category: 'Ethnicity' },
      { id: 'mixed', name: 'mixed', displayName: 'Mixed', emoji: '🌈', color: '#00b894', isNSFW: false, category: 'Ethnicity' },
      { id: 'other', name: 'other', displayName: 'Other', emoji: '🌎', color: '#636e72', isNSFW: false, category: 'Ethnicity' }
    ]
  },
  {
    id: 'scenario',
    name: 'scenario',
    displayName: 'Scenario',
    description: 'Character scenarios and settings',
    maxSelections: undefined, // unlimited
    tags: [
      { id: 'school', name: 'school', displayName: 'School', emoji: '🏫', color: '#0984e3', isNSFW: false, category: 'Scenario' },
      { id: 'workplace', name: 'workplace', displayName: 'Workplace', emoji: '🏢', color: '#636e72', isNSFW: false, category: 'Scenario' },
      { id: 'fantasy-world', name: 'fantasy-world', displayName: 'Fantasy World', emoji: '🏰', color: '#6c5ce7', isNSFW: false, category: 'Scenario' },
      { id: 'modern-city', name: 'modern-city', displayName: 'Modern City', emoji: '🏙️', color: '#00b894', isNSFW: false, category: 'Scenario' },
      { id: 'space', name: 'space', displayName: 'Space', emoji: '🚀', color: '#2d3436', isNSFW: false, category: 'Scenario' },
      { id: 'medieval', name: 'medieval', displayName: 'Medieval', emoji: '⚔️', color: '#e17055', isNSFW: false, category: 'Scenario' },
      { id: 'apocalyptic', name: 'apocalyptic', displayName: 'Apocalyptic', emoji: '💥', color: '#e84393', isNSFW: false, category: 'Scenario' },
      { id: 'peaceful', name: 'peaceful', displayName: 'Peaceful', emoji: '🌸', color: '#fd79a8', isNSFW: false, category: 'Scenario' }
    ]
  }
];

// UTILITY FUNCTIONS FOR TAG OPERATIONS

/**
 * Get all tags flattened from all categories
 */
export function getAllTags(): SharedTag[] {
  return SHARED_TAG_CATEGORIES.flatMap(category => category.tags);
}

/**
 * Get tags by category name
 */
export function getTagsByCategory(categoryName: string): SharedTag[] {
  const category = SHARED_TAG_CATEGORIES.find(cat => 
    cat.name === categoryName || cat.displayName === categoryName
  );
  return category ? category.tags : [];
}

/**
 * Find a tag by name
 */
export function findTagByName(tagName: string): SharedTag | undefined {
  return getAllTags().find(tag => tag.name === tagName || tag.displayName === tagName);
}

/**
 * Get tag categories in the format expected by useTags hook
 */
export function getTagCategoriesForUseTags(): Array<{ category: string; tags: SharedTag[] }> {
  return SHARED_TAG_CATEGORIES.map(category => ({
    category: category.displayName,
    tags: category.tags.map(tag => ({
      ...tag,
      category: category.displayName
    }))
  }));
}

/**
 * Get the total number of tags across all categories
 */
export function getTotalTagCount(): number {
  return getAllTags().length;
}

/**
 * Validate if a tag name exists
 */
export function isValidTag(tagName: string): boolean {
  return !!findTagByName(tagName);
}

/**
 * Get category for a specific tag
 */
export function getCategoryForTag(tagName: string): SharedTagCategory | undefined {
  return SHARED_TAG_CATEGORIES.find(category =>
    category.tags.some(tag => tag.name === tagName || tag.displayName === tagName)
  );
}
