#!/usr/bin/env node

/**
 * Test Character Creation Script
 * 
 * This script tests character creation using the proper flow:
 * 1. Creates "Mastermind Artist" user with icon subscription  
 * 2. Uses FastCharacterGenerationService with RunPod image generation
 * 3. Creates 2 test characters with 2-minute delays
 * 4. Uses "test" database not "vrfans_test"
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { UserModel } from '../db/models/UserModel.js';
import { FastCharacterGenerationService } from '../services/FastCharacterGenerationService.js';

class TestCharacterCreation {
  constructor() {
    this.service = new FastCharacterGenerationService();
    this.userId = null; // Will be set after creating user
    this.username = "MastermindArtist";
  }

  /**
   * Connect to test database
   */
  async connectToDatabase() {
    try {
      // Use test database specifically  
      const mongoUri = process.env.MONGODB_URI.replace('vrfans_test', 'test');
      await mongoose.connect(mongoUri);
      console.log(' Connected to MongoDB test database:', mongoose.connection.name);
    } catch (error) {
      console.error(' MongoDB connection error:', error);
      throw error;
    }
  }

  /**
   * Create or find "Mastermind Artist" user with icon subscription
   */
  async createTestUser() {
    console.log('👤 Creating/finding test user "Mastermind Artist"...');
    
    try {
      // Check if user already exists
      let user = await UserModel.findOne({ username: this.username });
      
      if (user) {
        console.log(' User already exists:', user._id);
        this.userId = user._id.toString();
        
        // Update to icon subscription if not already
        if (user.tier !== 'icon') {
          console.log('⬆️ Upgrading user to icon subscription...');
          user.tier = 'icon';
          user.coins = 3000; // Icon tier coin allowance
          user.subscription = {
            status: 'active',
            plan: 'icon',
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            paymentId: 'test_payment_icon',
            autoRenew: true,
            billingPeriod: 'yearly'
          };
          await user.save();
          console.log(' User upgraded to icon subscription');
        }
      } else {
        console.log('🆕 Creating new user...');
        user = await UserModel.create({
          username: this.username,
          email: 'mastermind@artist.test',
          password: 'test123456',
          verified: true,
          coins: 3000, // Icon tier allowance
          tier: 'icon',
          subscription: {
            status: 'active',
            plan: 'icon',
            startDate: new Date(),
            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
            paymentId: 'test_payment_icon',
            autoRenew: true,
            billingPeriod: 'yearly'
          }
        });
        
        this.userId = user._id.toString();
        console.log(' Created test user with ID:', this.userId);
      }
      
      console.log(' User details:');
      console.log(`  - Username: ${user.username}`);
      console.log(`  - Tier: ${user.tier}`);
      console.log(`  - Coins: ${user.coins}`);
      console.log(`  - Subscription: ${user.subscription.status} (${user.subscription.plan})`);
      
    } catch (error) {
      console.error(' Error creating test user:', error);
      throw error;
    }
  }

  /**
   * Get test character templates
   */
  getTestCharacters() {
    return [
      {
        characterName: "Luna Starweaver",
        description: "A mystical elven mage with silver hair and glowing blue eyes. She commands the power of stars and moonlight, weaving spells that can heal or harm. Known for her wisdom and mysterious past.",
        age: 127, // Age in elf years - well above 18
        personalityTraits: {
          mainTrait: "mysterious",
          subTraits: ["wise", "caring", "magical"]
        },
        artStyle: { primaryStyle: "fantasy" },
        selectedTags: {
          'character-type': ["female"],
          'genre': ["fantasy"],
          'personality': ["mysterious", "wise", "caring"],
          'appearance': ["long-hair", "blue-eyes", "silver-hair"],
          'origin': ["magical", "elven"],
          'content-rating': ["sfw"]
        },
        userId: this.userId,
        username: this.username,
        isNsfw: false
      },
      {
        characterName: "Zara Cybershade",
        description: "A high-tech hacker from Neo-Tokyo with cybernetic implants and neon-pink hair. She navigates the digital underworld with unmatched skill and a rebellious spirit.",
        age: 24, // Cybernetic enhanced adult
        personalityTraits: {
          mainTrait: "rebellious",
          subTraits: ["confident", "tech-savvy", "independent"]
        },
        artStyle: { primaryStyle: "anime" },
        selectedTags: {
          'character-type': ["female"],
          'genre': ["sci-fi", "cyberpunk"],
          'personality': ["rebellious", "confident"],
          'appearance': ["colorful-hair", "cybernetic-implants"],
          'origin': ["human"],
          'content-rating': ["sfw"]
        },
        userId: this.userId,
        username: this.username,
        isNsfw: false
      }
    ];
  }

  /**
   * Test character creation with image generation
   */
  async testCharacterCreation() {
    console.log(' Starting test character creation...\n');

    const characters = this.getTestCharacters();
    const results = [];
    
    for (let i = 0; i < characters.length; i++) {
      const character = characters[i];
      console.log(`\n[${i + 1}/${characters.length}] Testing: ${character.characterName}`);
      console.log(` Art Style: ${character.artStyle.primaryStyle}`);
      console.log(` Personality: ${character.personalityTraits.mainTrait}`);
      console.log(` Description: ${character.description.substring(0, 100)}...`);
      
      try {
        console.log(' Generating character with RunPod image generation...');
        const startTime = Date.now();
        
        const result = await this.service.generateCharacterFast(character);
        
        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(1);
        
        if (result.success) {
          console.log(` Character "${character.characterName}" created successfully! (${duration}s)`);
          console.log(`  - Character ID: ${result.character?.id}`);
          console.log(`  - Avatar URL: ${result.imageUrl}`);
          console.log(`  - Character Seed: ${result.characterSeed}`);
          console.log(`  - NSFW: ${result.character?.nsfw || false}`);
          console.log(`  - Art Style: ${result.character?.artStyle?.primaryStyle}`);
          
          results.push({
            name: character.characterName,
            success: true,
            id: result.character?.id,
            imageUrl: result.imageUrl,
            duration: duration
          });
        } else {
          console.log(` Character "${character.characterName}" creation failed`);
          console.log(`  - Error: ${result.error}`);
          
          results.push({
            name: character.characterName,
            success: false,
            error: result.error,
            duration: duration
          });
        }
        
        // Wait 2 minutes before next character (except for the last one)
        if (i < characters.length - 1) {
          console.log(`⏳ Waiting 2 minutes before next character...`);
          await this.sleep(2 * 60 * 1000); // 2 minutes
        }
        
      } catch (error) {
        console.error(` Error creating character "${character.characterName}":`, error);
        results.push({
          name: character.characterName,
          success: false,
          error: error.message,
          duration: ((Date.now() - startTime) / 1000).toFixed(1)
        });
      }
    }

    return results;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Main test execution
   */
  async run() {
    try {
      console.log('🤖 MedusaVR Test Character Creation\n');
      
      // Connect to test database
      await this.connectToDatabase();
      
      // Create test user
      await this.createTestUser();
      
      // Test character creation
      const results = await this.testCharacterCreation();
      
      // Summary
      console.log('\n Test completed! Summary:');
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      console.log(` Successful: ${successful.length}`);
      successful.forEach(r => {
        console.log(`  - ${r.name} (ID: ${r.id}, ${r.duration}s)`);
        console.log(`    Avatar: ${r.imageUrl}`);
      });
      
      if (failed.length > 0) {
        console.log(` Failed: ${failed.length}`);
        failed.forEach(r => {
          console.log(`  - ${r.name}: ${r.error}`);
        });
      }
      
      console.log(` Success rate: ${(successful.length / results.length * 100).toFixed(1)}%`);
      
    } catch (error) {
      console.error('💥 Test failed:', error);
      process.exit(1);
    } finally {
      await mongoose.connection.close();
      console.log('\n Database connection closed');
    }
  }
}

// Run the test
const test = new TestCharacterCreation();
test.run().catch(console.error);
