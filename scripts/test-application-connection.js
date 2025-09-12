#!/usr/bin/env node

/**
 * Test script to verify application can connect to MedusaFriendly database
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

async function testApplicationConnection() {
  try {
    console.log('🚀 Testing Application Connection to MedusaFriendly Database...\n');
    
    // Test 1: Check environment variables
    console.log('📋 Checking environment variables...');
    const mongodbUri = process.env.MONGODB_URI;
    const dbName = process.env.DB_NAME;
    
    if (!mongodbUri) {
      console.log('❌ MONGODB_URI not found in environment variables');
      return false;
    }
    
    console.log('✅ MONGODB_URI found');
    console.log(`📊 Current DB_NAME: ${dbName || 'not set'}`);
    
    // Test 2: Test connection with current configuration
    console.log('\n🔗 Testing connection with current configuration...');
    await mongoose.connect(mongodbUri);
    console.log(`✅ Connected to database: ${mongoose.connection.name}`);
    
    // List collections in current database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Found ${collections.length} collections in current database:`);
    collections.forEach(c => console.log(`  • ${c.name}`));
    
    await mongoose.disconnect();
    
    // Test 3: Test connection to MedusaFriendly database
    console.log('\n🔗 Testing connection to MedusaFriendly database...');
    const medusaFriendlyUri = mongodbUri.replace('/test?', '/MedusaFriendly?');
    await mongoose.connect(medusaFriendlyUri);
    console.log(`✅ Connected to MedusaFriendly database: ${mongoose.connection.name}`);
    
    // List collections in MedusaFriendly database
    const medusaCollections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Found ${medusaCollections.length} collections in MedusaFriendly database:`);
    medusaCollections.forEach(c => console.log(`  • ${c.name}`));
    
    await mongoose.disconnect();
    
    // Test 4: Show configuration recommendation
    console.log('\n📋 Configuration Recommendation:');
    console.log('To use MedusaFriendly database, update your .env file:');
    console.log('\nCurrent MONGODB_URI:');
    console.log(`MONGODB_URI=${mongodbUri}`);
    console.log('\nRecommended MONGODB_URI for MedusaFriendly:');
    console.log(`MONGODB_URI=${medusaFriendlyUri}`);
    console.log('\nOr add this to your .env file:');
    console.log(`DB_NAME=MedusaFriendly`);
    
    console.log('\n✅ Application connection test completed successfully!');
    return true;
    
  } catch (error) {
    console.error('\n❌ Application connection test failed:', error.message);
    return false;
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from database');
    }
  }
}

// Run the test
testApplicationConnection().catch(error => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});
