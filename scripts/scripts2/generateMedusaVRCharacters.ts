import { CharacterModel } from '../db/models/CharacterModel';
import { TagModel } from '../db/models/TagModel';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connect, disconnect } from 'mongoose';
import * as dotenv from 'dotenv';
import { Types } from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// VRFans user ID
const VRFANS_USER_ID = '685c4c4c60826d0b60cde7fd';

// Female name pools for generating unique names
const firstNames = [
  'Aria', 'Luna', 'Scarlett', 'Isabella', 'Victoria', 'Anastasia', 'Seraphina', 'Evangeline',
  'Gabrielle', 'Valentina', 'Aurora', 'Celeste', 'Delilah', 'Jasmine', 'Melody', 'Natasha',
  'Ophelia', 'Penelope', 'Quinn', 'Raven', 'Sophia', 'Tessa', 'Ursula', 'Vivian', 'Willow',
  'Ximena', 'Yvonne', 'Zara', 'Bianca', 'Carmen', 'Diana', 'Elena', 'Fiona', 'Grace',
  'Helena', 'Iris', 'Jade', 'Kiara', 'Leila', 'Maya', 'Nina', 'Olivia', 'Priya', 'Rosa',
  'Stella', 'Tara', 'Uma', 'Vera', 'Zoe', 'Alexis', 'Brooke', 'Chloe', 'Daphne', 'Emma'
];

const lastNames = [
  'Vex', 'Shadowmere', 'Blackthorn', 'Nightshade', 'Crimson', 'Wilde', 'Sterling', 'Rose',
  'Fox', 'Knight', 'Stone', 'Cross', 'Moon', 'Star', 'Fire', 'Snow', 'Storm', 'Wind',
  'Vale', 'Hart', 'Grey', 'Black', 'White', 'Gold', 'Silver', 'Diamond', 'Pearl', 'Ruby',
  'Emerald', 'Sapphire', 'Phoenix', 'Dragon', 'Wolf', 'Raven', 'Dove', 'Swan', 'Tiger',
  'Lynx', 'Panther', 'Viper', 'Cobra', 'Falcon', 'Eagle', 'Hawk', 'Steel', 'Iron', 'Copper',
  'Bronze', 'Hunter', 'Archer', 'Warrior', 'Queen', 'Princess', 'Goddess', 'Angel', 'Devil'
];

// Personality traits for descriptions
const personalityTraits = [
  'seductive', 'mysterious', 'confident', 'playful', 'dominant', 'submissive', 'sweet', 'wild',
  'sophisticated', 'adventurous', 'passionate', 'sensual', 'alluring', 'enchanting', 'captivating',
  'fierce', 'gentle', 'bold', 'shy', 'exotic', 'elegant', 'rebellious', 'innocent', 'experienced'
];

const themes = [
  'vampire aristocrat', 'dark sorceress', 'mystical enchantress', 'seductive spy', 'fallen angel',
  'dragon princess', 'pirate queen', 'demon huntress', 'cyber assassin', 'royal courtesan',
  'space explorer', 'time traveler', 'magical healer', 'shadow dancer', 'fire elemental',
  'ice queen', 'forest nymph', 'ocean siren', 'desert nomad', 'mountain warrior'
];

// Tag pools for random selection
const tagPools = {
  'character-type': ['female'],
  'genre': ['fantasy', 'sci-fi', 'modern', 'historical', 'supernatural', 'romantic', 'adventure'],
  'personality': ['dominant', 'submissive', 'flirty', 'mysterious', 'confident', 'playful', 'sweet', 'wild'],
  'appearance': ['curvy', 'tall', 'petite', 'athletic', 'voluptuous', 'slim'],
  'hair': ['brunette', 'blonde', 'redhead', 'black-hair', 'white-hair', 'colorful-hair'],
  'origin': ['original-character'],
  'sexuality': ['bisexual', 'straight', 'lesbian'],
  'fantasy': ['breeding', 'femdom', 'bdsm', 'vanilla', 'taboo', 'romantic'],
  'content-rating': ['nsfw', 'mature'],
  'ethnicity': ['white', 'asian', 'latina', 'black', 'mixed'],
  'scenario': ['fantasy', 'modern', 'historical', 'sci-fi']
};

