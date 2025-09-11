#!/usr/bin/env tsx

/**
 * Improved Batch Character Creation Script
 * 
 * This script reads characters from characters.txt and creates them using 
 * FastCharacterGenerationService directly (bypassing API timeouts).
 * Properly saves all character data including stats to the database.
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Get directory paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import required models and services
import { UserModel } from '../db/models/UserModel.js';
import { CharacterModel } from '../db/models/CharacterModel.js';
import { FastCharacterGenerationService } from '../services/FastCharacterGenerationService.js';
import { CharacterEmbeddingService } from '../services/CharacterEmbeddingService.js';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Configuration
let BATCH_USER_ID: string | null = null;
const BATCH_SIZE = 1; // Process 1 character at a time because embedding generation takes ~180 seconds
const DELAY_BETWEEN_CHARACTERS = 10000; // 10 seconds between characters to ensure queue clearance
const MAX_RETRIES = 3; // Maximum retries per character
const EMBEDDING_GENERATION_TIMEOUT = 200000; // 200 seconds timeout for embedding generation

interface CharacterData {
  name: string;
  tags: string[];
  personality: string;
  description: string;
  likes: number;
  chats: number;
  prompt: string;
}

interface FastGenerationOptions {
  characterName: string;
  description: string;
  positivePrompt?: string;
  negativePrompt?: string;
  personalityTraits: {
    mainTrait: string;
    subTraits: string[];
  };
  artStyle: {
    primaryStyle: string;
  };
  selectedTags: {
    [key: string]: string[];
  };
  userId: string;
  username: string;
  isNsfw?: boolean;
}

class ImprovedBatchCharacterCreation {
  private service: FastCharacterGenerationService;
  private charactersData: CharacterData[] = [];
  private results = {
    successful: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[]
  };

  constructor() {
    this.service = new FastCharacterGenerationService();
  }

  /**
   * Connect to MongoDB database
   */
  async connectToDatabase(): Promise<void> {
    try {
      await mongoose.connect(process.env.MONGODB_URI!, {
        dbName: "test",
      });
      console.log("✅ Connected to MongoDB");
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error);
      throw error;
    }
  }

  /**
   * Setup or find the batch user for character creation
   */
  async setupBatchUser(): Promise<void> {
    console.log('👤 Setting up batch user...');
    
    try {
      const username = "BatchCreator";
      let user = await UserModel.findOne({ username });
      
      if (!user) {
        console.log('🆕 Creating batch user...');
        user = await UserModel.create({
          username,
          email: 'batch@medusavr.com',
          password: 'batch123456',
          verified: true,
          coins: 50000, // Lots of coins for batch creation
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
        console.log('✅ Created batch user with ID:', user._id.toString());
      } else {
        console.log('✅ Found existing batch user with ID:', user._id.toString());
        
        // Ensure user has enough coins
        if (user.coins < 10000) {
          user.coins = 50000;
          await user.save();
          console.log('💰 Replenished user coins to 50000');
        }
      }
      
      BATCH_USER_ID = user._id.toString();
      
    } catch (error) {
      console.error('❌ Error setting up batch user:', error);
      throw error;
    }
  }

  /**
   * Parse characters from the text file
   */
  parseCharactersFromFile(filePath: string): void {
    console.log(`📂 Reading characters from: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Characters file not found: ${filePath}`);
    }

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
    
    this.charactersData = characters;
    console.log(`📋 Parsed ${characters.length} characters from file`);
  }

  /**
   * Convert character data to FastGenerationOptions
   */
  convertToGenerationOptions(character: CharacterData): FastGenerationOptions {
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

    // Organize tags into categories (same as batchCharacterCreation.ts)
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

    // Process tags and map them to the correct categories (same logic as batchCharacterCreation.ts)
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
      positivePrompt: character.prompt,
      negativePrompt: 'low quality, blurry, distorted, deformed, ugly, bad anatomy',
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
      isNsfw: character.tags.includes('nsfw') || character.tags.includes('mature')
    };
  }

  /**
   * Check if character already exists in database
   */
  async checkIfCharacterExists(name: string): Promise<boolean> {
    try {
      const existing = await CharacterModel.findOne({ name });
      return !!existing;
    } catch (error) {
      console.error(`Error checking character existence for ${name}:`, error);
      return false;
    }
  }

  /**
   * Create a single character with retries
   */
  async createSingleCharacter(character: CharacterData, retryCount = 0): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`\n🎭 Creating character: ${character.name} (Attempt ${retryCount + 1})`);
      
      // Check if character already exists
      const exists = await this.checkIfCharacterExists(character.name);
      if (exists) {
        console.log(`⚠️ Character "${character.name}" already exists, skipping...`);
        this.results.skipped++;
        return { success: true }; // Not an error, just skipped
      }

      // Convert to generation options
      const generationOptions = this.convertToGenerationOptions(character);
      console.log(`🚀 Generating with FastCharacterGenerationService...`);
      console.log(`   Art Style: ${generationOptions.artStyle.primaryStyle}`);
      console.log(`   Personality: ${generationOptions.personalityTraits.mainTrait}`);
      console.log(`   NSFW: ${generationOptions.isNsfw}`);

      // Generate character using FastCharacterGenerationService
      const result = await this.service.generateCharacterFast(generationOptions);

      if (!result.success) {
        throw new Error(result.error || 'Character generation failed');
      }

      console.log(`✅ Character generated successfully! ID: ${result.character?.id}`);
      console.log(`🖼️ Avatar: ${result.imageUrl}`);
      console.log(`⏱️ Generation time: ${result.generationTime}s`);

      // Generate embedding images (10 images for character training)
      console.log(`\n🎨 Starting embedding image generation for ${character.name}...`);
      console.log(`⏳ This will take approximately 3 minutes (10 images @ ~18s each)...`);
      
      try {
        const embeddingService = new CharacterEmbeddingService();
        
        const embeddingOptions = {
          characterId: result.character.id.toString(),
          characterName: character.name,
          description: character.description,
          personalityTraits: generationOptions.personalityTraits,
          artStyle: generationOptions.artStyle,
          selectedTags: generationOptions.selectedTags,
          userId: BATCH_USER_ID!,
          username: "BatchCreator",
          characterSeed: result.characterSeed || Math.floor(Math.random() * 4294967295),
          basePrompt: generationOptions.positivePrompt || character.prompt || character.description,
          baseNegativePrompt: generationOptions.negativePrompt || 'low quality, blurry, distorted, deformed, ugly, bad anatomy'
        };

        const embeddingResult = await embeddingService.generateEmbeddingImages(embeddingOptions);

        if (embeddingResult.success) {
          console.log(`✅ Embedding generation completed! Generated ${embeddingResult.imagesGenerated} images`);
          console.log(`☁️ Uploaded ${embeddingResult.bunnyUrls?.length || 0} images to Bunny CDN`);
          
          // Update character with embedding completion status
          await CharacterModel.updateOne(
            { id: result.character.id },
            {
              $set: {
                'embeddings.imageEmbeddings.status': 'completed',
                'embeddings.imageEmbeddings.totalImages': embeddingResult.imagesGenerated,
                'embeddings.imageEmbeddings.generationCompletedAt': new Date(),
                'embeddings.imageEmbeddings.bunnyUrls': embeddingResult.bunnyUrls || []
              }
            }
          );
          
          console.log(`✅ Character embedding metadata updated in database`);
        } else {
          console.error(`❌ Embedding generation failed: ${embeddingResult.error}`);
          // Don't fail the whole character creation, just log the error
        }
        
      } catch (embeddingError) {
        console.error(`❌ Embedding generation error for ${character.name}:`, embeddingError);
        // Don't fail the whole character creation, just log the error
      }

      // Update character stats in database
      if (result.character?.id) {
        await this.updateCharacterStats(result.character.id, character.likes, character.chats);
      }

      this.results.successful++;
      return { success: true };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to create character "${character.name}":`, errorMessage);

      // Retry logic
      if (retryCount < MAX_RETRIES) {
        console.log(`🔄 Retrying character "${character.name}" (${retryCount + 1}/${MAX_RETRIES})...`);
        await this.sleep(2000); // Wait 2 seconds before retry
        return this.createSingleCharacter(character, retryCount + 1);
      }

      this.results.failed++;
      this.results.errors.push(`${character.name}: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Update character statistics in database
   */
  async updateCharacterStats(characterId: number, likes: number, chats: number): Promise<void> {
    try {
      console.log(`📊 Updating character ${characterId} stats: ${likes} likes, ${chats} chats`);
      
      const result = await CharacterModel.updateOne(
        { id: characterId },
        { 
          $set: {
            likes: likes,
            chatCount: chats
          }
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Successfully updated character ${characterId} stats`);
      } else {
        console.log(`⚠️ No character found with ID ${characterId} to update stats`);
      }
    } catch (error) {
      console.error(`❌ Error updating character ${characterId} stats:`, error);
    }
  }

  /**
   * Sleep helper function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Process characters sequentially (not in parallel) due to embedding generation time
   */
  async processCharactersSequentially(characters: CharacterData[]): Promise<void> {
    console.log(`\n🔄 Processing ${characters.length} characters sequentially...`);
    console.log(`⚠️ Each character takes ~4-5 minutes (avatar + embeddings), total estimated time: ${Math.round(characters.length * 5)} minutes`);

    for (let i = 0; i < characters.length; i++) {
      const character = characters[i];
      console.log(`\n📦 === CHARACTER ${i + 1}/${characters.length}: ${character.name} ===`);
      
      await this.createSingleCharacter(character);
      
      // Add delay between characters to ensure RunPod queue is clear
      if (i < characters.length - 1) {
        console.log(`⏳ Waiting ${DELAY_BETWEEN_CHARACTERS / 1000}s before next character to ensure queue clearance...`);
        await this.sleep(DELAY_BETWEEN_CHARACTERS);
      }
    }
  }

  /**
   * Main execution function
   */
  async run(): Promise<void> {
    const startTime = Date.now();
    console.log('🚀 Starting Improved Batch Character Creation\n');

    try {
      // Setup
      await this.connectToDatabase();
      await this.setupBatchUser();

      // Parse characters file
      const customFile = process.argv.find(arg => arg.startsWith('--file='));
      const fileName = customFile ? customFile.split('=')[1] : 'characters.txt';
      const charactersFilePath = path.join(__dirname, fileName);
      this.parseCharactersFromFile(charactersFilePath);

      // Check for test mode
      const testMode = process.argv.includes('--test') || process.argv.includes('-t');
      const charactersToProcess = testMode ? this.charactersData.slice(0, 1) : this.charactersData;
      
      if (testMode) {
        console.log('🧪 Running in TEST MODE - processing only 1 character\n');
      }

      console.log(`🎬 Processing ${charactersToProcess.length} character(s)...\n`);

      // Process characters sequentially (due to embedding generation requirements)
      await this.processCharactersSequentially(charactersToProcess);

      // Final results
      const totalTime = Math.round((Date.now() - startTime) / 1000);
      console.log('\n🎉 Batch Character Creation Complete!');
      console.log(`⏱️  Total time: ${totalTime} seconds`);
      console.log(`✅ Successfully created: ${this.results.successful} characters`);
      console.log(`⚠️ Skipped (already exist): ${this.results.skipped} characters`);
      console.log(`❌ Failed: ${this.results.failed} characters`);

      if (this.results.errors.length > 0) {
        console.log('\n❌ Errors encountered:');
        this.results.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }

      if (testMode && this.results.successful > 0) {
        console.log('\n🧪 Test completed successfully! Run without --test flag to process all characters.');
        console.log('Command: npx tsx improvedBatchCharacterCreation.ts');
      }

    } catch (error) {
      console.error('💥 Fatal error:', error);
      throw error;
    } finally {
      // Cleanup
      await mongoose.connection.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const batchCreator = new ImprovedBatchCharacterCreation();
  batchCreator.run().catch(console.error);
}

export { ImprovedBatchCharacterCreation };
