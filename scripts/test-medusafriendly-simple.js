#!/usr/bin/env node

/**
 * Simple test script for MedusaFriendly database
 * Tests collections and basic database operations without importing models
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

class SimpleDatabaseTester {
  constructor() {
    this.connection = null;
    this.testResults = {
      connection: false,
      collections: {},
      operations: {}
    };
  }

  async connectToDatabase() {
    try {
      console.log(' Connecting to MongoDB Atlas MedusaFriendly database...');
      
      const atlasUri = process.env.MONGODB_URI;
      if (!atlasUri) {
        throw new Error('MONGODB_URI not found in environment variables');
      }
      
      // Use MedusaFriendly database
      const medusaFriendlyUri = atlasUri.replace('/test?', '/MedusaFriendly?');
      
      await mongoose.connect(medusaFriendlyUri);
      this.connection = mongoose.connection;
      
      console.log(' Connected to MongoDB Atlas - MedusaFriendly database');
      console.log(` Database name: ${this.connection.name}`);
      this.testResults.connection = true;
      return true;
    } catch (error) {
      console.error(' Database connection failed:', error.message);
      this.testResults.connection = false;
      return false;
    }
  }

  async testCollections() {
    console.log('\n Testing collections...');
    
    const expectedCollections = [
      'characters', 'chats', 'comments', 'conversations', 
      'creators', 'follows', 'messages', 'subscriptions', 
      'tags', 'users', 'violations'
    ];

    const actualCollections = await this.connection.db.listCollections().toArray();
    const collectionNames = actualCollections.map(c => c.name);

    console.log('\n Found collections:');
    collectionNames.forEach(name => {
      console.log(`  • ${name}`);
    });

    console.log('\n Checking expected collections:');
    let allCollectionsExist = true;
    for (const expectedCollection of expectedCollections) {
      const exists = collectionNames.includes(expectedCollection);
      console.log(`  ${exists ? '' : ''} ${expectedCollection}`);
      this.testResults.collections[expectedCollection] = exists;
      if (!exists) allCollectionsExist = false;
    }

    console.log(`\n Total collections found: ${collectionNames.length}`);
    console.log(` Expected collections found: ${Object.values(this.testResults.collections).filter(exists => exists).length}/${expectedCollections.length}`);
    
    return allCollectionsExist;
  }

  async testBasicOperations() {
    console.log('\n Testing basic database operations...');
    
    try {
      // Test inserting a document into users collection
      console.log('\n👤 Testing user collection...');
      const testUser = {
        username: 'testuser_' + Date.now(),
        email: `test_${Date.now()}@example.com`,
        password: 'testpassword123',
        coins: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const userResult = await this.connection.db.collection('users').insertOne(testUser);
      console.log('   User document inserted successfully');
      this.testResults.operations.userInsert = true;
      
      // Test finding the document
      const foundUser = await this.connection.db.collection('users').findOne({ _id: userResult.insertedId });
      console.log(`   User document found: ${foundUser ? 'Yes' : 'No'}`);
      this.testResults.operations.userFind = !!foundUser;
      
      // Test inserting a document into characters collection
      console.log('\n Testing character collection...');
      const testCharacter = {
        id: Math.floor(Math.random() * 100000),
        name: 'Test Character',
        description: 'A test character for database validation',
        age: 25,
        avatar: 'https://example.com/test-avatar.jpg',
        nsfw: false,
        chatCount: 0,
        likes: 0,
        commentsCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const characterResult = await this.connection.db.collection('characters').insertOne(testCharacter);
      console.log('   Character document inserted successfully');
      this.testResults.operations.characterInsert = true;
      
      // Test finding the character
      const foundCharacter = await this.connection.db.collection('characters').findOne({ _id: characterResult.insertedId });
      console.log(`   Character document found: ${foundCharacter ? 'Yes' : 'No'}`);
      this.testResults.operations.characterFind = !!foundCharacter;
      
      // Test counting documents
      console.log('\n Testing document counts...');
      const userCount = await this.connection.db.collection('users').countDocuments();
      const characterCount = await this.connection.db.collection('characters').countDocuments();
      console.log(`   Users: ${userCount} documents`);
      console.log(`   Characters: ${characterCount} documents`);
      this.testResults.operations.counting = true;
      
      // Clean up test documents
      console.log('\n Cleaning up test documents...');
      await this.connection.db.collection('users').deleteOne({ _id: userResult.insertedId });
      await this.connection.db.collection('characters').deleteOne({ _id: characterResult.insertedId });
      console.log('   Test documents cleaned up');
      this.testResults.operations.cleanup = true;
      
      return true;
    } catch (error) {
      console.error(' Basic operations test failed:', error.message);
      return false;
    }
  }

  async testDatabaseStats() {
    console.log('\n Database statistics...');
    
    try {
      const stats = await this.connection.db.stats();
      console.log(`   Database size: ${(stats.dataSize / 1024).toFixed(2)} KB`);
      console.log(`   Collections: ${stats.collections}`);
      console.log(`   Objects: ${stats.objects}`);
      console.log(`  🗂️ Indexes: ${stats.indexes}`);
      
      return true;
    } catch (error) {
      console.error(' Database stats test failed:', error.message);
      return false;
    }
  }

  generateReport() {
    console.log('\n TEST REPORT');
    console.log('================');
    
    console.log(`\n Database Connection: ${this.testResults.connection ? ' PASS' : ' FAIL'}`);
    
    console.log('\n Collections Status:');
    Object.entries(this.testResults.collections).forEach(([name, exists]) => {
      console.log(`  ${exists ? '' : ''} ${name}`);
    });
    
    console.log('\n Operations Status:');
    Object.entries(this.testResults.operations).forEach(([name, success]) => {
      console.log(`  ${success ? '' : ''} ${name}`);
    });
    
    const allCollectionsExist = Object.values(this.testResults.collections).every(exists => exists);
    const allOperationsWork = Object.values(this.testResults.operations).every(success => success);
    const overallSuccess = this.testResults.connection && allCollectionsExist && allOperationsWork;
    
    console.log(`\n OVERALL RESULT: ${overallSuccess ? ' ALL TESTS PASSED' : ' SOME TESTS FAILED'}`);
    
    if (overallSuccess) {
      console.log('\n Your MedusaFriendly database is working perfectly!');
      console.log('\n Next steps:');
      console.log('  • Your database is ready for production use');
      console.log('  • Update your application to use MedusaFriendly database');
      console.log('  • Test your application with the new database');
      console.log('  • Consider migrating data from test database if needed');
    } else {
      console.log('\n  Some tests failed. Please check the errors above.');
      console.log('\n Troubleshooting:');
      console.log('  • Check your MongoDB Atlas connection string');
      console.log('  • Verify network access in MongoDB Atlas');
      console.log('  • Ensure database user has proper permissions');
    }
  }

  async runAllTests() {
    try {
      console.log(' Starting MedusaFriendly Database Tests...\n');
      
      // Test 1: Database Connection
      const connected = await this.connectToDatabase();
      if (!connected) {
        this.generateReport();
        return;
      }
      
      // Test 2: Collections
      await this.testCollections();
      
      // Test 3: Basic Operations
      await this.testBasicOperations();
      
      // Test 4: Database Stats
      await this.testDatabaseStats();
      
      // Generate Report
      this.generateReport();
      
    } catch (error) {
      console.error('\n Test suite failed:', error.message);
    } finally {
      if (this.connection) {
        await mongoose.disconnect();
        console.log('\n Disconnected from database');
      }
    }
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new SimpleDatabaseTester();
  tester.runAllTests().catch(error => {
    console.error(' Test execution failed:', error);
    process.exit(1);
  });
}

export { SimpleDatabaseTester };
