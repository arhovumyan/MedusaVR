import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import { CharacterModel } from '../db/models/CharacterModel.js';
import { TagModel } from '../db/models/TagModel.js'; // Import TagModel for populate to work

dotenv.config();

async function checkZephyrTags() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aicompanion');
    
    const zephyr = await CharacterModel.findOne({ name: 'Zephyr' });
    
    if (zephyr) {
      console.log('\n🌪️  Zephyr Character Details:');
      console.log('=' .repeat(50));
      console.log(`Name: ${zephyr.name}`);
      console.log(`Description: ${zephyr.description}`);
      console.log(`\n TagNames Array (${zephyr.tagNames.length} items):`);
      console.log(`   [${zephyr.tagNames.join(', ')}]`);
      console.log(`\n🏷️  Tags Array (${zephyr.tags.length} ObjectId references):`);
      zephyr.tags.forEach((tagId: any, index: number) => {
        console.log(`   ${index + 1}. ${tagId}`);
      });
      console.log(`\n Arrays match: ${zephyr.tagNames.length === zephyr.tags.length ? 'YES' : 'NO'}`);
      console.log(` Tags array populated: ${zephyr.tags.length > 0 ? 'YES' : 'NO'}`);
    } else {
      console.log('Zephyr character not found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkZephyrTags();
