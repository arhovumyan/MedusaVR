#!/usr/bin/env node

/**
 * Comprehensive test script for MedusaFriendly database
 * Tests all collections and basic functionality
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Import models for testing
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

// Test data templates
const TEST_DATA = {
  user: {
    username: 'testuser_' + Date.now(),
    email: `test_${Date.now()}@example.com`,
    password: 'testpassword123',
    coins: 100,
    preferences: {
      nsfwEnabled: false,
      completedOnboarding: true
    }
  },
  character: {
    id: Math.floor(Math.random() * 100000),
    name: 'Test Character',
    description: 'A test character for database validation',
    age: 25,
    avatar: 'https://example.com/test-avatar.jpg',
    nsfw: false,
    chatCount: 0,
    likes: 0,
    commentsCount: 0
  },
  tag: {
    name: 'test-tag-' + Date.now(),
    displayName: 'Test Tag',
    category: 'character-type',
    color: '#FF5733',
    isNSFW: false,
    usageCount: 0
  }
};

class DatabaseTester {
  constructor() {
    this.connection = null;
    this.testResults = {
      connection: false,
      collections: {},
      models: {},
      cleanup: []
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
    for (const expectedCollection of expectedCollections) {
      const exists = collectionNames.includes(expectedCollection);
      console.log(`  ${exists ? '' : ''} ${expectedCollection}`);
      this.testResults.collections[expectedCollection] = exists;
    }

    return Object.values(this.testResults.collections).every(exists => exists);
  }

  async testModelOperations() {
    console.log('\n Testing model operations...');
    
    try {
      // Test User Model
      console.log('\n👤 Testing User model...');
      const testUser = new UserModel(TEST_DATA.user);
      const savedUser = await testUser.save();
      console.log('   User created successfully');
      this.testResults.cleanup.push({ model: UserModel, id: savedUser._id });
      this.testResults.models.user = true;

      // Test Character Model
      console.log('\n Testing Character model...');
      const testCharacter = new CharacterModel(TEST_DATA.character);
      const savedCharacter = await testCharacter.save();
      console.log('   Character created successfully');
      this.testResults.cleanup.push({ model: CharacterModel, id: savedCharacter._id });
      this.testResults.models.character = true;

      // Test Tag Model
      console.log('\n🏷️ Testing Tag model...');
      const testTag = new TagModel(TEST_DATA.tag);
      const savedTag = await testTag.save();
      console.log('   Tag created successfully');
      this.testResults.cleanup.push({ model: TagModel, id: savedTag._id });
      this.testResults.models.tag = true;

      // Test Conversation Model
      console.log('\n Testing Conversation model...');
      const testConversation = new ConversationModel({
        userId: savedUser._id,
        characterId: savedCharacter.id,
        title: 'Test Conversation',
        messages: []
      });
      const savedConversation = await testConversation.save();
      console.log('   Conversation created successfully');
      this.testResults.cleanup.push({ model: ConversationModel, id: savedConversation._id });
      this.testResults.models.conversation = true;

      // Test Message Model
      console.log('\n📨 Testing Message model...');
      const testMessage = new MessageModel({
        conversationId: savedConversation._id,
        sender: 'user',
        content: 'Hello, this is a test message!',
        characterId: savedCharacter.id,
        characterName: savedCharacter.name
      });
      const savedMessage = await testMessage.save();
      console.log('   Message created successfully');
      this.testResults.cleanup.push({ model: MessageModel, id: savedMessage._id });
      this.testResults.models.message = true;

      return true;
    } catch (error) {
      console.error(' Model operations test failed:', error.message);
      return false;
    }
  }

  async testQueries() {
    console.log('\n Testing database queries...');
    
    try {
      // Test counting documents
      const userCount = await UserModel.countDocuments();
      const characterCount = await CharacterModel.countDocuments();
      const tagCount = await TagModel.countDocuments();
      
      console.log(`   User documents: ${userCount}`);
      console.log(`   Character documents: ${characterCount}`);
      console.log(`   Tag documents: ${tagCount}`);
      
      // Test finding documents
      const users = await UserModel.find().limit(5);
      console.log(`   Found ${users.length} users`);
      
      return true;
    } catch (error) {
      console.error(' Query test failed:', error.message);
      return false;
    }
  }

  async cleanupTestData() {
    console.log('\n Cleaning up test data...');
    
    try {
      for (const item of this.testResults.cleanup) {
        await item.model.deleteOne({ _id: item.id });
      }
      console.log('   Test data cleaned up successfully');
      return true;
    } catch (error) {
      console.error(' Cleanup failed:', error.message);
      return false;
    }
  }

  generateReport() {
    console.log('\n TEST REPORT');
    console.log('================');
    
    console.log(`\n Database Connection: ${this.testResults.connection ? ' PASS' : ' FAIL'}`);
    
    console.log('\n Collections:');
    Object.entries(this.testResults.collections).forEach(([name, exists]) => {
      console.log(`  ${exists ? '' : ''} ${name}`);
    });
    
    console.log('\n Model Operations:');
    Object.entries(this.testResults.models).forEach(([name, success]) => {
      console.log(`  ${success ? '' : ''} ${name}`);
    });
    
    const allCollectionsExist = Object.values(this.testResults.collections).every(exists => exists);
    const allModelsWork = Object.values(this.testResults.models).every(success => success);
    const overallSuccess = this.testResults.connection && allCollectionsExist && allModelsWork;
    
    console.log(`\n OVERALL RESULT: ${overallSuccess ? ' ALL TESTS PASSED' : ' SOME TESTS FAILED'}`);
    
    if (overallSuccess) {
      console.log('\n Your MedusaFriendly database is ready to use!');
      console.log('\n Next steps:');
      console.log('  • Update your application to use MedusaFriendly database');
      console.log('  • Test your application with the new database');
      console.log('  • Consider migrating data from test database if needed');
    } else {
      console.log('\n  Some tests failed. Please check the errors above.');
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
      
      // Test 3: Model Operations
      await this.testModelOperations();
      
      // Test 4: Queries
      await this.testQueries();
      
      // Test 5: Cleanup
      await this.cleanupTestData();
      
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
  const tester = new DatabaseTester();
  tester.runAllTests().catch(error => {
    console.error(' Test execution failed:', error);
    process.exit(1);
  });
}

export { DatabaseTester };
