#!/usr/bin/env tsx

/**
 * Character Batch Generation Script
 * 
 * This script reads character data from characters.txt and creates characters
 * using FastCharacterGenerationService with RunPod image generation, preserving
 * exact likes and chats counts from the file.
 */

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { CharacterModel } from '../db/models/CharacterModel.js';
import { UserModel } from '../db/models/UserModel.js';
import { FastCharacterGenerationService } from '../services/FastCharacterGenerationService.js';
import type { FastGenerationOptions } from '../services/FastCharacterGenerationService.js';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CharacterData {
  name: string;
  tags: string[];
  personality: string;
  description: string;
  likes: number;
  chats: number;
  prompt: string;
}

class CharacterBatchGenerator {
  private delay: number; // 2 minutes in milliseconds
  private startId: number;
  private service: FastCharacterGenerationService;
  private userId: string | null;
  private username: string;

  constructor() {
    this.delay = 0; // Remove delay - process as fast as possible
    this.startId = 10000; // Start with high ID to avoid conflicts
    this.service = new FastCharacterGenerationService();
    this.userId = null;
    this.username = "MastermindArtist"; // Use the same user from our test
  }

  /**
   * Connect to test database
   */
  async connectToDatabase(): Promise<void> {
    try {
      // Use test database specifically  
      const mongoUri = process.env.MONGODB_URI!.replace('vrfans_test', 'test');
      await mongoose.connect(mongoUri);
      console.log(' Connected to MongoDB test database:', mongoose.connection.name);
    } catch (error) {
      console.error(' MongoDB connection error:', error);
      throw error;
    }
  }

  /**
   * Get or create the MastermindArtist user
   */
  async setupTestUser(): Promise<void> {
    console.log('👤 Setting up MastermindArtist user...');
    
    try {
      let user = await UserModel.findOne({ username: this.username });
      
      if (!user) {
        console.log('🆕 Creating MastermindArtist user...');
        user = await UserModel.create({
          username: this.username,
          email: 'mastermind@artist.test',
          password: 'test123456',
          verified: true,
          coins: 2000,
          tier: 'icon',
          subscription: {
            status: 'active',
            plan: 'icon',
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            paymentId: 'test_payment_icon',
            autoRenew: true,
            billingPeriod: 'yearly'
          }
        });
      }
      
      this.userId = user._id.toString();
      console.log(` Using user: ${user.username} (ID: ${this.userId})`);
      
    } catch (error) {
      console.error(' Error setting up user:', error);
      throw error;
    }
  }

