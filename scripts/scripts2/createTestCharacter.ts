import { CharacterModel } from '../db/models/CharacterModel';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

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
  id: 100, // Starting with a high number to avoid conflicts
  avatar: '', // Will be set after Cloudinary upload
  name: "Sakura Nightfall",
  description: "A seductive cyberpunk hacker with pink hair and a mysterious past. Known for her playful yet dangerous personality, she operates from the neon-lit shadows of Neo-Tokyo. Her expertise in digital infiltration is matched only by her charm and allure.",
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
    primaryStyle: "anime",
    secondaryStyle: "fully-anime"
  },
  
  selectedTags: {
    'character-type': ["female"],
    'genre': ["sci-fi", "anime", "hentai"],
    'personality': ["flirty", "confident", "mysterious", "dominant"],
    'appearance': ["curvy", "brunette", "blue-eyes"],
    'origin': ["original-character"],
    'sexuality': ["bisexual"],
    'fantasy': ["breeding", "femdom"],
    'content-rating': ["nsfw", "mature"],
    'ethnicity': ["asian"],
    'scenario': ["modern", "adventure"]
  },
  
  // Image generation data (simulated since we're using existing image)
  imageGeneration: {
    prompt: "masterpiece, best quality, anime coloring, 1girl, pink hair, long hair, blue eyes, cyberpunk outfit, neon city background, seductive pose, detailed face, high quality",
    negativePrompt: "blurry, bad anatomy, extra limbs, low quality, worst quality, bad quality, jpeg artifacts",
    stylePrompt: "cyberpunk anime style, neon lighting, high detail",
    seed: 1234567890,
    steps: 20,
    cfgScale: 7,
    width: 512,
    height: 768,
    model: "ILustMix.safetensors",
    generationTime: new Date(),
    runpodJobId: null
  },
  
  // Image metadata
  imageMetadata: {
    cloudinaryPublicId: '',
    uploadedAt: new Date(),
    originalFilename: '84969772.jpeg',
    generationType: 'uploaded' as const,
    originalImageUrl: '',
    thumbnailUrl: '',
    altVersions: []
  },
  
  // Creation metadata
  creationProcess: {
    stepCompleted: 5,
    totalSteps: 5,
    isDraft: false,
    lastSavedAt: new Date(),
    timeSpent: 300
  }
};

async function uploadImageToCloudinary(imagePath: string, publicId: string): Promise<string> {
  try {
    console.log(` Uploading ${imagePath} to Cloudinary...`);
    
    const result = await cloudinary.uploader.upload(imagePath, {
      public_id: publicId,
      folder: 'medusavr/characters',
      resource_type: 'image',
      transformation: [
        { width: 512, height: 768, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' }
      ]
    });
    
    console.log(` Image uploaded successfully: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error(' Error uploading to Cloudinary:', error);
    throw error;
  }
}

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!, {
      dbName: "test",
    });
    console.log(" MongoDB connected to", mongoose.connection.name);
  } catch (err) {
    console.error(" MongoDB connection error:", err);
    throw err;
  }
}

async function createCharacter() {
  try {
    console.log(' Starting character creation process...');
    
    // Connect to database
    await connectToDatabase();
    
    // Path to the selected image
    const imagePath = path.join(__dirname, '../../medusaVR_Photos/84969772.jpeg');
    
    // Check if image exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image not found: ${imagePath}`);
    }
    
    console.log(` Using image: ${imagePath}`);
    
    // Upload image to Cloudinary
    const publicId = `sakura_nightfall_${Date.now()}`;
    const cloudinaryUrl = await uploadImageToCloudinary(imagePath, publicId);
    
    // Update character data with Cloudinary URL and metadata
    characterData.avatar = cloudinaryUrl;
    characterData.imageMetadata.cloudinaryPublicId = publicId;
    characterData.imageMetadata.originalImageUrl = cloudinaryUrl;
    characterData.imageMetadata.thumbnailUrl = cloudinaryUrl;
    
    // Create character in database
    console.log(' Creating character in database...');
    const character = new CharacterModel(characterData);
    await character.save();
    
    console.log(' Character created successfully!');
    console.log(' Character Details:');
    console.log(`   ID: ${character.id}`);
    console.log(`   Name: ${character.name}`);
    console.log(`   Avatar: ${character.avatar}`);
    console.log(`   NSFW: ${character.nsfw}`);
    console.log(`   Tags: ${JSON.stringify(character.selectedTags, null, 2)}`);
    
    return character;
    
  } catch (error) {
    console.error(' Error creating character:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createCharacter()
    .then(() => {
      console.log(' Character generation completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Character generation failed:', error);
      process.exit(1);
    });
}

export { createCharacter, characterData };