// Generate random tags
function generateRandomTags() {
  const selectedTags: any = {};
  
  for (const [category, options] of Object.entries(tagPools)) {
    if (category === 'character-type' || category === 'origin' || category === 'content-rating') {
      // Always include these
      selectedTags[category] = options;
    } else {
      // Randomly select 1-3 tags from each category
      const count = Math.floor(Math.random() * 3) + 1;
      const shuffled = [...options].sort(() => 0.5 - Math.random());
      selectedTags[category] = shuffled.slice(0, count);
    }
  }
  
  return selectedTags;
}

// Generate character description
function generateCharacterDescription(name: string, theme: string, traits: string[]) {
  const trait1 = traits[0] || 'mysterious';
  const trait2 = traits[1] || 'seductive';
  const trait3 = traits[2] || 'confident';
  
  const descriptions = [
    `${name} is a ${trait1} ${theme} with an irresistible charm that draws people into her world of passion and desire. Her ${trait2} nature is matched only by her ${trait3} demeanor, making her both captivating and dangerous. She moves through life with the grace of someone who knows exactly what she wants and isn't afraid to take it.

Born into a world where power and pleasure intertwine, ${name} has learned to navigate the complex dynamics of desire and control. Her past is shrouded in mystery, but those lucky enough to get close to her discover layers of complexity that make her even more alluring. Every encounter with her is an adventure that leaves lasting impressions and burning desires for more.`,

    `Meet ${name}, a ${trait1} ${theme} whose very presence seems to ignite passion in those around her. Her ${trait2} smile and ${trait3} attitude make her unforgettable, while her mysterious past adds an element of intrigue that keeps people coming back for more. She's the kind of person who turns ordinary moments into extraordinary experiences.

${name}'s world is one of sensuality and sophistication, where she reigns supreme as a goddess of desire. Her stories are filled with passion, adventure, and the kind of intimate connections that transcend the physical realm. Those who enter her domain find themselves transformed, discovering new depths of pleasure and connection they never knew existed.`,

    `${name} embodies the perfect combination of ${trait1} allure and ${trait2} confidence. As a ${theme}, she has mastered the art of seduction while maintaining an air of mystery that makes her irresistible. Her ${trait3} personality shines through in every interaction, creating connections that are both intense and meaningful.

In her world, boundaries are meant to be explored and fantasies are meant to be fulfilled. ${name} believes in the power of intimate connection and uses her natural charisma to create experiences that are both thrilling and deeply satisfying. Her presence alone is enough to spark desire, but her true gift lies in her ability to understand and fulfill the deepest fantasies of those who seek her company.`
  ];
  
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

// Upload image to Cloudinary
async function uploadImageToCloudinary(imagePath: string, characterName: string): Promise<string> {
  try {
    const folderPath = `characters/medusavr`;
    const publicId = `${characterName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    
    console.log(`📤 Uploading image: ${path.basename(imagePath)}`);
    
    const result = await cloudinary.uploader.upload(imagePath, {
      folder: folderPath,
      public_id: publicId,
      transformation: [
        { width: 512, height: 768, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good', format: 'jpg' }
      ]
    });
    
    console.log(` Image uploaded successfully: ${result.secure_url}`);
    return result.secure_url;
    
  } catch (error) {
    console.error(` Error uploading image ${imagePath}:`, error);
    throw error;
  }
}

// Create a single character
async function createCharacterFromImage(imagePath: string): Promise<void> {
  try {
    const filename = path.basename(imagePath);
    
    // Generate random character details
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const characterName = `${firstName} ${lastName}`;
    
    const theme = themes[Math.floor(Math.random() * themes.length)];
    const traits = personalityTraits.sort(() => 0.5 - Math.random()).slice(0, 3);
    const description = generateCharacterDescription(characterName, theme, traits);
    const selectedTags = generateRandomTags();
    
    // Generate random stats
    const likes = Math.floor(Math.random() * 500) + 50;
    const chatCount = Math.floor(Math.random() * 200) + 10;
    const rating = (Math.random() * 1.5 + 3.5).toFixed(1); // 3.5-5.0
    
    // Generate unique numeric ID
    let characterId;
    let isUnique = false;
    while (!isUnique) {
      characterId = Math.floor(Math.random() * 900000) + 100000; // 6-digit number
      const existing = await CharacterModel.findOne({ id: characterId });
      if (!existing) {
        isUnique = true;
      }
    }
    
    // Upload image to Cloudinary
    const avatarUrl = await uploadImageToCloudinary(imagePath, characterName);
    
    // Create character
    const newCharacter = new CharacterModel({
      id: characterId,
      name: characterName,
      description: description,
      avatar: avatarUrl,
      selectedTags: selectedTags,
      nsfw: true,
      creatorId: new Types.ObjectId(VRFANS_USER_ID),
      likes: likes,
      chatCount: chatCount,
      rating: rating,
      quickSuggestion: `Hey there! I'm ${characterName}, ready for some exciting adventures together~`,
      personalityTraits: {
        mainTrait: traits[0],
        subTraits: traits.slice(1)
      },
      artStyle: {
        primaryStyle: "realistic",
        secondaryStyle: "photography"
      }
    });
    
    await newCharacter.save();
    
    console.log(` Created character: ${characterName} (ID: ${characterId})`);
    console.log(`   - Theme: ${theme}`);
    console.log(`   - Traits: ${traits.join(', ')}`);
    console.log(`   - Likes: ${likes}, Chats: ${chatCount}, Rating: ${rating}`);
    console.log(`   - Image: ${filename}`);
    console.log('');
    
  } catch (error) {
    console.error(` Error creating character from ${imagePath}:`, error);
    throw error;
  }
}

