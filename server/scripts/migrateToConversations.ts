#!/usr/bin/env tsx

/**
 * Migration Script: Convert Old Chat System to Conversations
 * 
 * This script migrates data from the old chat system (where messages were 
 * stored as arrays within chat documents) to the new conversation-based 
 * system where conversations and messages are separate collections.
 * 
 * Run with: npx tsx server/scripts/migrateToConversations.ts
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import { ConversationService } from "../services/ConversationService.js";

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

async function runMigration() {
  try {
    console.log('🚀 Starting conversation migration...');
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI!, {
      dbName: "test",
    });
    console.log('✅ Connected to MongoDB');

    // Run the migration
    await ConversationService.migrateOldChats();

    console.log('🎉 Migration completed successfully!');
    
    // Show some stats
    const { ConversationModel } = await import("../db/models/ConversationModel");
    const { MessageModel } = await import("../db/models/MessageModel");
    
    const conversationCount = await ConversationModel.countDocuments();
    const messageCount = await MessageModel.countDocuments();
    
    console.log(`📊 Final stats:
- Conversations: ${conversationCount}
- Messages: ${messageCount}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration();
}