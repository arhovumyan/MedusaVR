#!/usr/bin/env tsx

/**
 * Test Character Creation Script
 * 
 * This script creates a test character using an existing image from the medusaVR_Photos folder
 * without relying on RunPod image generation.
 */

import { fileURLToPath } from 'url';
import { dirname } from 'path';
import mongoose from 'mongoose';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { CharacterModel } from '../db/models/CharacterModel.js';
import { UserModel } from '../db/models/UserModel.js';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CharacterData {
  name: string;
  description: string;
  quickSuggestion: string;
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
  imagePath: string;
}

async function connectToDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

async function setupTestUser() {
  try {
    // Find or create a test user
    let testUser = await UserModel.findOne({ email: 'test@medusa-vrfriendly.vercel.app' });
    
    if (!testUser) {
      testUser = new UserModel({
        email: 'test@medusa-vrfriendly.vercel.app',
        username: 'testuser',
        displayName: 'Test User',
        isEmailVerified: true,
        subscriptionTier: 'free',
        coins: 1000,
        createdAt: new Date(),
        lastActiveAt: new Date()
      });
      await testUser.save();
      console.log('✅ Created test user');
    } else {
      console.log('✅ Found existing test user');
    }
    
    return testUser;
  } catch (error) {
    console.error('❌ Failed to setup test user:', error);
    throw error;
  }
}

