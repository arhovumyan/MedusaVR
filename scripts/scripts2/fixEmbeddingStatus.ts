#!/usr/bin/env tsx

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { CharacterModel } from '../db/models/CharacterModel.js';
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

async function fixEmbeddingStatus(characterId: string) {
  try {
    const character = await CharacterModel.findOne({ id: parseInt(characterId) });
    
    if (!character) {
      console.log(` Character ${characterId} not found`);
      return;
    }

    console.log(` Fixing embedding status for: ${character.name} (ID: ${character.id})`);
    
    // Generate the bunny URLs based on the pattern we know from the logs
    const characterName = character.name;
    const bunnyUrls = [];
    for (let i = 1; i <= 10; i++) {
      bunnyUrls.push(`https://medusavr.b-cdn.net/BatchCreator/characters/${characterName}/embeddings/${characterName}_image_${i}.png`);
    }

    // Update the character with the correct embedding data
    const updateResult = await CharacterModel.updateOne(
      { id: parseInt(characterId) },
      {
        $set: {
          'embeddings.imageEmbeddings': {
            status: 'completed',
            totalImages: 10,
            bunnyUrls: bunnyUrls,
            version: '1.0',
            createdAt: new Date(),
            generationStartedAt: character.embeddings?.imageEmbeddings?.generationStartedAt || new Date(),
            generationCompletedAt: new Date(),
            metadataUrl: `https://medusavr.b-cdn.net/BatchCreator/characters/${characterName}/embeddings/embedding-metadata-1755388502210.json`
          }
        }
      }
    );

    if (updateResult.modifiedCount > 0) {
      console.log(` Successfully updated embedding status for ${character.name}`);
      console.log(` Updated with ${bunnyUrls.length} embedding images`);
    } else {
      console.log(` No changes made to ${character.name}`);
    }

  } catch (error) {
    console.error(' Error:', error);
  }
}

async function main() {
  const characterId = process.argv[2] || '340709'; // Default to Aria Tanaka
  
  console.log(` Fixing embedding status for character ID: ${characterId}`);
  
  await connectToDatabase();
  await fixEmbeddingStatus(characterId);
  await mongoose.connection.close();
  
  console.log(' Disconnected from MongoDB');
}

main().catch(console.error);
