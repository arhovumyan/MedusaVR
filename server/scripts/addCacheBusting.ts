import mongoose from 'mongoose';
import { CharacterModel } from '../db/models/CharacterModel';
import * as dotenv from 'dotenv';

dotenv.config();

async function addCacheBustingToCharacter(characterId: number) {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aicompanion');
    console.log('Connected to MongoDB');

    // Get Cloudinary cloud name from environment
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      throw new Error('CLOUDINARY_CLOUD_NAME not found in environment variables');
    }

    // Add timestamp for cache busting
    const timestamp = Date.now();
    const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/character_avatars/character_${characterId}?v=${timestamp}`;
    
    // Update the specific character
    const result = await CharacterModel.updateOne(
      { id: characterId },
      { avatar: cloudinaryUrl }
    );
    
    if (result.matchedCount > 0) {
      console.log(`Updated character ${characterId} with cache-busting URL: ${cloudinaryUrl}`);
    } else {
      console.log(`Character ${characterId} not found`);
    }

  } catch (error) {
    console.error('Error updating character avatar:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Get character ID from command line argument
const characterId = process.argv[2] ? parseInt(process.argv[2]) : 24;
addCacheBustingToCharacter(characterId);
