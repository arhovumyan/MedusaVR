#!/usr/bin/env node

/**
 * Simple script to create all collections in MedusaFriendly database
 * This creates empty collections with the same structure as the test database
 */

import mongoose from 'mongoose';

// Database connection string for MedusaFriendly
const MEDUSAFRIENDLY_DB_URI = 'mongodb://localhost:27017/MedusaFriendly';

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
    console.log('🚀 Creating all collections in MedusaFriendly database...\n');
    
    // Connect to MedusaFriendly database
    connection = await connectToMedusaFriendly();
    
    console.log('\n📋 Creating collections...\n');
    
    // Create each collection
    for (const collectionName of COLLECTIONS_TO_CREATE) {
      await createCollection(collectionName, connection);
    }
    
    console.log('\n✅ All collections created successfully!');
    console.log('\n📊 Summary:');
    console.log(`  • Created ${COLLECTIONS_TO_CREATE.length} collections in MedusaFriendly database`);
    
    // List all collections to verify
    console.log('\n📁 Collections in MedusaFriendly database:');
    const collections = await connection.db.listCollections().toArray();
    collections.forEach(collection => {
      console.log(`  • ${collection.name}`);
    });
    
    console.log('\n🎯 Next steps:');
    console.log('  • Verify collections in your MongoDB admin interface');
    console.log('  • Your MedusaFriendly database now has the same structure as the test database');
    console.log('  • You can now use your application with the MedusaFriendly database');
    
  } catch (error) {
    console.error('\n❌ Collection creation failed:', error.message);
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
  createAllCollections().catch(error => {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  });
}

export { createAllCollections };
