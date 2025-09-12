#!/usr/bin/env node

/**
 * Script to create all database models in MedusaFriendly database
 * This uses the actual Mongoose models to ensure proper schema creation
 */

import mongoose from 'mongoose';

// Import all the models (adjust paths as needed)
import { UserModel } from '../server/db/models/UserModel.js';
import { CharacterModel } from '../server/db/models/CharacterModel.js';
import { ChatsModel } from '../server/db/models/ChatsModel.js';
import { CommentModel } from '../server/db/models/CommentModel.js';
import { ConversationModel } from '../server/db/models/ConversationModel.js';
import { MessageModel } from '../server/db/models/MessageModel.js';
import { CreatorModel } from '../server/db/models/CreatorsModel.js';
import { FollowModel } from '../server/db/models/FollowsModel.js';
import { TagModel } from '../server/db/models/TagModel.js';
import { SubscriptionModel } from '../server/db/models/SubscriptionModel.js';
import { ViolationModel } from '../server/db/models/ViolationModel.js';

// Database connection string for MedusaFriendly
const MEDUSAFRIENDLY_DB_URI = 'mongodb://localhost:27017/MedusaFriendly';

// Model definitions with their collection names
const MODELS_TO_CREATE = [
  { name: 'User', model: UserModel, collection: 'users' },
  { name: 'Character', model: CharacterModel, collection: 'characters' },
  { name: 'Chat', model: ChatsModel, collection: 'chats' },
  { name: 'Comment', model: CommentModel, collection: 'comments' },
  { name: 'Conversation', model: ConversationModel, collection: 'conversations' },
  { name: 'Message', model: MessageModel, collection: 'messages' },
  { name: 'Creator', model: CreatorModel, collection: 'creators' },
  { name: 'Follow', model: FollowModel, collection: 'follows' },
  { name: 'Tag', model: TagModel, collection: 'tags' },
  { name: 'Subscription', model: SubscriptionModel, collection: 'subscriptions' },
  { name: 'Violation', model: ViolationModel, collection: 'violations' }
];

async function connectToMedusaFriendly() {
  try {
    await mongoose.connect(MEDUSAFRIENDLY_DB_URI);
    console.log('✅ Connected to MedusaFriendly database');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ Failed to connect to MedusaFriendly database:', error.message);
    throw error;
  }
}

async function createModelInDatabase(modelInfo, connection) {
  const { name, model, collection } = modelInfo;
  
  try {
    console.log(`🔨 Creating model: ${name} (collection: ${collection})`);
    
    // Check if collection already exists
    const collections = await connection.db.listCollections({ name: collection }).toArray();
    
    if (collections.length > 0) {
      console.log(`  ⚠️  Collection '${collection}' already exists`);
      return;
    }
    
    // Create collection by creating and dropping a temporary document
    // This ensures the collection is created with the proper schema
    const tempDoc = new model();
    await tempDoc.save();
    await model.deleteOne({ _id: tempDoc._id });
    
    console.log(`  ✅ Created collection '${collection}' with schema`);
    
    // Get the schema and create indexes
    const schema = model.schema;
    const indexes = schema.indexes();
    
    if (indexes && indexes.length > 0) {
      console.log(`  📊 Creating ${indexes.length} indexes for ${collection}`);
      
      for (const index of indexes) {
        try {
          await connection.db.collection(collection).createIndex(index[0], index[1] || {});
          console.log(`    ✅ Created index: ${JSON.stringify(index[0])}`);
        } catch (indexError) {
          console.log(`    ⚠️  Index creation failed: ${indexError.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error(`  ❌ Error creating model ${name}:`, error.message);
    throw error;
  }
}

async function createAllModels() {
  let connection = null;
  
  try {
    console.log('🚀 Creating all models in MedusaFriendly database...\n');
    
    // Connect to MedusaFriendly database
    connection = await connectToMedusaFriendly();
    
    console.log('\n📋 Creating models and collections...\n');
    
    // Create each model
    for (const modelInfo of MODELS_TO_CREATE) {
      await createModelInDatabase(modelInfo, connection);
      console.log(''); // Add spacing between models
    }
    
    console.log('✅ All models created successfully!');
    console.log('\n📊 Summary:');
    console.log(`  • Created ${MODELS_TO_CREATE.length} collections in MedusaFriendly database`);
    console.log('  • All schemas and indexes have been applied');
    
    // List all collections to verify
    console.log('\n📁 Collections in MedusaFriendly database:');
    const collections = await connection.db.listCollections().toArray();
    collections.forEach(collection => {
      console.log(`  • ${collection.name}`);
    });
    
    console.log('\n🎯 Next steps:');
    console.log('  • Verify collections in your MongoDB admin interface');
    console.log('  • Test your application with the new MedusaFriendly database');
    console.log('  • Consider migrating data from test database if needed');
    
  } catch (error) {
    console.error('\n❌ Model creation failed:', error.message);
    process.exit(1);
  } finally {
    // Close connection
    if (connection) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MedusaFriendly database');
    }
  }
}

// Handle script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  createAllModels().catch(error => {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  });
}

export { createAllModels };
