#!/usr/bin/env tsx

/**
 * Simple Embedding Generation Script
 * 
 * This script generates embeddings for a specific character by ID.
 * It runs synchronously and keeps database connection open until completion.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { CharacterModel } from '../db/models/CharacterModel.js';
import { CharacterEmbeddingService } from '../services/CharacterEmbeddingService.js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function connectToDatabase(): Promise<void> {
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

async function generateEmbeddingsForCharacter(characterId: string) {
  try {
    console.log(`🎨 Generating embeddings for character ID: ${characterId}`);
    
    // Find the character
    const character = await CharacterModel.findOne({ id: parseInt(characterId) });
    
    if (!character) {
      throw new Error(`Character with ID ${characterId} not found`);
    }

    console.log(`📋 Found character: ${character.name}`);
    
    // Check if embeddings already exist
    if (character.embeddings?.imageEmbeddings?.status === 'completed') {
      console.log(`⏭️ Character ${character.name} already has completed embeddings`);
      return;
    }

    const embeddingService = new CharacterEmbeddingService();
    
    // Generate embeddings synchronously
    const result = await embeddingService.generateEmbeddingImages({
      characterId: characterId,
      characterName: character.name,
      description: character.description,
      personalityTraits: {
        mainTrait: 'Bold', // Default value - this could be parsed from description
        subTraits: ['confident', 'charismatic']
      },
      artStyle: character.artStyle || 'anime',
      selectedTags: character.tags || [],
      userId: character.creatorId,
      username: character.creator?.username || 'BatchCreator',
      characterSeed: Math.floor(Math.random() * 4294967295),
      basePrompt: character.description,
      baseNegativePrompt: 'low quality, blurry, distorted'
    });

    if (result && result.success && result.imagesGenerated > 0) {
      console.log(`✅ Successfully generated ${result.imagesGenerated} embedding images for ${character.name}`);
      
      // Update character status in database
      await CharacterModel.updateOne(
        { id: parseInt(characterId) },
        {
          $set: {
            'embeddings.imageEmbeddings.status': 'completed',
            'embeddings.imageEmbeddings.totalImages': result.imagesGenerated,
            'embeddings.imageEmbeddings.generationCompleted': new Date(),
          }
        }
      );
      
      console.log(`✅ Updated database status for ${character.name}`);
    } else {
      console.log(`❌ Failed to generate embeddings for ${character.name}`);
    }

  } catch (error) {
    console.error(`❌ Error generating embeddings for character ${characterId}:`, error);
    throw error;
  }
}

async function main() {
  try {
    // Get character ID from command line arguments
    const characterId = process.argv[2];
    
    if (!characterId) {
      console.error("❌ Please provide a character ID");
      console.log("Usage: npm run generate-embeddings-simple -- <characterId>");
      process.exit(1);
    }

    console.log(`🚀 Starting embedding generation for character ${characterId}`);
    
    await connectToDatabase();
    await generateEmbeddingsForCharacter(characterId);
    
    console.log(`🎉 Embedding generation completed successfully!`);
    
  } catch (error) {
    console.error("❌ Script failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

main();

