#!/usr/bin/env node

/**
 * Script to create all collections in MedusaFriendly database on MongoDB Atlas
 * This connects to your MongoDB Atlas instance and creates the collections there
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Collections to create (based on the test database structure shown in the image)
const COLLECTIONS_TO_CREATE = [
  'characters',
  'chats',
  'comments', 
  'conversations',
  'creators',
  'follows',
  'messages',
  'subscriptions',
  'tags',
  'users',
  'violations'
];

async function connectToAtlas() {
  try {
    // Use the existing MONGODB_URI but change the database name to MedusaFriendly
    const atlasUri = process.env.MONGODB_URI;
    if (!atlasUri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }
    
    // Replace the database name in the URI from 'test' to 'MedusaFriendly'
    const medusaFriendlyUri = atlasUri.replace('/test?', '/MedusaFriendly?');
    
    console.log('🔗 Connecting to MongoDB Atlas...');
    await mongoose.connect(medusaFriendlyUri);
    console.log('✅ Connected to MongoDB Atlas - MedusaFriendly database');
    return mongoose.connection;
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB Atlas:', error.message);
    throw error;
  }
}

async function createCollection(collectionName, connection) {
  try {
    console.log(`🔨 Creating collection: ${collectionName}`);
    
    // Check if collection already exists
    const collections = await connection.db.listCollections({ name: collectionName }).toArray();
    
    if (collections.length > 0) {
      console.log(`  ⚠️  Collection '${collectionName}' already exists`);
      return;
    }
    
    // Create the collection
    await connection.db.createCollection(collectionName);
    console.log(`  ✅ Created collection '${collectionName}'`);
    
  } catch (error) {
    console.error(`  ❌ Error creating collection '${collectionName}':`, error.message);
    throw error;
  }
}

async function createAllCollections() {
  let connection = null;
  
  try {
    console.log('🚀 Creating all collections in MongoDB Atlas - MedusaFriendly database...\n');
    
    // Connect to MongoDB Atlas
    connection = await connectToAtlas();
    
    console.log('\n📋 Creating collections...\n');
    
    // Create each collection
    for (const collectionName of COLLECTIONS_TO_CREATE) {
      await createCollection(collectionName, connection);
    }
    
    console.log('\n✅ All collections created successfully in MongoDB Atlas!');
    console.log('\n📊 Summary:');
    console.log(`  • Created ${COLLECTIONS_TO_CREATE.length} collections in MedusaFriendly database on MongoDB Atlas`);
    
    // List all collections to verify
    console.log('\n📁 Collections in MedusaFriendly database:');
    const collections = await connection.db.listCollections().toArray();
    collections.forEach(collection => {
      console.log(`  • ${collection.name}`);
    });
    
    console.log('\n🎯 Next steps:');
    console.log('  • Check your MongoDB Atlas interface to see the new collections');
    console.log('  • Update your application to use MedusaFriendly database');
    console.log('  • Your MedusaFriendly database now has the same structure as the test database');
    
  } catch (error) {
    console.error('\n❌ Collection creation failed:', error.message);
    process.exit(1);
  } finally {
    // Close connection
    if (connection) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB Atlas');
    }
  }
}

// Handle script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  createAllCollections().catch(error => {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  });
}

export { createAllCollections };
