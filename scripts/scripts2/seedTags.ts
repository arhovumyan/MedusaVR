import mongoose from 'mongoose';
import { TagModel } from '../db/models/TagModel';
import * as dotenv from 'dotenv';

dotenv.config();

const initialTags = [
  // Character Type
  { name: 'female', displayName: 'Female', category: 'character-type', color: '#e84393', isNSFW: false, description: 'Female characters' },
  { name: 'male', displayName: 'Male', category: 'character-type', color: '#0984e3', isNSFW: false, description: 'Male characters' },
  { name: 'android', displayName: 'Android', category: 'character-type', color: '#636e72', isNSFW: false, description: 'Android characters' },
  { name: 'alien', displayName: 'Alien', category: 'character-type', color: '#00b894', isNSFW: false, description: 'Alien characters' },
  { name: 'angel', displayName: 'Angel', category: 'character-type', color: '#ffeaa7', isNSFW: false, description: 'Angel characters' },
  { name: 'fairy', displayName: 'Fairy', category: 'character-type', color: '#a29bfe', isNSFW: false, description: 'Fairy characters' },
  { name: 'robot', displayName: 'Robot', category: 'character-type', color: '#636e72', isNSFW: false, description: 'Robot characters' },
  { name: 'animal', displayName: 'Animal', category: 'character-type', color: '#e17055', isNSFW: false, description: 'Animal characters' },

  // Genre
  { name: 'sci-fi', displayName: 'Sci-Fi', category: 'genre', color: '#0984e3', isNSFW: false, description: 'Science fiction' },
  { name: 'fantasy', displayName: 'Fantasy', category: 'genre', color: '#6c5ce7', isNSFW: false, description: 'Fantasy and magic' },
  { name: 'romance', displayName: 'Romance', category: 'genre', color: '#fd79a8', isNSFW: false, description: 'Romance and love' },
  { name: 'adventure', displayName: 'Adventure', category: 'genre', color: '#e17055', isNSFW: false, description: 'Action and adventure' },
  { name: 'mystery', displayName: 'Mystery', category: 'genre', color: '#636e72', isNSFW: false, description: 'Mystery and investigation' },
  { name: 'slice-of-life', displayName: 'Slice of Life', category: 'genre', color: '#ffeaa7', isNSFW: false, description: 'Everyday life stories' },
  { name: 'cyberpunk', displayName: 'Cyberpunk', category: 'genre', color: '#00b894', isNSFW: false, description: 'Futuristic technology' },
  { name: 'historical', displayName: 'Historical', category: 'genre', color: '#e17055', isNSFW: false, description: 'Historical periods' },
  { name: 'comedy', displayName: 'Comedy', category: 'genre', color: '#fdcb6e', isNSFW: false, description: 'Funny and humorous' },
  { name: 'drama', displayName: 'Drama', category: 'genre', color: '#6c5ce7', isNSFW: false, description: 'Serious and emotional' },

  // Personality
  { name: 'confident', displayName: 'Confident', category: 'personality', color: '#e84393', isNSFW: false, description: 'Self-assured and bold' },
  { name: 'shy', displayName: 'Shy', category: 'personality', color: '#fd79a8', isNSFW: false, description: 'Quiet and reserved' },
  { name: 'mysterious', displayName: 'Mysterious', category: 'personality', color: '#636e72', isNSFW: false, description: 'Enigmatic and secretive' },
  { name: 'playful', displayName: 'Playful', category: 'personality', color: '#ffeaa7', isNSFW: false, description: 'Fun-loving and cheerful' },
  { name: 'serious', displayName: 'Serious', category: 'personality', color: '#2d3436', isNSFW: false, description: 'Focused and determined' },
  { name: 'caring', displayName: 'Caring', category: 'personality', color: '#00b894', isNSFW: false, description: 'Kind and compassionate' },
  { name: 'rebellious', displayName: 'Rebellious', category: 'personality', color: '#e17055', isNSFW: false, description: 'Independent and free-spirited' },
  { name: 'intellectual', displayName: 'Intellectual', category: 'personality', color: '#0984e3', isNSFW: false, description: 'Smart and thoughtful' },
  { name: 'hero', displayName: 'Hero', category: 'personality', color: '#fdcb6e', isNSFW: false, description: 'Heroic and noble' },
  { name: 'villain', displayName: 'Villain', category: 'personality', color: '#2d3436', isNSFW: false, description: 'Antagonistic character' },

  // Appearance
  { name: 'long-hair', displayName: 'Long Hair', category: 'appearance', color: '#ffeaa7', isNSFW: false, description: 'Long hair style' },
  { name: 'short-hair', displayName: 'Short Hair', category: 'appearance', color: '#fd79a8', isNSFW: false, description: 'Short hair style' },
  { name: 'colorful-hair', displayName: 'Colorful Hair', category: 'appearance', color: '#00b894', isNSFW: false, description: 'Bright colored hair' },
  { name: 'glasses', displayName: 'Glasses', category: 'appearance', color: '#0984e3', isNSFW: false, description: 'Wears glasses' },
  { name: 'hat', displayName: 'Hat', category: 'appearance', color: '#e17055', isNSFW: false, description: 'Wears a hat' },
  { name: 'smile', displayName: 'Friendly Smile', category: 'appearance', color: '#636e72', isNSFW: false, description: 'Has a warm smile' },
  { name: 'wings', displayName: 'Wings', category: 'appearance', color: '#2d3436', isNSFW: false, description: 'Has wings' },
  { name: 'glowing-eyes', displayName: 'Glowing Eyes', category: 'appearance', color: '#6c5ce7', isNSFW: false, description: 'Eyes that glow' },

  // Origin
  { name: 'human', displayName: 'Human', category: 'origin', color: '#6c5ce7', isNSFW: false, description: 'Human origin' },
  { name: 'magical', displayName: 'Magical', category: 'origin', color: '#a29bfe', isNSFW: false, description: 'Magical origin' },
  { name: 'divine', displayName: 'Divine', category: 'origin', color: '#ffeaa7', isNSFW: false, description: 'Divine origin' },
  { name: 'alien', displayName: 'Alien', category: 'origin', color: '#00b894', isNSFW: false, description: 'Alien origin' },
  { name: 'artificial', displayName: 'Artificial', category: 'origin', color: '#636e72', isNSFW: false, description: 'Artificial origin' },
  { name: 'mythical', displayName: 'Mythical', category: 'origin', color: '#fd79a8', isNSFW: false, description: 'Mythical origin' },
  { name: 'nature', displayName: 'Nature', category: 'origin', color: '#e84393', isNSFW: false, description: 'Nature origin' },
  { name: 'cosmic', displayName: 'Cosmic', category: 'origin', color: '#e17055', isNSFW: false, description: 'Cosmic origin' },

  // Fantasy
  { name: 'magic-user', displayName: 'Magic User', category: 'fantasy', color: '#6c5ce7', isNSFW: false, description: 'Uses magic' },
  { name: 'shapeshifter', displayName: 'Shapeshifter', category: 'fantasy', color: '#fd79a8', isNSFW: false, description: 'Can change form' },
  { name: 'immortal', displayName: 'Immortal', category: 'fantasy', color: '#ffeaa7', isNSFW: false, description: 'Lives forever' },
  { name: 'telepathic', displayName: 'Telepathic', category: 'fantasy', color: '#0984e3', isNSFW: false, description: 'Can read minds' },
  { name: 'elemental-powers', displayName: 'Elemental Powers', category: 'fantasy', color: '#e17055', isNSFW: false, description: 'Controls elements' },
  { name: 'time-traveler', displayName: 'Time Traveler', category: 'fantasy', color: '#636e72', isNSFW: false, description: 'Can travel through time' },
  { name: 'superhuman', displayName: 'Superhuman', category: 'fantasy', color: '#e84393', isNSFW: false, description: 'Has super abilities' },
  { name: 'cursed', displayName: 'Cursed', category: 'fantasy', color: '#2d3436', isNSFW: false, description: 'Under a curse' },

  // Ethnicity
  { name: 'asian', displayName: 'Asian', category: 'ethnicity', color: '#fd79a8', isNSFW: false, description: 'Asian heritage' },
  { name: 'european', displayName: 'European', category: 'ethnicity', color: '#0984e3', isNSFW: false, description: 'European heritage' },
  { name: 'african', displayName: 'African', category: 'ethnicity', color: '#e17055', isNSFW: false, description: 'African heritage' },
  { name: 'latino', displayName: 'Latino', category: 'ethnicity', color: '#ffeaa7', isNSFW: false, description: 'Latino heritage' },
  { name: 'native-american', displayName: 'Native American', category: 'ethnicity', color: '#e84393', isNSFW: false, description: 'Native American heritage' },
  { name: 'middle-eastern', displayName: 'Middle Eastern', category: 'ethnicity', color: '#6c5ce7', isNSFW: false, description: 'Middle Eastern heritage' },
  { name: 'mixed', displayName: 'Mixed', category: 'ethnicity', color: '#00b894', isNSFW: false, description: 'Mixed heritage' },
  { name: 'other', displayName: 'Other', category: 'ethnicity', color: '#636e72', isNSFW: false, description: 'Other heritage' },

  // Profession
  { name: 'teacher', displayName: 'Teacher', category: 'profession', color: '#0984e3', isNSFW: false, description: 'Educator' },
  { name: 'doctor', displayName: 'Doctor', category: 'profession', color: '#e17055', isNSFW: false, description: 'Medical professional' },
  { name: 'scientist', displayName: 'Scientist', category: 'profession', color: '#6c5ce7', isNSFW: false, description: 'Scientific researcher' },
  { name: 'artist', displayName: 'Artist', category: 'profession', color: '#fd79a8', isNSFW: false, description: 'Creative artist' },
  { name: 'musician', displayName: 'Musician', category: 'profession', color: '#ffeaa7', isNSFW: false, description: 'Music performer' },
  { name: 'writer', displayName: 'Writer', category: 'profession', color: '#00b894', isNSFW: false, description: 'Author or writer' },
  { name: 'engineer', displayName: 'Engineer', category: 'profession', color: '#636e72', isNSFW: false, description: 'Technical engineer' },
  { name: 'chef', displayName: 'Chef', category: 'profession', color: '#e84393', isNSFW: false, description: 'Culinary professional' },
  { name: 'pilot', displayName: 'Pilot', category: 'profession', color: '#2d3436', isNSFW: false, description: 'Aircraft pilot' },
  { name: 'astronaut', displayName: 'Astronaut', category: 'profession', color: '#0984e3', isNSFW: false, description: 'Space explorer' },
  { name: 'detective', displayName: 'Detective', category: 'profession', color: '#6c5ce7', isNSFW: false, description: 'Investigator' },
  { name: 'librarian', displayName: 'Librarian', category: 'profession', color: '#fd79a8', isNSFW: false, description: 'Library professional' },
  { name: 'gardener', displayName: 'Gardener', category: 'profession', color: '#00b894', isNSFW: false, description: 'Plant caretaker' },
  { name: 'photographer', displayName: 'Photographer', category: 'profession', color: '#e17055', isNSFW: false, description: 'Photo artist' },
  { name: 'veterinarian', displayName: 'Veterinarian', category: 'profession', color: '#ffeaa7', isNSFW: false, description: 'Animal doctor' },
  { name: 'architect', displayName: 'Architect', category: 'profession', color: '#636e72', isNSFW: false, description: 'Building designer' },
  { name: 'dancer', displayName: 'Dancer', category: 'profession', color: '#e84393', isNSFW: false, description: 'Dance performer' },
  { name: 'athlete', displayName: 'Athlete', category: 'profession', color: '#2d3436', isNSFW: false, description: 'Sports professional' },
  { name: 'magician', displayName: 'Magician', category: 'profession', color: '#6c5ce7', isNSFW: false, description: 'Magic performer' },
  { name: 'explorer', displayName: 'Explorer', category: 'profession', color: '#00b894', isNSFW: false, description: 'Adventure seeker' }
];

async function seedTags() {
  try {
    console.log('🌱 Starting tag seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/your-database', {
      dbName: process.env.DB_NAME || "your-database",
    });
    console.log(' Connected to MongoDB');

    // Clear existing tags
    await TagModel.deleteMany({});
    console.log(' Cleared existing tags');

    // Insert new tags
    const insertedTags = await TagModel.insertMany(initialTags);
    console.log(` Inserted ${insertedTags.length} tags`);

    // Log categories
    const categories = [...new Set(initialTags.map(tag => tag.category))];
    console.log('📂 Categories created:', categories);

    console.log(' Tag seeding completed successfully!');
  } catch (error) {
    console.error(' Tag seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log(' Disconnected from MongoDB');
  }
}

// Run the seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTags();
}

export { seedTags, initialTags };