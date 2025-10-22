#!/usr/bin/env node

/**
 * Script to replicate all database models from 'test' database to 'MedusaFriendly' database
 * This creates the same collections structure in MedusaFriendly as exists in test
 */

import mongoose from 'mongoose';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Database connection strings
const TEST_DB_URI = 'mongodb://localhost:27017/test';
const MEDUSAFRIENDLY_DB_URI = 'mongodb://localhost:27017/MedusaFriendly';

// Collections to replicate (based on the image showing test database structure)
const COLLECTIONS_TO_REPLICATE = [
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

async function connectToDatabase(uri, dbName) {
  try {
    await mongoose.connect(uri);
    console.log(` Connected to ${dbName} database`);
    return mongoose.connection;
  } catch (error) {
    console.error(` Failed to connect to ${dbName} database:`, error.message);
    throw error;
  }
}

async function getCollectionSchema(collection, connection) {
  try {
    // Get a sample document to understand the schema structure
    const sampleDoc = await connection.db.collection(collection).findOne({});
    
    if (!sampleDoc) {
      console.log(`  Collection '${collection}' is empty, creating with basic structure`);
      return null;
    }
    
    // Get collection stats to understand indexes
    const stats = await connection.db.collection(collection).stats();
    
    return {
      sampleDoc,
      stats,
      indexes: await connection.db.collection(collection).indexes()
    };
  } catch (error) {
    console.error(` Error analyzing collection '${collection}':`, error.message);
    return null;
  }
}

async function createCollectionInTarget(collectionName, schemaInfo, targetConnection) {
  try {
    const targetDb = targetConnection.db;
    
    // Check if collection already exists
    const collections = await targetDb.listCollections({ name: collectionName }).toArray();
    
    if (collections.length > 0) {
      console.log(`  Collection '${collectionName}' already exists in MedusaFriendly database`);
      return;
    }
    
    // Create the collection
    await targetDb.createCollection(collectionName);
    console.log(` Created collection '${collectionName}' in MedusaFriendly database`);
    
    // If we have schema info, try to recreate indexes
    if (schemaInfo && schemaInfo.indexes) {
      const collection = targetDb.collection(collectionName);
      
      for (const index of schemaInfo.indexes) {
        if (index.name !== '_id_') { // Skip default _id index
          try {
            const indexSpec = { ...index.key };
            const indexOptions = { ...index };
            delete indexOptions.key;
            delete indexOptions.v;
            delete indexOptions.ns;
            
            await collection.createIndex(indexSpec, indexOptions);
            console.log(`   Created index on '${collectionName}': ${JSON.stringify(indexSpec)}`);
          } catch (indexError) {
            console.log(`    Could not create index on '${collectionName}': ${indexError.message}`);
          }
        }
      }
    }
    
  } catch (error) {
    console.error(` Error creating collection '${collectionName}':`, error.message);
    throw error;
  }
}

async function replicateModels() {
  let testConnection = null;
  let medusaFriendlyConnection = null;
  
  try {
    console.log(' Starting model replication from test to MedusaFriendly database...\n');
    
    // Connect to both databases
    testConnection = await connectToDatabase(TEST_DB_URI, 'test');
    medusaFriendlyConnection = await connectToDatabase(MEDUSAFRIENDLY_DB_URI, 'MedusaFriendly');
    
    console.log('\n Analyzing collections in test database...\n');
    
    // Analyze each collection in the test database
    const collectionAnalysis = {};
    
    for (const collectionName of COLLECTIONS_TO_REPLICATE) {
      console.log(` Analyzing collection: ${collectionName}`);
      const schemaInfo = await getCollectionSchema(collectionName, testConnection);
      collectionAnalysis[collectionName] = schemaInfo;
      
      if (schemaInfo) {
        console.log(`   Found ${schemaInfo.stats.count} documents`);
        console.log(`   Found ${schemaInfo.indexes.length} indexes`);
      } else {
        console.log(`    Collection is empty or doesn't exist`);
      }
    }
    
    console.log('\n🏗️  Creating collections in MedusaFriendly database...\n');
    
    // Create collections in MedusaFriendly database
    for (const collectionName of COLLECTIONS_TO_REPLICATE) {
      console.log(`🔨 Creating collection: ${collectionName}`);
      await createCollectionInTarget(collectionName, collectionAnalysis[collectionName], medusaFriendlyConnection);
    }
    
    console.log('\n Model replication completed successfully!');
    console.log('\n Summary:');
    console.log(`  • Analyzed ${COLLECTIONS_TO_REPLICATE.length} collections from test database`);
    console.log(`  • Created ${COLLECTIONS_TO_REPLICATE.length} collections in MedusaFriendly database`);
    console.log('\n Next steps:');
    console.log('  • Verify collections in your MongoDB admin interface');
    console.log('  • Test your application with the new MedusaFriendly database');
    console.log('  • Consider migrating data if needed');
    
  } catch (error) {
    console.error('\n Model replication failed:', error.message);
    process.exit(1);
  } finally {
    // Close connections
    if (testConnection) {
      await mongoose.disconnect();
      console.log('\n Disconnected from databases');
    }
  }
}

// Handle script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  replicateModels().catch(error => {
    console.error(' Script execution failed:', error);
    process.exit(1);
  });
}

export { replicateModels };
