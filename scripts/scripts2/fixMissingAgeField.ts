#!/usr/bin/env tsx

/**
 * Fix Missing Age Field Script
 * 
 * This script finds characters missing the age field and sets them to 25 (adult).
 */

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

async function fixMissingAgeField() {
  try {
    // Find characters without age field
    const charactersWithoutAge = await CharacterModel.find({ 
      $or: [
        { age: { $exists: false } },
        { age: null },
        { age: { $lt: 18 } }
      ]
    });
    
    console.log(` Found ${charactersWithoutAge.length} characters without valid age field`);
    
    if (charactersWithoutAge.length === 0) {
      console.log(' All characters already have valid age fields!');
      return;
    }
    
    console.log(' Characters without age:');
    charactersWithoutAge.forEach(char => {
      console.log(`  - ${char.name} (ID: ${char.id}) - age: ${char.age}`);
    });
    
    // Update all characters without age to have age 25
    const updateResult = await CharacterModel.updateMany(
      { 
        $or: [
          { age: { $exists: false } },
          { age: null },
          { age: { $lt: 18 } }
        ]
      },
      { $set: { age: 25 } }
    );
    
    console.log(` Updated ${updateResult.modifiedCount} characters with age 25`);
    
  } catch (error) {
    console.error(' Error:', error);
  }
}

async function main() {
  console.log(' Fixing Missing Age Fields');
  
  await connectToDatabase();
  await fixMissingAgeField();
  await mongoose.connection.close();
  
  console.log(' Disconnected from MongoDB');
}

main().catch(console.error);
