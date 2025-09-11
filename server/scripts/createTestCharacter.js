import { CharacterModel } from '../db/models/CharacterModel.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Character data for Sakura Nightfall
const characterData = {
  id: 123, // Starting with a high number to avoid conflicts
  avatar: '', // Will be set after Cloudinary upload
  name: "Sakura Nightfall",
  description: "A seductive cyberpunk hacker with pink hair and a mysterious past. Known for her playful yet dangerous personality, she operates from the neon-lit shadows of Neo-Tokyo. Her expertise in digital infiltration is matched only by her charm and allure.",
  age: 25, // Character age - MUST be 18+
  quickSuggestion: "Want to explore the digital underworld together? I know all the best places... and the most dangerous ones too~",
  rating: "4.8",
  nsfw: true,
  chatCount: 0,
  likes: 0,
  commentsCount: 0,
  creatorId: null, // System generated character
  
  // Enhanced character creation fields
  personalityTraits: {
    mainTrait: "flirty",
    subTraits: ["confident", "mysterious", "playful"]
  },
  
  artStyle: {
    primaryStyle: "cyberpunk-anime"
  },
  
  selectedTags: {
    'character-type': ['anime', 'cyberpunk'],
    'genre': ['sci-fi', 'romance'],
    'personality': ['flirty', 'confident', 'mysterious'],
    'appearance': ['pink-hair', 'seductive', 'tech-enhanced'],
    'origin': ['futuristic', 'neo-tokyo'],
    'sexuality': ['bisexual'],
    'fantasy': ['cyberpunk', 'hacker'],
    'content-rating': ['nsfw', 'mature'],
    'ethnicity': ['asian'],
    'scenario': ['urban', 'nightlife']
  },
  
  // Image generation prompts
  positivePrompt: "cyberpunk hacker girl, pink hair, neon lights, futuristic city background, seductive pose, high tech outfit, glowing cybernetic implants, anime art style",
  negativePrompt: "blurry, low quality, deformed, ugly, distorted, bad anatomy"
};

async function createTestCharacter() {
  try {
    console.log('🎭 Creating test character: Sakura Nightfall');
    
    // Check if character already exists
    const existingChar = await CharacterModel.findOne({ name: characterData.name });
    if (existingChar) {
      console.log('⚠️  Character with this name already exists. Skipping creation.');
      return;
    }
    
    // Upload placeholder avatar to Cloudinary
    const placeholderPath = path.join(__dirname, '../assets/placeholder-avatar.jpg');
    
    let avatarUrl = 'https://via.placeholder.com/300x400/ff69b4/ffffff?text=Sakura';
    
    if (fs.existsSync(placeholderPath)) {
      console.log('📤 Uploading avatar to Cloudinary...');
      const uploadResult = await cloudinary.uploader.upload(placeholderPath, {
        folder: `characters/${characterData.name.toLowerCase().replace(/\s+/g, '-')}`,
        public_id: 'avatar',
        overwrite: true
      });
      avatarUrl = uploadResult.secure_url;
      console.log('✅ Avatar uploaded successfully');
    }
    
    // Set the avatar URL
    characterData.avatar = avatarUrl;
    
    // Create the character in the database
    const newCharacter = new CharacterModel(characterData);
    const savedCharacter = await newCharacter.save();
    
    console.log('🎉 Test character created successfully!');
    console.log('📝 Character details:', {
      id: savedCharacter.id,
      name: savedCharacter.name,
      age: savedCharacter.age,
      avatar: savedCharacter.avatar,
      nsfw: savedCharacter.nsfw,
      createdAt: savedCharacter.createdAt
    });
    
  } catch (error) {
    console.error('❌ Error creating test character:', error);
    
    if (error.name === 'ValidationError') {
      console.log('🔍 Validation errors:', error.errors);
    }
  }
}

// Run the script
createTestCharacter()
  .then(() => {
    console.log('✨ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
