#!/usr/bin/env tsx

import mongoose from 'mongoose';
import { CharacterModel } from '../db/models/CharacterModel.js';
import 'dotenv/config';

async function verifyCharacter() {
  try {
    const mongoUri = process.env.MONGODB_URI!.replace('vrfans_test', 'test');
    await mongoose.connect(mongoUri);
    
    const character = await CharacterModel.findOne({ name: 'Tess Empress' });
    
    if (!character) {
      console.log(' Character not found');
      return;
    }
    
    console.log(' Character Details:');
    console.log('📛 Name:', character.name);
    console.log('� NSFW Status:', character.nsfw ? ' YES (NSFW)' : ' NO (SFW)');
    console.log('❤️  Likes:', character.likes);
    console.log(' Chats:', character.chatCount);
    console.log('🆔 Creator ID:', character.creatorId || 'System Generated');
    console.log(' Avatar:', character.avatar);
    
    // If there's a creatorId, look up the username
    if (character.creatorId) {
      const { UserModel } = await import('../db/models/UserModel.js');
      const creator = await UserModel.findById(character.creatorId);
      console.log('👤 Creator Username:', creator?.username || 'Unknown');
    } else {
      console.log('👤 Creator Username: System Generated');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error(' Error:', error);
  }
}

verifyCharacter();
