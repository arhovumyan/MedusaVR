import mongoose from 'mongoose';
import { TagModel } from '../db/models/TagModel';
import * as dotenv from 'dotenv';

dotenv.config();

const initialTags = [
  // Character Type
  { name: 'female', displayName: 'Female', category: 'character-type', color: '#e84393', isNSFW: false, description: 'Female characters' },
  { name: 'male', displayName: 'Male', category: 'character-type', color: '#0984e3', isNSFW: false, description: 'Male characters' },
  { name: 'non-human', displayName: 'Non-human', category: 'character-type', color: '#6c5ce7', isNSFW: false, description: 'Non-human characters' },
  { name: 'non-binary', displayName: 'Non-binary', category: 'character-type', color: '#fdcb6e', isNSFW: false, description: 'Non-binary characters' },
  { name: 'myth', displayName: 'Mythical', category: 'character-type', color: '#a29bfe', isNSFW: false, description: 'Mythical beings' },
  { name: 'object', displayName: 'Object', category: 'character-type', color: '#636e72', isNSFW: false, description: 'Inanimate objects' },
  { name: 'queer', displayName: 'Queer', category: 'character-type', color: '#fd79a8', isNSFW: false, description: 'LGBTQ+ characters' },

  // Genre
  { name: 'scenario', displayName: 'Scenario', category: 'genre', color: '#00cec9', isNSFW: false, description: 'Specific scenarios and situations' },
  { name: 'fictional', displayName: 'Fictional', category: 'genre', color: '#74b9ff', isNSFW: false, description: 'Fictional characters and worlds' },
  { name: 'multiple', displayName: 'Multiple', category: 'genre', color: '#fd79a8', isNSFW: false, description: 'Multiple characters' },
  { name: 'rpg', displayName: 'RPG', category: 'genre', color: '#e17055', isNSFW: false, description: 'Role-playing games' },
  { name: 'anime', displayName: 'Anime', category: 'genre', color: '#fd79a8', isNSFW: false, description: 'Japanese animation style' },
  { name: 'magical', displayName: 'Magical', category: 'genre', color: '#a29bfe', isNSFW: false, description: 'Magic and supernatural' },
  { name: 'hentai', displayName: 'Hentai', category: 'genre', color: '#e84393', isNSFW: true, description: 'Adult anime content' },
  { name: 'royalty', displayName: 'Royalty', category: 'genre', color: '#fdcb6e', isNSFW: false, description: 'Kings, queens, and nobles' },
  { name: 'assistant', displayName: 'Assistant', category: 'genre', color: '#00b894', isNSFW: false, description: 'Helper and assistant roles' },
  { name: 'religion', displayName: 'Religion', category: 'genre', color: '#d63031', isNSFW: false, description: 'Religious themes' },
  { name: 'historical', displayName: 'Historical', category: 'genre', color: '#e17055', isNSFW: false, description: 'Historical periods' },
  { name: 'action', displayName: 'Action', category: 'genre', color: '#ff4757', isNSFW: false, description: 'Action and adventure' },
  { name: 'romantic', displayName: 'Romantic', category: 'genre', color: '#e84393', isNSFW: false, description: 'Romance and love' },
  { name: 'wholesome', displayName: 'Wholesome', category: 'genre', color: '#fdcb6e', isNSFW: false, description: 'Pure and innocent' },
  { name: 'sci-fi', displayName: 'Sci-Fi', category: 'genre', color: '#0984e3', isNSFW: false, description: 'Science fiction' },
  { name: 'horror', displayName: 'Horror', category: 'genre', color: '#2d3436', isNSFW: false, description: 'Horror and scary themes' },
  { name: 'detective', displayName: 'Detective', category: 'genre', color: '#636e72', isNSFW: false, description: 'Mystery and investigation' },
  { name: 'philosophy', displayName: 'Philosophy', category: 'genre', color: '#6c5ce7', isNSFW: false, description: 'Philosophical themes' },
  { name: 'politics', displayName: 'Politics', category: 'genre', color: '#d63031', isNSFW: false, description: 'Political themes' },
  { name: 'manga', displayName: 'Manga', category: 'genre', color: '#fd79a8', isNSFW: false, description: 'Japanese comics' },
  { name: 'fandom', displayName: 'Fandom', category: 'genre', color: '#74b9ff', isNSFW: false, description: 'Fan-created content' },

  // Personality
  { name: 'dominant', displayName: 'Dominant', category: 'personality', color: '#ff4757', isNSFW: false, description: 'Takes control in situations' },
  { name: 'submissive', displayName: 'Submissive', category: 'personality', color: '#3742fa', isNSFW: false, description: 'Prefers to follow' },
  { name: 'milf', displayName: 'MILF', category: 'personality', color: '#e84393', isNSFW: true, description: 'Mature attractive woman' },
  { name: 'bully', displayName: 'Bully', category: 'personality', color: '#ff4757', isNSFW: false, description: 'Aggressive and mean' },
  { name: 'switch', displayName: 'Switch', category: 'personality', color: '#fdcb6e', isNSFW: false, description: 'Can be dominant or submissive' },
  { name: 'femboy', displayName: 'Femboy', category: 'personality', color: '#fd79a8', isNSFW: false, description: 'Feminine male' },
  { name: 'tomboy', displayName: 'Tomboy', category: 'personality', color: '#00b894', isNSFW: false, description: 'Masculine female' },
  { name: 'villain', displayName: 'Villain', category: 'personality', color: '#2d3436', isNSFW: false, description: 'Evil or antagonistic' },
  { name: 'hero', displayName: 'Hero', category: 'personality', color: '#fdcb6e', isNSFW: false, description: 'Heroic and noble' },
  { name: 'tsundere', displayName: 'Tsundere', category: 'personality', color: '#fd79a8', isNSFW: false, description: 'Cold but caring inside' },
  { name: 'yandere', displayName: 'Yandere', category: 'personality', color: '#e84393', isNSFW: false, description: 'Obsessive and possessive' },
  { name: 'kuudere', displayName: 'Kuudere', category: 'personality', color: '#74b9ff', isNSFW: false, description: 'Cool and aloof' },
  { name: 'deredere', displayName: 'Deredere', category: 'personality', color: '#fd79a8', isNSFW: false, description: 'Sweet and energetic' },
  { name: 'dandere', displayName: 'Dandere', category: 'personality', color: '#fab1a0', isNSFW: false, description: 'Shy and quiet' },
  { name: 'sissy', displayName: 'Sissy', category: 'personality', color: '#fd79a8', isNSFW: true, description: 'Submissive feminine male' },
  { name: 'dilf', displayName: 'DILF', category: 'personality', color: '#0984e3', isNSFW: true, description: 'Attractive mature man' },
  { name: 'shy', displayName: 'Shy', category: 'personality', color: '#fab1a0', isNSFW: false, description: 'Introverted and reserved' },
  { name: 'confident', displayName: 'Confident', category: 'personality', color: '#ff6348', isNSFW: false, description: 'Self-assured and bold' },
  { name: 'flirty', displayName: 'Flirty', category: 'personality', color: '#fd79a8', isNSFW: false, description: 'Naturally charming' },
  { name: 'mysterious', displayName: 'Mysterious', category: 'personality', color: '#6c5ce7', isNSFW: false, description: 'Enigmatic and intriguing' },
  { name: 'caring', displayName: 'Caring', category: 'personality', color: '#00b894', isNSFW: false, description: 'Nurturing and compassionate' },
  { name: 'rebellious', displayName: 'Rebellious', category: 'personality', color: '#636e72', isNSFW: false, description: 'Goes against the grain' },
  { name: 'playful', displayName: 'Playful', category: 'personality', color: '#2ed573', isNSFW: false, description: 'Fun-loving and mischievous' },

  // Physical Traits
  { name: 'futa', displayName: 'Futa', category: 'physical', color: '#e84393', isNSFW: true, description: 'Futanari characters' },
  { name: 'petite', displayName: 'Petite', category: 'physical', color: '#fab1a0', isNSFW: false, description: 'Small and delicate' },
  { name: 'bbw', displayName: 'BBW', category: 'physical', color: '#fd79a8', isNSFW: true, description: 'Big beautiful woman' },
  { name: 'monster', displayName: 'Monster', category: 'physical', color: '#2d3436', isNSFW: false, description: 'Monster characters' },
  { name: 'furry', displayName: 'Furry', category: 'physical', color: '#e17055', isNSFW: false, description: 'Anthropomorphic animals' },
  { name: 'elf', displayName: 'Elf', category: 'physical', color: '#00b894', isNSFW: false, description: 'Elven characters' },
  { name: 'robot', displayName: 'Robot', category: 'physical', color: '#636e72', isNSFW: false, description: 'Robotic characters' },
  { name: 'giant', displayName: 'Giant', category: 'physical', color: '#2d3436', isNSFW: false, description: 'Large sized characters' },
  { name: 'succubus', displayName: 'Succubus', category: 'physical', color: '#e84393', isNSFW: true, description: 'Demonic seductress' },
  { name: 'alien', displayName: 'Alien', category: 'physical', color: '#00cec9', isNSFW: false, description: 'Extraterrestrial beings' },
  { name: 'maid', displayName: 'Maid', category: 'physical', color: '#636e72', isNSFW: false, description: 'Maid outfit/role' },
  { name: 'realistic', displayName: 'Realistic', category: 'physical', color: '#636e72', isNSFW: false, description: 'Realistic appearance' },
  { name: 'pregnant', displayName: 'Pregnant', category: 'physical', color: '#fd79a8', isNSFW: true, description: 'Expecting characters' },
  { name: 'shortstack', displayName: 'Shortstack', category: 'physical', color: '#fab1a0', isNSFW: true, description: 'Short and curvy' },
  { name: 'demi-human', displayName: 'Demi-Human', category: 'physical', color: '#a29bfe', isNSFW: false, description: 'Part human, part animal' },
  { name: 'goth', displayName: 'Goth', category: 'physical', color: '#2d3436', isNSFW: false, description: 'Gothic style' },
  { name: 'monster-girl', displayName: 'Monster Girl', category: 'physical', color: '#6c5ce7', isNSFW: false, description: 'Female monster characters' },

  // Appearance
  { name: 'blonde', displayName: 'Blonde', category: 'appearance', color: '#fdcb6e', isNSFW: false, description: 'Light colored hair' },
  { name: 'brunette', displayName: 'Brunette', category: 'appearance', color: '#8b4513', isNSFW: false, description: 'Brown hair' },
  { name: 'redhead', displayName: 'Redhead', category: 'appearance', color: '#e17055', isNSFW: false, description: 'Red hair' },
  { name: 'black-hair', displayName: 'Black Hair', category: 'appearance', color: '#2d3436', isNSFW: false, description: 'Dark black hair' },
  { name: 'tall', displayName: 'Tall', category: 'appearance', color: '#74b9ff', isNSFW: false, description: 'Above average height' },
  { name: 'curvy', displayName: 'Curvy', category: 'appearance', color: '#fd79a8', isNSFW: false, description: 'Voluptuous figure' },
  { name: 'athletic', displayName: 'Athletic', category: 'appearance', color: '#55a3ff', isNSFW: false, description: 'Fit and sporty' },
  { name: 'blue-eyes', displayName: 'Blue Eyes', category: 'appearance', color: '#0984e3', isNSFW: false, description: 'Blue colored eyes' },
  { name: 'green-eyes', displayName: 'Green Eyes', category: 'appearance', color: '#00b894', isNSFW: false, description: 'Green colored eyes' },

  // Origin
  { name: 'original-character', displayName: 'Original Character', category: 'origin', color: '#74b9ff', isNSFW: false, description: 'Original creations' },
  { name: 'game', displayName: 'Game', category: 'origin', color: '#00b894', isNSFW: false, description: 'Video game characters' },
  { name: 'movie', displayName: 'Movie', category: 'origin', color: '#e17055', isNSFW: false, description: 'Film characters' },
  { name: 'vtuber', displayName: 'VTuber', category: 'origin', color: '#fd79a8', isNSFW: false, description: 'Virtual YouTubers' },
  { name: 'books', displayName: 'Books', category: 'origin', color: '#636e72', isNSFW: false, description: 'Literature characters' },
  { name: 'folklore', displayName: 'Folklore', category: 'origin', color: '#a29bfe', isNSFW: false, description: 'Folk tales and legends' },

  // Sexuality
  { name: 'straight', displayName: 'Straight', category: 'sexuality', color: '#0984e3', isNSFW: false, description: 'Heterosexual orientation' },
  { name: 'bisexual', displayName: 'Bisexual', category: 'sexuality', color: '#e84393', isNSFW: false, description: 'Attracted to both genders' },
  { name: 'gay', displayName: 'Gay', category: 'sexuality', color: '#fd79a8', isNSFW: false, description: 'Homosexual orientation' },
  { name: 'lesbian', displayName: 'Lesbian', category: 'sexuality', color: '#e84393', isNSFW: false, description: 'Female homosexual' },
  { name: 'asexual', displayName: 'Asexual', category: 'sexuality', color: '#636e72', isNSFW: false, description: 'No sexual attraction' },

  // Fantasy/Kink
  { name: 'breeding', displayName: 'Breeding', category: 'fantasy', color: '#e84393', isNSFW: true, description: 'Reproduction fantasies' },
  { name: 'femdom', displayName: 'Femdom', category: 'fantasy', color: '#e84393', isNSFW: true, description: 'Female domination' },
  { name: 'cheating', displayName: 'Cheating', category: 'fantasy', color: '#ff4757', isNSFW: true, description: 'Infidelity scenarios' },
  { name: 'chastity', displayName: 'Chastity', category: 'fantasy', color: '#74b9ff', isNSFW: true, description: 'Sexual restraint' },
  { name: 'ntr', displayName: 'NTR', category: 'fantasy', color: '#ff4757', isNSFW: true, description: 'Netorare (cuckolding)' },
  { name: 'cnc', displayName: 'CNC', category: 'fantasy', color: '#636e72', isNSFW: true, description: 'Consensual non-consent' },
  { name: 'hypno', displayName: 'Hypno', category: 'fantasy', color: '#6c5ce7', isNSFW: true, description: 'Hypnosis themes' },
  { name: 'voyeur', displayName: 'Voyeur', category: 'fantasy', color: '#636e72', isNSFW: true, description: 'Watching others' },
  { name: 'bdsm', displayName: 'BDSM', category: 'fantasy', color: '#2d3436', isNSFW: true, description: 'Bondage and discipline' },
  { name: 'bondage', displayName: 'Bondage', category: 'fantasy', color: '#2d3436', isNSFW: true, description: 'Physical restraint' },
  { name: 'feet', displayName: 'Feet', category: 'fantasy', color: '#fab1a0', isNSFW: true, description: 'Foot fetish' },
  { name: 'worship', displayName: 'Worship', category: 'fantasy', color: '#fdcb6e', isNSFW: true, description: 'Worship and adoration' },

  // Content Rating
  { name: 'sfw', displayName: 'SFW', category: 'content', color: '#00b894', isNSFW: false, description: 'Safe for work' },
  { name: 'nsfw', displayName: 'NSFW', category: 'content', color: '#e84393', isNSFW: true, description: 'Not safe for work' },
  { name: 'mature', displayName: 'Mature', category: 'content', color: '#fd79a8', isNSFW: true, description: 'Mature themes' },

  // Relationship
  { name: 'girlfriend', displayName: 'Girlfriend', category: 'relationship', color: '#e84393', isNSFW: false, description: 'Romantic partner' },
  { name: 'boyfriend', displayName: 'Boyfriend', category: 'relationship', color: '#0984e3', isNSFW: false, description: 'Male romantic partner' },
  { name: 'friend', displayName: 'Friend', category: 'relationship', color: '#fdcb6e', isNSFW: false, description: 'Platonic companion' },
  { name: 'stranger', displayName: 'Stranger', category: 'relationship', color: '#636e72', isNSFW: false, description: 'Unknown person' },
  { name: 'roommate', displayName: 'Roommate', category: 'relationship', color: '#74b9ff', isNSFW: false, description: 'Lives together' },
  { name: 'colleague', displayName: 'Colleague', category: 'relationship', color: '#a29bfe', isNSFW: false, description: 'Work partner' },

  // Ethnicity
  { name: 'arab', displayName: 'Arab', category: 'ethnicity', color: '#e17055', isNSFW: false, description: 'Arabic ethnicity' },
  { name: 'asian', displayName: 'Asian', category: 'ethnicity', color: '#fdcb6e', isNSFW: false, description: 'Asian ethnicity' },
  { name: 'black', displayName: 'Black', category: 'ethnicity', color: '#2d3436', isNSFW: false, description: 'African descent' },
  { name: 'white', displayName: 'White', category: 'ethnicity', color: '#ddd', isNSFW: false, description: 'Caucasian ethnicity' },
  { name: 'latina', displayName: 'Latina', category: 'ethnicity', color: '#e17055', isNSFW: false, description: 'Latin American' },

  // Scenario
  { name: 'fantasy', displayName: 'Fantasy', category: 'scenario', color: '#a29bfe', isNSFW: false, description: 'Magical settings' },
  { name: 'modern', displayName: 'Modern', category: 'scenario', color: '#00cec9', isNSFW: false, description: 'Contemporary life' },
  { name: 'school', displayName: 'School', category: 'scenario', color: '#fdcb6e', isNSFW: false, description: 'Educational settings' },
  { name: 'office', displayName: 'Office', category: 'scenario', color: '#636e72', isNSFW: false, description: 'Workplace environment' },
  { name: 'adventure', displayName: 'Adventure', category: 'scenario', color: '#00b894', isNSFW: false, description: 'Exciting journeys' },
  { name: 'slice-of-life', displayName: 'Slice of Life', category: 'scenario', color: '#fab1a0', isNSFW: false, description: 'Everyday situations' },
  { name: 'post-apocalyptic', displayName: 'Post-Apocalyptic', category: 'scenario', color: '#636e72', isNSFW: false, description: 'After the apocalypse' },
];

async function seedTags() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aicompanion');
    console.log('Connected to MongoDB');

    // Clear existing tags
    await TagModel.deleteMany({});
    console.log('Cleared existing tags');

    // Insert initial tags
    await TagModel.insertMany(initialTags);
    console.log(`Inserted ${initialTags.length} tags`);

    console.log('Tag seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding tags:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the seed function
seedTags();
