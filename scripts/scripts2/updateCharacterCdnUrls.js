#!/usr/bin/env node

/**
 * Script to update existing character avatar URLs from old www.medusa-vrfriendly.vercel.app to new medusavr.b-cdn.net
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { CharacterModel } from '../db/models/CharacterModel.js';

const MONGODB_URI = process.env.MONGODB_URI;

async function updateCharacterUrls() {
  try {
    console.log(' Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    
    console.log(' Finding characters with old CDN URLs...');
    const charactersWithOldUrls = await CharacterModel.find({ 
      avatar: { $regex: /^https:\/\/www\.medusavr\.art\// }
    });
    
    console.log(` Found ${charactersWithOldUrls.length} characters with old URLs`);
    
    if (charactersWithOldUrls.length === 0) {
      console.log(' No characters need URL updates');
      return;
    }
    
    let updated = 0;
    for (const character of charactersWithOldUrls) {
      const oldUrl = character.avatar;
      const newUrl = oldUrl.replace('https://www.medusa-vrfriendly.vercel.app/', 'https://medusavr.b-cdn.net/');
      
      console.log(` Updating ${character.name}:`);
      console.log(`   Old: ${oldUrl}`);
      console.log(`   New: ${newUrl}`);
      
      await CharacterModel.updateOne(
        { _id: character._id },
        { 
          $set: { 
            avatar: newUrl,
            // Also update imageMetadata fields if they exist
            ...(character.imageMetadata?.thumbnailUrl && {
              'imageMetadata.thumbnailUrl': character.imageMetadata.thumbnailUrl.replace('https://www.medusa-vrfriendly.vercel.app/', 'https://medusavr.b-cdn.net/')
            })
          }
        }
      );
      
      updated++;
    }
    
    console.log(` Successfully updated ${updated} character URLs`);
    
    // Verify the updates
    console.log(' Verifying updates...');
    const remainingOldUrls = await CharacterModel.countDocuments({ 
      avatar: { $regex: /^https:\/\/www\.medusavr\.art\// }
    });
    
    console.log(` Characters with old URLs after update: ${remainingOldUrls}`);
    
  } catch (error) {
    console.error(' Error updating character URLs:', error);
  } finally {
    await mongoose.disconnect();
    console.log(' Disconnected from MongoDB');
  }
}

// Run the script
updateCharacterUrls();
