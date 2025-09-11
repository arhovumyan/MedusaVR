import mongoose from 'mongoose';
import { CharacterModel } from '../db/models/CharacterModel';
import * as dotenv from 'dotenv';

dotenv.config();

async function updateCharacterAvatarsToCloudinary() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aicompanion');
    console.log('Connected to MongoDB');

    // Get Cloudinary cloud name from environment
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      throw new Error('CLOUDINARY_CLOUD_NAME not found in environment variables');
    }

    // Get all characters
    const characters = await CharacterModel.find({});
    console.log(`Found ${characters.length} characters to update`);

    // Update each character with their Cloudinary avatar URL
    for (const character of characters) {
      const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/upload/character_avatars/character_${character.id}`;
      
      await CharacterModel.updateOne(
        { _id: character._id },
        { avatar: cloudinaryUrl }
      );
      
      console.log(`Updated character ${character.id} (${character.name}) with Cloudinary URL: ${cloudinaryUrl}`);
    }

    console.log('All characters updated successfully!');
  } catch (error) {
    console.error('Error updating character avatars:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the update function
updateCharacterAvatarsToCloudinary();
