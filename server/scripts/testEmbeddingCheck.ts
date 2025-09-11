#!/usr/bin/env tsx

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { EmbeddingBasedImageGenerationService } from '../services/EmbeddingBasedImageGenerationService.js';
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

async function testEmbeddingCheck(characterId: string) {
  try {
    const embeddingService = new EmbeddingBasedImageGenerationService();
    const result = await embeddingService.checkEmbeddingAvailability(characterId);
    
    console.log(`📊 Embedding availability check for character ${characterId}:`);
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function main() {
  const characterId = process.argv[2] || '340709'; // Default to Aria Tanaka
  
  console.log(`🔍 Testing embedding availability check for character ID: ${characterId}`);
  
  await connectToDatabase();
  await testEmbeddingCheck(characterId);
  await mongoose.connection.close();
  
  console.log('🔌 Disconnected from MongoDB');
}

main().catch(console.error);