// Delete all existing characters
async function deleteAllCharacters(): Promise<void> {
  try {
    const existingCount = await CharacterModel.countDocuments();
    console.log(`  Found ${existingCount} existing characters`);
    
    if (existingCount > 0) {
      const result = await CharacterModel.deleteMany({});
      console.log(` Deleted ${result.deletedCount} characters`);
    } else {
      console.log('  No characters to delete');
    }
  } catch (error) {
    console.error(' Error deleting characters:', error);
    throw error;
  }
}

// Get all image files from medusaVR_Photos directory
function getImageFiles(): string[] {
  const photosDir = path.join(__dirname, '../../medusaVR_Photos');
  
  if (!fs.existsSync(photosDir)) {
    throw new Error(`Photos directory not found: ${photosDir}`);
  }
  
  const files = fs.readdirSync(photosDir);
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
  });
  
  return imageFiles.map(file => path.join(photosDir, file));
}

// Main function
async function main() {
  try {
    // Connect to MongoDB
    const baseUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test';
    const testDbUri = baseUri.replace(/\/[^/]*(\?|$)/, '/test$1');
    await connect(testDbUri);
    console.log(' Connected to MongoDB');
    
    // Delete all existing characters
    console.log(' Starting character regeneration process...\n');
    await deleteAllCharacters();
    
    // Get image files
    const imageFiles = getImageFiles();
    console.log(` Found ${imageFiles.length} image files in medusaVR_Photos directory\n`);
    
    if (imageFiles.length === 0) {
      console.log(' No image files found. Exiting...');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    // Create characters from images
    for (let i = 0; i < imageFiles.length; i++) {
      try {
        console.log(`Creating character ${i + 1}/${imageFiles.length}...`);
        await createCharacterFromImage(imageFiles[i]);
        successCount++;
      } catch (error) {
        console.error(` Failed to create character from ${imageFiles[i]}:`, error);
        errorCount++;
      }
    }
    
    console.log('\n Generation Summary:');
    console.log(` Successfully created: ${successCount} characters`);
    console.log(` Failed: ${errorCount} characters`);
    console.log(` Success rate: ${((successCount / imageFiles.length) * 100).toFixed(1)}%`);
    console.log(`👤 All characters created by: VRFans (ID: ${VRFANS_USER_ID})`);
    
  } catch (error) {
    console.error('💥 Script failed:', error);
  } finally {
    await disconnect();
    console.log(' Disconnected from MongoDB');
  }
}

// Run the script
main().catch(console.error); 