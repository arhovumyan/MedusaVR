#!/usr/bin/env tsx

/**
 * Batch Character Creation Script - Bunny.net Version
 * 
 * This script reads characters from characters.txt and creates them using FastCharacterGenerationService
 * which saves directly to Bunny.net CDN instead of Cloudinary.
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import jwt, { SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { UserModel } from '../db/models/UserModel.js';
import { CharacterModel } from '../db/models/CharacterModel.js';
import { FastCharacterGenerationService, FastGenerationOptions } from '../services/FastCharacterGenerationService.js';
import { CharacterEmbeddingService } from '../services/CharacterEmbeddingService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production";

let BATCH_USER_ID: string | null = null;

interface CharacterData {
  name: string;
  tags: string[];
  personality: string;
  description: string;
  likes: number;
  chats: number;
  prompt: string;
}

function generateAuthToken(): string {
  if (!BATCH_USER_ID) {
    throw new Error('User ID not set. Call setupBatchUser first.');
  }
  
  const payload = {
    userId: BATCH_USER_ID,
    uid: BATCH_USER_ID,
    _id: BATCH_USER_ID,
    username: "BatchCreator",
    email: "batch@medusavr-production.up.railway.app",
    type: "access"
  };

  const options: SignOptions = {
    expiresIn: '24h' // Long-lived token for batch processing
  };

  return jwt.sign(payload, JWT_SECRET, options);
}

async function connectToDatabase(): Promise<void> {
  try {
    await mongoose.connect(process.env.MONGODB_URI!, {
      dbName: "test",
    });
    console.log(" Connected to MongoDB");
  } catch (error) {
    console.error(" MongoDB connection failed:", error);
    throw error;
  }
}

async function setupBatchUser(): Promise<void> {
  console.log('👤 Setting up batch user...');
  
  try {
    const username = "BatchCreator";
    let user = await UserModel.findOne({ username });
    
    if (!user) {
      console.log('🆕 Creating batch user...');
      user = await UserModel.create({
        username,
        email: 'batch@medusavr-production.up.railway.app',
        password: 'batch123456',
        verified: true,
        coins: 10000,
        tier: 'icon',
        subscription: {
          status: 'active',
          plan: 'icon',
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          paymentId: 'batch_creator',
          autoRenew: true,
          billingPeriod: 'yearly'
        }
      });
      console.log(' Created batch user with ID:', user._id.toString());
    } else {
      console.log(' Found existing batch user with ID:', user._id.toString());
    }
    
    BATCH_USER_ID = user._id.toString();
    
  } catch (error) {
    console.error(' Error setting up batch user:', error);
    throw error;
  }
}

function parseCharactersFromFile(filePath: string): CharacterData[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  const characters: CharacterData[] = [];
  let currentCharacter: Partial<CharacterData> = {};
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('name - ')) {
      // Save previous character if exists
      if (currentCharacter.name) {
        characters.push(currentCharacter as CharacterData);
      }
      // Start new character
      currentCharacter = {
        name: trimmedLine.replace('name - ', '').trim()
      };
    } else if (trimmedLine.startsWith('tags - ')) {
      currentCharacter.tags = trimmedLine.replace('tags - ', '').split(', ').map(tag => tag.trim());
    } else if (trimmedLine.startsWith('personality - ')) {
      currentCharacter.personality = trimmedLine.replace('personality - ', '').trim();
    } else if (trimmedLine.startsWith('description - ')) {
      currentCharacter.description = trimmedLine.replace('description - ', '').trim();
    } else if (trimmedLine.startsWith('likes - ')) {
      currentCharacter.likes = parseInt(trimmedLine.replace('likes - ', '').trim());
    } else if (trimmedLine.startsWith('chats - ')) {
      currentCharacter.chats = parseInt(trimmedLine.replace('chats - ', '').trim());
    } else if (trimmedLine.startsWith('prompt - ')) {
      currentCharacter.prompt = trimmedLine.replace('prompt - ', '').trim();
    }
  }
  
  // Don't forget the last character
  if (currentCharacter.name) {
    characters.push(currentCharacter as CharacterData);
  }
  
  return characters;
}

function convertToFastGenerationOptions(character: CharacterData): FastGenerationOptions {
  // Parse personality from format like "playful (bubbly, cheerful, mischievous)"
  const personalityMatch = character.personality.match(/(\w+)\s*\(([^)]+)\)/);
  const mainTrait = personalityMatch ? personalityMatch[1] : 'mysterious';
  const subTraits = personalityMatch 
    ? personalityMatch[2].split(',').map(trait => trait.trim()) 
    : ['unique', 'interesting'];

  // Determine art style from tags
  let artStyle = 'anime'; // default
  if (character.tags.includes('realistic')) artStyle = 'realistic';
  else if (character.tags.includes('cartoon')) artStyle = 'cartoon';
  else if (character.tags.includes('fantasy')) artStyle = 'fantasy';
  else if (character.tags.includes('sci-fi')) artStyle = 'cyberpunk';

  // Organize tags into categories based on server/data/tags.json structure
  const selectedTags: { [key: string]: string[] } = {
    'character-type': [],
    'genre': [],
    'personality': [],
    'physical-traits': [],
    'appearance': [],
    'origin': [],
    'sexuality': [],
    'fantasy': [],
    'content-rating': [],
    'relationship': [],
    'ethnicity': [],
    'scenario': []
  };

  // Process tags and map them to the correct categories
  for (const tag of character.tags) {
    // Character Type
    if (['female', 'male', 'non-human', 'non-binary', 'myth', 'object', 'queer'].includes(tag)) {
      selectedTags['character-type'].push(tag);
    }
    // Genre
    else if (['scenario', 'fictional', 'multiple', 'rpg', 'anime', 'magical', 'hentai', 'royalty', 'assistant', 'religion', 'historical', 'action', 'romantic', 'wholesome', 'sci-fi', 'horror', 'detective', 'philosophy', 'politics', 'manga', 'fandom'].includes(tag)) {
      selectedTags['genre'].push(tag);
    }
    // Personality
    else if (['dominant', 'submissive', 'milf', 'bully', 'switch', 'femboy', 'tomboy', 'villain', 'hero', 'tsundere', 'yandere', 'kuudere', 'deredere', 'dandere', 'sissy', 'dilf', 'shy', 'confident', 'flirty', 'mysterious', 'caring', 'rebellious', 'playful'].includes(tag)) {
      selectedTags['personality'].push(tag);
    }
    // Physical Traits
    else if (['futa', 'petite', 'bbw', 'monster', 'furry', 'elf', 'robot', 'giant', 'succubus', 'alien', 'maid', 'realistic', 'pregnant', 'shortstack', 'demi-human', 'goth', 'monster-girl'].includes(tag)) {
      selectedTags['physical-traits'].push(tag);
    }
    // Appearance
    else if (['blonde', 'brunette', 'redhead', 'black-hair', 'tall', 'curvy', 'athletic', 'blue-eyes', 'green-eyes'].includes(tag)) {
      selectedTags['appearance'].push(tag);
    }
    // Origin
    else if (['original-character', 'game', 'movie', 'vtuber', 'books', 'folklore'].includes(tag)) {
      selectedTags['origin'].push(tag);
    }
    // Sexuality
    else if (['straight', 'bisexual', 'gay', 'lesbian', 'asexual'].includes(tag)) {
      selectedTags['sexuality'].push(tag);
    }
    // Fantasy/Kink
    else if (['breeding', 'femdom', 'cheating', 'chastity', 'ntr', 'cnc', 'hypno', 'voyeur', 'bdsm', 'bondage', 'feet', 'worship'].includes(tag)) {
      selectedTags['fantasy'].push(tag);
    }
    // Content Rating
    else if (['sfw', 'nsfw', 'mature'].includes(tag)) {
      selectedTags['content-rating'].push(tag);
    }
    // Relationship
    else if (['girlfriend', 'boyfriend', 'friend', 'stranger', 'roommate', 'colleague'].includes(tag)) {
      selectedTags['relationship'].push(tag);
    }
    // Ethnicity
    else if (['arab', 'asian', 'black', 'white', 'latina'].includes(tag)) {
      selectedTags['ethnicity'].push(tag);
    }
    // Scenario
    else if (['fantasy', 'modern', 'school', 'office', 'adventure', 'slice-of-life', 'post-apocalyptic'].includes(tag)) {
      selectedTags['scenario'].push(tag);
    }
  }

  // Ensure at least one tag in each required category
  if (selectedTags['character-type'].length === 0) selectedTags['character-type'].push('female');
  if (selectedTags['content-rating'].length === 0) {
    selectedTags['content-rating'].push(character.tags.includes('nsfw') ? 'nsfw' : 'sfw');
  }

  return {
    characterName: character.name,
    description: character.description,
    positivePrompt: character.prompt || '',
    negativePrompt: 'low quality, blurry, distorted, deformed',
    personalityTraits: {
      mainTrait,
      subTraits
    },
    artStyle: {
      primaryStyle: artStyle
    },
    selectedTags,
    userId: BATCH_USER_ID!,
    username: "BatchCreator",
    isNsfw: character.tags.includes('nsfw')
  };
}

async function checkIfCharacterExists(name: string): Promise<boolean> {
  try {
    const existingCharacter = await CharacterModel.findOne({ name });
    return !!existingCharacter;
  } catch (error) {
    console.error('Error checking character existence:', error);
    return false;
  }
}

async function createCharacter(character: CharacterData): Promise<any> {
  console.log(` Creating character: ${character.name}`);
  
  try {
    // Check if character already exists
    const exists = await checkIfCharacterExists(character.name);
    if (exists) {
      console.log(` Character "${character.name}" already exists, skipping...`);
      return { success: false, error: 'Character already exists', skipped: true };
    }

    // Convert to FastGenerationOptions
    const generationOptions = convertToFastGenerationOptions(character);
    
    // Use FastCharacterGenerationService directly
    const fastGenerationService = new FastCharacterGenerationService();
    
    console.log(` Starting fast generation for ${character.name}...`);
    const result = await fastGenerationService.generateCharacterFast(generationOptions);
    
    if (result.success && result.character) {
      console.log(` Character ${character.name} created successfully!`);
      
      // Generate embedding images for the character
      console.log(` Starting embedding generation for ${character.name}...`);
      console.log(`⏳ Waiting 200 seconds for RunPod queue to clear before embedding generation...`);
      await new Promise(resolve => setTimeout(resolve, 200000)); // Wait 200 seconds
      
      try {
        const embeddingService = new CharacterEmbeddingService();
        
        // Generate embeddings synchronously
        const embeddingResult = await embeddingService.generateEmbeddingImages({
          characterId: result.character.id.toString(),
          characterName: character.name,
          description: character.description,
          personalityTraits: {
            mainTrait: 'Bold',
            subTraits: ['confident', 'charismatic']
          },
          artStyle: 'anime',
          selectedTags: character.tags || [],
          userId: BATCH_USER_ID!,
          username: "BatchCreator",
          characterSeed: Math.floor(Math.random() * 4294967295),
          basePrompt: character.prompt || character.description,
          baseNegativePrompt: 'low quality, blurry, distorted, deformed'
        });

        if (embeddingResult && embeddingResult.success && embeddingResult.imagesGenerated > 0) {
          console.log(` Successfully generated ${embeddingResult.imagesGenerated} embedding images for ${character.name}`);
          
          // Update character status in database
          await CharacterModel.updateOne(
            { id: result.character.id },
            {
              $set: {
                'embeddings.imageEmbeddings.status': 'completed',
                'embeddings.imageEmbeddings.totalImages': embeddingResult.imagesGenerated,
                'embeddings.imageEmbeddings.generationCompleted': new Date(),
              }
            }
          );
          
          console.log(` Updated database status for ${character.name} - ${embeddingResult.imagesGenerated} embeddings completed`);
          
          // Verify embeddings work
          console.log(` Verifying embeddings for ${character.name}...`);
          const verificationChar = await CharacterModel.findOne({ id: result.character.id });
          if (verificationChar?.embeddings?.imageEmbeddings?.status === 'completed') {
            console.log(` Embeddings verified for ${character.name}`);
          } else {
            console.log(` Embedding verification failed for ${character.name}`);
          }
          
        } else {
          console.log(` Failed to generate embeddings for ${character.name}`);
        }
        
      } catch (embeddingError) {
        console.error(` Embedding generation error for ${character.name}:`, embeddingError);
      }
      
      // Update stats (likes and chats) directly in database
      if (result.character.id) {
        await CharacterModel.updateOne(
          { id: result.character.id },
          { 
            $set: {
              likes: character.likes,
              chatCount: character.chats
            }
          }
        );
        console.log(` Updated character ${result.character.id} with ${character.likes} likes and ${character.chats} chats`);
      }
      
      return { success: true, character: result.character };
    } else {
      console.error(` Failed to create ${character.name}: ${result.error}`);
      return { success: false, error: result.error };
    }

  } catch (error) {
    console.error(` Error creating ${character.name}:`, error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

async function main() {
  console.log(' Starting Batch Character Creation with Bunny.net');
  
  // Connect to database and setup user
  console.log(' Connecting to database...');
  await connectToDatabase();
  
  console.log('👤 Setting up batch user...');
  await setupBatchUser();
  
  console.log('📂 Reading characters from characters.txt...');
  
  // Test mode: process only the first character initially
  const testMode = process.argv.includes('--test') || process.argv.includes('-t');
  
  const testFile = path.join(__dirname, 'test-characters.txt');
  const charactersFilePath = fs.existsSync(testFile) && testMode ? testFile : path.join(__dirname, 'characters.txt');
  
  if (!fs.existsSync(charactersFilePath)) {
    console.error(' characters.txt file not found!');
    process.exit(1);
  }

  const characters = parseCharactersFromFile(charactersFilePath);
  console.log(` Found ${characters.length} characters to process`);
  const charactersToProcess = testMode ? characters.slice(0, 1) : characters;
  
  if (testMode) {
    console.log(' Running in TEST MODE - processing only 1 character');
  }

  console.log(`\n Processing ${charactersToProcess.length} character(s)...\n`);

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (let i = 0; i < charactersToProcess.length; i++) {
    const character = charactersToProcess[i];
    
    console.log(`\n--- Processing ${i + 1}/${charactersToProcess.length}: ${character.name} ---`);

    // Create character using FastCharacterGenerationService
    const result = await createCharacter(character);
    
    if (result.success) {
      successCount++;
      console.log(` Character "${character.name}" created successfully!`);
    } else if (result.skipped) {
      skipCount++;
      console.log(`⏭️ Character "${character.name}" skipped (already exists)`);
    } else {
      errorCount++;
      console.error(` Failed to create "${character.name}": ${result.error}`);
    }

    // Add a small delay between characters to avoid overwhelming the system
    if (i < charactersToProcess.length - 1) {
      console.log('⏳ Waiting 2 seconds before next character...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('\n Batch Character Creation Complete!');
  console.log(` Successfully created: ${successCount} characters`);
  console.log(`⏭️ Skipped (already exist): ${skipCount} characters`);
  console.log(` Failed: ${errorCount} characters`);
  
  if (testMode) {
    console.log('\n Test completed! If everything looks good, run without --test flag to process all characters.');
    console.log('Command: npm run batch-create-characters');
  }

  // Cleanup
  await mongoose.connection.close();
  console.log(' Disconnected from MongoDB');
}

// Check if this script is being run directly in ES module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main as batchCreateCharacters };
