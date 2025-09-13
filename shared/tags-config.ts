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
      { id: 'android', name: 'android', displayName: 'Android', emoji: '🤖', color: '#636e72', isNSFW: false, category: 'Character Type' },
      { id: 'alien', name: 'alien', displayName: 'Alien', emoji: '👽', color: '#00b894', isNSFW: false, category: 'Character Type' },
      { id: 'angel', name: 'angel', displayName: 'Angel', emoji: '👼', color: '#ffeaa7', isNSFW: false, category: 'Character Type' },
      { id: 'fairy', name: 'fairy', displayName: 'Fairy', emoji: '🧚', color: '#a29bfe', isNSFW: false, category: 'Character Type' },
      { id: 'robot', name: 'robot', displayName: 'Robot', emoji: '🤖', color: '#636e72', isNSFW: false, category: 'Character Type' },
      { id: 'animal', name: 'animal', displayName: 'Animal', emoji: '🐾', color: '#e17055', isNSFW: false, category: 'Character Type' }
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
      { id: 'hat', name: 'hat', displayName: 'Hat', emoji: '🎩', color: '#e17055', isNSFW: false, category: 'Appearance' },
      { id: 'smile', name: 'smile', displayName: 'Friendly Smile', emoji: '😊', color: '#636e72', isNSFW: false, category: 'Appearance' },
      { id: 'wings', name: 'wings', displayName: 'Wings', emoji: '🕊️', color: '#2d3436', isNSFW: false, category: 'Appearance' },
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
      { id: 'alien', name: 'alien', displayName: 'Alien', emoji: '👽', color: '#00b894', isNSFW: false, category: 'Origin' },
      { id: 'artificial', name: 'artificial', displayName: 'Artificial', emoji: '🤖', color: '#636e72', isNSFW: false, category: 'Origin' },
      { id: 'mythical', name: 'mythical', displayName: 'Mythical', emoji: '🐉', color: '#fd79a8', isNSFW: false, category: 'Origin' },
      { id: 'nature', name: 'nature', displayName: 'Nature', emoji: '🌿', color: '#e84393', isNSFW: false, category: 'Origin' },
      { id: 'cosmic', name: 'cosmic', displayName: 'Cosmic', emoji: '⭐', color: '#e17055', isNSFW: false, category: 'Origin' }
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
    id: 'profession',
    name: 'profession',
    displayName: 'Profession',
    description: 'Character professions and careers',
    maxSelections: 3,
    tags: [
      { id: 'teacher', name: 'teacher', displayName: 'Teacher', emoji: '👩‍🏫', color: '#0984e3', isNSFW: false, category: 'Profession' },
      { id: 'doctor', name: 'doctor', displayName: 'Doctor', emoji: '👩‍⚕️', color: '#e17055', isNSFW: false, category: 'Profession' },
      { id: 'scientist', name: 'scientist', displayName: 'Scientist', emoji: '👩‍🔬', color: '#6c5ce7', isNSFW: false, category: 'Profession' },
      { id: 'artist', name: 'artist', displayName: 'Artist', emoji: '🎨', color: '#fd79a8', isNSFW: false, category: 'Profession' },
      { id: 'musician', name: 'musician', displayName: 'Musician', emoji: '🎵', color: '#ffeaa7', isNSFW: false, category: 'Profession' },
      { id: 'writer', name: 'writer', displayName: 'Writer', emoji: '✍️', color: '#00b894', isNSFW: false, category: 'Profession' },
      { id: 'engineer', name: 'engineer', displayName: 'Engineer', emoji: '⚙️', color: '#636e72', isNSFW: false, category: 'Profession' },
      { id: 'chef', name: 'chef', displayName: 'Chef', emoji: '👨‍🍳', color: '#e84393', isNSFW: false, category: 'Profession' },
      { id: 'pilot', name: 'pilot', displayName: 'Pilot', emoji: '✈️', color: '#2d3436', isNSFW: false, category: 'Profession' },
      { id: 'astronaut', name: 'astronaut', displayName: 'Astronaut', emoji: '🚀', color: '#0984e3', isNSFW: false, category: 'Profession' },
      { id: 'detective', name: 'detective', displayName: 'Detective', emoji: '🔍', color: '#6c5ce7', isNSFW: false, category: 'Profession' },
      { id: 'librarian', name: 'librarian', displayName: 'Librarian', emoji: '📚', color: '#fd79a8', isNSFW: false, category: 'Profession' },
      { id: 'gardener', name: 'gardener', displayName: 'Gardener', emoji: '🌱', color: '#00b894', isNSFW: false, category: 'Profession' },
      { id: 'photographer', name: 'photographer', displayName: 'Photographer', emoji: '📸', color: '#e17055', isNSFW: false, category: 'Profession' },
      { id: 'veterinarian', name: 'veterinarian', displayName: 'Veterinarian', emoji: '🐾', color: '#ffeaa7', isNSFW: false, category: 'Profession' },
      { id: 'architect', name: 'architect', displayName: 'Architect', emoji: '🏗️', color: '#636e72', isNSFW: false, category: 'Profession' },
      { id: 'dancer', name: 'dancer', displayName: 'Dancer', emoji: '💃', color: '#e84393', isNSFW: false, category: 'Profession' },
      { id: 'athlete', name: 'athlete', displayName: 'Athlete', emoji: '🏃‍♀️', color: '#2d3436', isNSFW: false, category: 'Profession' },
      { id: 'magician', name: 'magician', displayName: 'Magician', emoji: '🎩', color: '#6c5ce7', isNSFW: false, category: 'Profession' },
      { id: 'explorer', name: 'explorer', displayName: 'Explorer', emoji: '🗺️', color: '#00b894', isNSFW: false, category: 'Profession' }
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
