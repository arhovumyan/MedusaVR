import mongoose from 'mongoose';
import { CharacterModel } from '../db/models/CharacterModel';
import * as dotenv from 'dotenv';

dotenv.config();

async function addCacheBustingToCharacter24() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aicompanion');
    console.log('Connected to MongoDB');

    // Get Cloudinary cloud name from environment
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      throw new Error('CLOUDINARY_CLOUD_NAME not found in environment variables');
    }

    // Add timestamp to force cache refresh
    const timestamp = Date.now();
    const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/character_avatars/character_24?v=${timestamp}`;
    
    // Update character 24 specifically
    const result = await CharacterModel.updateOne(
      { id: 24 },
      { avatar: cloudinaryUrl }
    );
    
    if (result.modifiedCount > 0) {
      console.log(` Updated character 24 with cache-busting URL: ${cloudinaryUrl}`);
    } else {
      console.log(' Character 24 not found or not updated');
    }

  } catch (error) {
    console.error('Error updating character 24:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the update function
addCacheBustingToCharacter24();
