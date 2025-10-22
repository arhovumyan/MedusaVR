#!/usr/bin/env tsx

/**
 * Generate Embeddings for Batch Characters Script
 * 
 * This script generates embeddings for characters created via batch creation
 * that didn't have embeddings generated during the initial creation process.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { CharacterModel } from '../db/models/CharacterModel.js';
import { UserModel } from '../db/models/UserModel.js';
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
    console.log(" Connected to MongoDB");
  } catch (error) {
    console.error(" MongoDB connection failed:", error);
    throw error;
  }
}

async function generateEmbeddingsForCharacter(character: any) {
  try {
    console.log(` Generating embeddings for: ${character.name} (ID: ${character.id})`);
    
    const embeddingService = new CharacterEmbeddingService();
    
    // Check if embeddings are already completed
    const currentStatus = character.embeddings?.imageEmbeddings?.status;
    if (currentStatus === 'completed') {
      console.log(`⏭️ Character ${character.name} already has completed embeddings, skipping...`);
      return { success: true, skipped: true };
    }
    
    // Get the batch user data
    const batchUser = await UserModel.findById(character.creatorId);
    if (!batchUser) {
      console.log(` Batch user not found for character ${character.name}`);
      return { success: false, error: 'Batch user not found' };
    }
    
    const result = await embeddingService.generateEmbeddingImagesBackground({
      characterId: character.id.toString(),
      characterName: character.name,
      description: character.description,
      personalityTraits: character.personalityTraits || { mainTrait: 'mysterious', subTraits: ['unique'] },
      artStyle: character.artStyle || { primaryStyle: 'anime' },
      selectedTags: character.selectedTags || {},
      userId: character.creatorId.toString(),
      username: batchUser.username,
      characterSeed: character.imageGeneration?.characterSeed || 12345,
      basePrompt: character.imageGeneration?.prompt || `${character.name}, ${character.description}`,
      baseNegativePrompt: character.imageGeneration?.negativePrompt || 'low quality, blurry'
    });
    
    if (result && result.success) {
      console.log(` Successfully generated ${result.imagesGenerated} embedding images for ${character.name}`);
      return { success: true, imagesGenerated: result.imagesGenerated };
    } else {
      console.log(` Failed to generate embeddings for ${character.name}: ${result?.error || 'Unknown error'}`);
      return { success: false, error: result?.error || 'Unknown error' };
    }
    
  } catch (error) {
    console.error(` Error generating embeddings for ${character.name}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function main() {
  console.log(' Starting Embedding Generation for Batch Characters');
  
  await connectToDatabase();
  
  // Find BatchCreator user
  const batchUser = await UserModel.findOne({ username: "BatchCreator" });
  if (!batchUser) {
    console.error(' BatchCreator user not found!');
    process.exit(1);
  }
  
  console.log(`👤 Found BatchCreator user: ${batchUser._id}`);
  
  // Find all characters created by BatchCreator
  const batchCharacters = await CharacterModel.find({ creatorId: batchUser._id });
  console.log(` Found ${batchCharacters.length} characters created by BatchCreator`);
  
  // Check which characters need embeddings
  const charactersNeedingEmbeddings = batchCharacters.filter(char => {
    const status = char.embeddings?.imageEmbeddings?.status;
    return status !== 'completed';
  });
  
  console.log(` ${charactersNeedingEmbeddings.length} characters need embedding generation`);
  
  if (charactersNeedingEmbeddings.length === 0) {
    console.log(' All characters already have completed embeddings!');
    await mongoose.connection.close();
    return;
  }
  
  // Test mode: process only the first character initially
  const testMode = process.argv.includes('--test') || process.argv.includes('-t');
  const charactersToProcess = testMode ? charactersNeedingEmbeddings.slice(0, 1) : charactersNeedingEmbeddings;
  
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
    
    const result = await generateEmbeddingsForCharacter(character);
    
    if (result.success) {
      if (result.skipped) {
        skipCount++;
        console.log(`⏭️ Character "${character.name}" skipped (already completed)`);
      } else {
        successCount++;
        console.log(` Character "${character.name}" embeddings generated successfully!`);
      }
    } else {
      errorCount++;
      console.error(` Failed to generate embeddings for "${character.name}": ${result.error}`);
    }
    
    // Add a delay between characters to avoid overwhelming the system
    if (i < charactersToProcess.length - 1) {
      console.log('⏳ Waiting 5 seconds before next character...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  console.log('\n Embedding Generation Complete!');
  console.log(` Successfully generated: ${successCount} characters`);
  console.log(`⏭️ Skipped (already completed): ${skipCount} characters`);
  console.log(` Failed: ${errorCount} characters`);
  
  if (testMode) {
    console.log('\n Test completed! If everything looks good, run without --test flag to process all characters.');
    console.log('Command: npx tsx server/scripts/generateEmbeddingsForBatchCharacters.ts');
  }
  
  // Keep connection open a bit longer for any remaining async operations
  console.log('⏳ Waiting for any remaining async operations...');
  await new Promise(resolve => setTimeout(resolve, 10000));
  
  await mongoose.connection.close();
  console.log(' Disconnected from MongoDB');
}

main().catch(console.error);