  /**
   * Parse the characters.txt file and extract character data
   */
  parseCharactersFile(): CharacterData[] {
    const filePath = path.join(__dirname, '../../characters.txt');
    
    if (!fs.existsSync(filePath)) {
      throw new Error(`Characters file not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim() !== '');
    
    const characters: CharacterData[] = [];
    let currentCharacter: Partial<CharacterData> = {};

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('name - ')) {
        // If we have a current character, save it
        if (currentCharacter.name) {
          characters.push(currentCharacter as CharacterData);
        }
        // Start new character
        currentCharacter = {
          name: trimmedLine.replace('name - ', '').trim()
        };
      } else if (trimmedLine.startsWith('tags - ')) {
        currentCharacter.tags = trimmedLine.replace('tags - ', '').split(',').map(tag => tag.trim());
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

  /**
   * Convert parsed character data to FastGenerationOptions format
   */
  convertToGenerationOptions(character: CharacterData): FastGenerationOptions {
    // Extract main personality trait
    const personalityMatch = character.personality.match(/(\w+)\s*\(([^)]+)\)/);
    const mainTrait = personalityMatch ? personalityMatch[1] : 'mysterious';
    const subTraits = personalityMatch ? personalityMatch[2].split(',').map(t => t.trim()) : [];

    // Parse tags into categories
    const selectedTags: any = {
      'character-type': [],
      'genre': [],
      'personality': [],
      'appearance': [],
      'origin': [],
      'sexuality': [],
      'content-rating': [],
      'relationship': [],
      'ethnicity': [],
      'setting': []
    };

    // Categorize tags
    for (const tag of character.tags) {
      const lowerTag = tag.toLowerCase();
      
      // Character type
      if (['female', 'male', 'non-binary'].includes(lowerTag)) {
        selectedTags['character-type']?.push(lowerTag);
      }
      // Genre
      else if (['fictional', 'sci-fi', 'anime', 'multiple', 'magical', 'horror', 'romantic'].includes(lowerTag)) {
        selectedTags['genre']?.push(lowerTag);
      }
      // Personality
      else if (['flirty', 'caring', 'playful', 'confident'].includes(lowerTag)) {
        selectedTags['personality']?.push(lowerTag);
      }
      // Appearance
      else if (['curvy', 'athletic', 'petite', 'realistic', 'goth', 'blonde', 'black-hair', 'redhead', 'brunette'].includes(lowerTag)) {
        selectedTags['appearance']?.push(lowerTag);
      }
      // Origin
      else if (['original-character', 'books', 'robot'].includes(lowerTag)) {
        selectedTags['origin']?.push(lowerTag);
      }
      // Sexuality
      else if (['straight', 'bisexual', 'lesbian'].includes(lowerTag)) {
        selectedTags['sexuality']?.push(lowerTag);
      }
      // Content rating
      else if (['nsfw', 'sfw'].includes(lowerTag)) {
        selectedTags['content-rating']?.push(lowerTag);
      }
      // Relationship
      else if (['stranger', 'roommate', 'friend'].includes(lowerTag)) {
        selectedTags['relationship']?.push(lowerTag);
      }
      // Ethnicity
      else if (['white', 'black', 'asian'].includes(lowerTag)) {
        selectedTags['ethnicity']?.push(lowerTag);
      }
      // Setting
      else if (['slice-of-life', 'school', 'adventure', 'fantasy', 'modern'].includes(lowerTag)) {
        selectedTags['setting']?.push(lowerTag);
      }
    }

    // Determine art style based on tags
    let artStyle = 'fantasy'; // default
    if (character.tags.some(tag => tag.toLowerCase().includes('anime'))) {
      artStyle = 'anime';
    } else if (character.tags.some(tag => tag.toLowerCase().includes('realistic'))) {
      artStyle = 'realistic';
    } else if (character.tags.some(tag => tag.toLowerCase().includes('sci-fi'))) {
      artStyle = 'sci-fi';
    }

    // Check if NSFW - Force all characters to be NSFW
    const isNsfw = true; // All characters should be NSFW

    return {
      characterName: character.name,
      description: character.description,
      personalityTraits: {
        mainTrait: mainTrait,
        subTraits: subTraits
      },
      artStyle: { 
        primaryStyle: artStyle 
      },
      selectedTags: selectedTags,
      userId: this.userId!,
      username: this.username,
      isNsfw: isNsfw,
      // We'll use the character's original prompt
      positivePrompt: character.prompt
    };
  }

  /**
   * Create a character using FastCharacterGenerationService and update likes/chats
   */
  async createCharacterWithStats(character: CharacterData): Promise<any> {
    console.log(` Creating character: ${character.name}`);
    console.log(` Original stats: ${character.likes} likes, ${character.chats} chats`);
    
    try {
      // Check if character already exists
      const existingCharacter = await CharacterModel.findOne({ name: character.name });
      if (existingCharacter) {
        console.log(`  Character "${character.name}" already exists, skipping...`);
        return { skipped: true, character: existingCharacter };
      }

      // Convert to FastGenerationOptions
      const generationOptions = this.convertToGenerationOptions(character);
      
      console.log(` Generating character with RunPod...`);
      const startTime = Date.now();
      
      // Use FastCharacterGenerationService to create character with image
      const result = await this.service.generateCharacterFast(generationOptions);
      
      if (!result.success) {
        throw new Error(`Character generation failed: ${result.error}`);
      }
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(1);
      
      console.log(` Character created in ${duration}s with ID: ${result.character?.id}`);
      
      // Now update the character in database to set the exact likes and chats from file
      const updatedCharacter = await CharacterModel.findOneAndUpdate(
        { id: result.character?.id },
        {
          likes: character.likes,
          chatCount: character.chats,
          creatorId: null,  // Make it system-generated
          creatorName: this.username,  // Set creator name to MastermindArtist
          nsfw: true,  // Ensure NSFW flag is set
          isNsfw: true  // Also set isNsfw field if it exists
        },
        { new: true }
      );
      
      if (updatedCharacter) {
        console.log(` Updated stats: ${updatedCharacter.likes} likes, ${updatedCharacter.chatCount} chats`);
        console.log(` Avatar: ${result.imageUrl}`);
        console.log(` Character Seed: ${result.characterSeed}`);
      }
      
      return { skipped: false, character: updatedCharacter };
    } catch (error) {
      console.error(` Failed to create character "${character.name}":`, error);
      throw error;
    }
  }

  /**
   * Test with a single character first
   */
  async testSingleCharacter(): Promise<void> {
    console.log(' Testing character creation with first character from file...\n');
    
    await this.connectToDatabase();
    await this.setupTestUser();
    
    const characters = this.parseCharactersFile();
    
    if (characters.length === 0) {
      throw new Error('No characters found in characters.txt');
    }

    console.log(`📚 Found ${characters.length} characters in file`);
    console.log(` Testing with third character: "${characters[2].name}"\n`);

    await this.createCharacterWithStats(characters[2]);
    
    // Wait a moment for background processes to complete
    console.log('⏳ Waiting for background processes to complete...');
    await this.sleep(5000); // 5 seconds
    
    await mongoose.connection.close();
    console.log('\n Test completed successfully!');
    console.log(' If this worked correctly, you can run the full batch generation.');
  }

  /**
   * Generate all characters with optimized processing
   */
  async generateAllCharacters(): Promise<void> {
    console.log(' Starting batch character generation...\n');
    
    await this.connectToDatabase();
    await this.setupTestUser();
    
    const characters = this.parseCharactersFile();
    console.log(`📚 Found ${characters.length} characters to generate`);
    console.log(' Fast processing mode: No delays, skip existing characters\n');

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < characters.length; i++) {
      const character = characters[i];
      console.log(`\n[${i + 1}/${characters.length}] Processing: ${character.name}`);
      
      try {
        const result = await this.createCharacterWithStats(character);
        
        if (result.skipped) {
          skippedCount++;
          console.log('⏩ Moving to next character immediately (already exists)');
        } else {
          successCount++;
          console.log(' Moving to next character immediately (generation complete)');
        }
        
      } catch (error) {
        console.error(` Error creating character "${character.name}":`, error);
        errorCount++;
        console.log('⏭️  Continuing with next character...');
      }
    }

    // Wait a moment for any background processes to complete
    console.log('\n⏳ Waiting for background processes to complete...');
    await this.sleep(10000); // 10 seconds

    await mongoose.connection.close();
    
    console.log('\n Batch generation completed!');
    console.log(` Successfully created: ${successCount} characters`);
    console.log(`⏩ Skipped (already exist): ${skippedCount} characters`);
    console.log(` Failed to create: ${errorCount} characters`);
  }

  /**
   * Sleep utility
   */
  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const generator = new CharacterBatchGenerator();
  
  // Check command line arguments
  const args = process.argv.slice(2);
  const isTestMode = args.includes('--test') || args.includes('-t');
  const isFullGeneration = args.includes('--all') || args.includes('-a');

  try {
    if (isTestMode) {
      await generator.testSingleCharacter();
    } else if (isFullGeneration) {
      console.log('  WARNING: This will create ALL characters from the file!');
      console.log('  Make sure you have tested with --test first!');
      console.log('  Press Ctrl+C within 10 seconds to cancel...\n');
      
      await generator.sleep(10000); // 10 second delay
      await generator.generateAllCharacters();
    } else {
      console.log('🤖 Character Batch Generator');
      console.log('\nUsage:');
      console.log('  npm run generate-characters -- --test    # Test with first character');
      console.log('  npm run generate-characters -- --all     # Generate all characters');
      console.log('\nOptions:');
      console.log('  --test, -t    Test with the first character only');
      console.log('  --all, -a     Generate all characters (optimized: no delays, skip existing)');
      console.log('\nOptimizations:');
      console.log('  • No delays between characters for faster processing');
      console.log('  • Automatically skips characters that already exist');
      console.log('  • Processes immediately after generation completes');
      console.log('\nNote: This script creates characters directly in the database');
      console.log('      as system-generated characters (no authentication required)');
    }
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

// Only run main if this file is being executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { CharacterBatchGenerator };
