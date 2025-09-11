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
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  }
}

async function checkEmbeddingStatus(characterId: string) {
  try {
    const character = await CharacterModel.findOne({ id: parseInt(characterId) });
    
    if (!character) {
      console.log(`❌ Character ${characterId} not found`);
      return;
    }

    console.log(`📊 Character: ${character.name} (ID: ${character.id})`);
    console.log(`🔗 Avatar: ${character.avatar}`);
    
    if (character.embeddings) {
      console.log(`📄 Embeddings data:`);
      console.log(`  - URL: ${character.embeddings.url}`);
      console.log(`  - Model: ${character.embeddings.model}`);
      console.log(`  - Dimension: ${character.embeddings.dimension}`);
      
      if (character.embeddings.imageEmbeddings) {
        const imgEmbeddings = character.embeddings.imageEmbeddings;
        console.log(`🖼️ Image Embeddings:`);
        console.log(`  - Status: ${imgEmbeddings.status}`);
        console.log(`  - Total Images: ${imgEmbeddings.totalImages}`);
        console.log(`  - Created At: ${imgEmbeddings.createdAt}`);
        console.log(`  - Generation Started: ${imgEmbeddings.generationStartedAt}`);
        console.log(`  - Generation Completed: ${imgEmbeddings.generationCompletedAt}`);
        console.log(`  - Metadata URL: ${imgEmbeddings.metadataUrl}`);
        console.log(`  - Bunny URLs count: ${imgEmbeddings.bunnyUrls?.length || 0}`);
      } else {
        console.log(`❌ No image embeddings data found`);
      }
    } else {
      console.log(`❌ No embeddings data found`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function main() {
  const characterId = process.argv[2] || '340709'; // Default to Aria Tanaka
  
  console.log(`🔍 Checking embedding status for character ID: ${characterId}`);
  
  await connectToDatabase();
  await checkEmbeddingStatus(characterId);
  await mongoose.connection.close();
  
  console.log('🔌 Disconnected from MongoDB');
}

main().catch(console.error);
