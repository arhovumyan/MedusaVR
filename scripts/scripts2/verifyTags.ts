import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { CharacterModel } from '../db/models/CharacterModel.js';

dotenv.config();

async function verifyCharacterTags() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aicompanion');
    console.log('Connected to MongoDB');

    // Get first 5 characters with their tags
    const characters = await CharacterModel.find({}).limit(5).select('name description tagNames');
    
    console.log('\n🏷️  Character Tags Preview:');
    console.log('=' .repeat(50));
    
    characters.forEach((char, index) => {
      console.log(`\n${index + 1}. ${char.name}`);
      console.log(`   Description: ${char.description}`);
      console.log(`   Tags: ${char.tagNames.join(', ')}`);
    });

    console.log('\n Character tags verified!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

verifyCharacterTags();