async function uploadImageToCloudinary(imagePath: string, publicId: string): Promise<string> {
  try {
    console.log(`🔄 Uploading ${imagePath} to Cloudinary...`);
    
    const result = await cloudinary.uploader.upload(imagePath, {
      public_id: publicId,
      folder: 'medusavr/test-characters',
      resource_type: 'image',
      transformation: [
        { width: 512, height: 768, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' }
      ]
    });
    
    console.log(`✅ Image uploaded successfully: ${result.secure_url}`);
    return result.secure_url;
  } catch (error) {
    console.error('❌ Error uploading to Cloudinary:', error);
    throw error;
  }
}

async function createTestCharacter(characterData: CharacterData, userId: string): Promise<any> {
  try {
    console.log(`🎯 Creating test character: ${characterData.name}`);
    
    // Check if character already exists
    const existingCharacter = await CharacterModel.findOne({ name: characterData.name });
    if (existingCharacter) {
      console.log(`⚠️ Character "${characterData.name}" already exists, skipping...`);
      return { success: false, error: 'Character already exists', skipped: true };
    }

    // Check if image exists
    if (!fs.existsSync(characterData.imagePath)) {
      throw new Error(`Image not found: ${characterData.imagePath}`);
    }
    
    console.log(`📁 Using image: ${characterData.imagePath}`);
    
    // Upload image to Cloudinary
    const publicId = `${characterData.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
    const cloudinaryUrl = await uploadImageToCloudinary(characterData.imagePath, publicId);
    
    // Create character data
    const character = new CharacterModel({
      id: Math.floor(Math.random() * 1000000), // Generate random ID
      avatar: cloudinaryUrl,
      name: characterData.name,
      description: characterData.description,
      quickSuggestion: characterData.quickSuggestion,
      rating: "4.5",
      nsfw: false,
      chatCount: 0,
      likes: 0,
      commentsCount: 0,
      creatorId: userId,
      personalityTraits: characterData.personalityTraits,
      artStyle: characterData.artStyle,
      selectedTags: characterData.selectedTags,
      imageMetadata: {
        cloudinaryPublicId: publicId,
        uploadedAt: new Date(),
        originalFilename: path.basename(characterData.imagePath),
        generationType: 'uploaded' as const,
        originalImageUrl: cloudinaryUrl,
        thumbnailUrl: cloudinaryUrl,
        altVersions: []
      },
      creationProcess: {
        stepCompleted: 5,
        totalSteps: 5,
        isDraft: false,
        lastSavedAt: new Date(),
        timeSpent: 300
      }
    });
    
    await character.save();
    
    console.log('✅ Character created successfully!');
    console.log('📊 Character Details:');
    console.log(`   ID: ${character.id}`);
    console.log(`   Name: ${character.name}`);
    console.log(`   Avatar: ${character.avatar}`);
    console.log(`   Creator: ${character.creatorId}`);
    
    return { success: true, character };
    
  } catch (error) {
    console.error(`❌ Failed to create character "${characterData.name}":`, error);
    return { success: false, error: String(error) };
  }
}

async function main() {
  console.log('🚀 Starting Test Character Creation');
  
  // Connect to database
  console.log('🔌 Connecting to database...');
  await connectToDatabase();
  
  // Setup test user
  console.log('👤 Setting up test user...');
  const testUser = await setupTestUser();
  
  // Get available images
  const photosDir = path.join(__dirname, '../../guidesAndPhotos/medusaVR_Photos');
  const availableImages = fs.readdirSync(photosDir)
    .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
    .slice(0, 5); // Take first 5 images
  
  console.log(`📂 Found ${availableImages.length} available images`);
  
  // Create test characters
  const testCharacters: CharacterData[] = [
    {
      name: "Test Character Luna",
      description: "A mysterious and elegant character with a calm demeanor. She enjoys reading books and stargazing on quiet nights.",
      quickSuggestion: "Would you like to join me for some stargazing tonight?",
      personalityTraits: {
        mainTrait: "calm",
        subTraits: ["mysterious", "intelligent", "peaceful"]
      },
      artStyle: {
        primaryStyle: "anime"
      },
      selectedTags: {
        'character-type': ["female"],
        'genre': ["fantasy", "anime"],
        'personality': ["calm", "mysterious", "intelligent"],
        'appearance': ["elegant", "long-hair"],
        'origin': ["original-character"],
        'sexuality': ["straight"],
        'fantasy': ["romance"],
        'content-rating': ["sfw"],
        'ethnicity': ["asian"],
        'scenario': ["modern", "romance"]
      },
      imagePath: path.join(photosDir, availableImages[0] || '33075020.jpeg')
    },
    {
      name: "Test Character Kai",
      description: "An adventurous and energetic character who loves exploring new places and meeting new people.",
      quickSuggestion: "Ready for an adventure? Let's explore something new together!",
      personalityTraits: {
        mainTrait: "adventurous",
        subTraits: ["energetic", "friendly", "curious"]
      },
      artStyle: {
        primaryStyle: "anime"
      },
      selectedTags: {
        'character-type': ["male"],
        'genre': ["adventure", "anime"],
        'personality': ["adventurous", "energetic", "friendly"],
        'appearance': ["athletic", "short-hair"],
        'origin': ["original-character"],
        'sexuality': ["straight"],
        'fantasy': ["adventure"],
        'content-rating': ["sfw"],
        'ethnicity': ["asian"],
        'scenario': ["modern", "adventure"]
      },
      imagePath: path.join(photosDir, availableImages[1] || '37994261.jpeg')
    }
  ];
  
  console.log(`\n🎬 Creating ${testCharacters.length} test character(s)...\n`);
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < testCharacters.length; i++) {
    const character = testCharacters[i];
    console.log(`\n--- Processing ${i + 1}/${testCharacters.length}: ${character.name} ---`);
    
    const result = await createTestCharacter(character, testUser._id.toString());
    
    if (result.success) {
      successCount++;
      console.log(`✅ Character "${character.name}" created successfully!`);
    } else if (result.skipped) {
      skipCount++;
      console.log(`⏭️ Character "${character.name}" skipped (already exists)`);
    } else {
      errorCount++;
      console.error(`❌ Failed to create "${character.name}": ${result.error}`);
    }
    
    // Add a small delay between characters
    if (i < testCharacters.length - 1) {
      console.log('⏳ Waiting 2 seconds before next character...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n🎉 Test Character Creation Complete!');
  console.log(`✅ Successfully created: ${successCount} characters`);
  console.log(`⏭️ Skipped (already exist): ${skipCount} characters`);
  console.log(`❌ Failed: ${errorCount} characters`);
  
  // Cleanup
  await mongoose.connection.close();
  console.log('🔌 Disconnected from MongoDB');
}

// Run the script
main().catch(console.error);