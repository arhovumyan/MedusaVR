# MedusaFriendly Database Setup Guide

This guide will help you replicate all the database models from your "test" database to the "MedusaFriendly" database.

## Overview

Based on the analysis of your codebase, you have 11 collections in your test database that need to be replicated:

1. **characters** - Character profiles and metadata
2. **chats** - Chat sessions and messages (legacy system)
3. **comments** - User comments on characters
4. **conversations** - Conversation threads with characters
5. **creators** - Creator profiles and statistics
6. **follows** - User follow relationships
7. **messages** - Individual messages in conversations
8. **subscriptions** - User subscription data
9. **tags** - Character tags and categories
10. **users** - User accounts and profiles
11. **violations** - User violation tracking

## Prerequisites

1. **MongoDB Running**: Ensure MongoDB is running on your system
2. **Environment Variables**: Set up your `MONGODB_URI` in your `.env` file
3. **Node.js**: Make sure Node.js is installed

## Method 1: Using the Automated Scripts

I've created several scripts to help you set up the MedusaFriendly database:

### Option A: Simple Collection Creation
```bash
# Run this script to create empty collections
node scripts/create-collections-simple.js
```

### Option B: Full Model Replication (Recommended)
```bash
# Run this script to create collections with proper schemas
node scripts/create-medusafriendly-models.js
```

### Option C: Schema Analysis and Replication
```bash
# Run this script to analyze test database and replicate schemas
node scripts/replicate-models-to-medusafriendly.js
```

## Method 2: Manual Setup

If the scripts don't work, you can manually create the collections:

### 1. Connect to MongoDB
```bash
mongosh
```

### 2. Switch to MedusaFriendly Database
```javascript
use MedusaFriendly
```

### 3. Create All Collections
```javascript
// Create all collections
db.createCollection("characters")
db.createCollection("chats")
db.createCollection("comments")
db.createCollection("conversations")
db.createCollection("creators")
db.createCollection("follows")
db.createCollection("messages")
db.createCollection("subscriptions")
db.createCollection("tags")
db.createCollection("users")
db.createCollection("violations")
```

### 4. Create Indexes (Optional but Recommended)
```javascript
// Create basic indexes for better performance
db.users.createIndex({ "username": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true })
db.characters.createIndex({ "id": 1 }, { unique: true })
db.conversations.createIndex({ "userId": 1, "characterId": 1 })
db.messages.createIndex({ "conversationId": 1, "timestamp": 1 })
```

## Method 3: Using Your Application

### 1. Update Environment Variables
In your `.env` file, ensure you have:
```env
MONGODB_URI=mongodb://localhost:27017/MedusaFriendly
DB_NAME=MedusaFriendly
```

### 2. Run Your Application
When you start your application, Mongoose will automatically create the collections when they're first used.

## Verification

After setting up the collections, verify they exist:

```bash
# Connect to MongoDB
mongosh

# Switch to MedusaFriendly database
use MedusaFriendly

# List all collections
show collections
```

You should see all 11 collections listed:
- characters
- chats
- comments
- conversations
- creators
- follows
- messages
- subscriptions
- tags
- users
- violations

## Model Schemas

Here's a summary of what each collection contains:

### users
- User accounts, authentication, preferences, subscription data
- Fields: username, email, password, avatar, bio, coins, tier, etc.

### characters
- Character profiles with images, descriptions, tags
- Fields: id, name, description, age, avatar, nsfw, likes, etc.

### conversations
- Conversation threads between users and characters
- Fields: userId, characterId, title, messages, lastActivity, etc.

### messages
- Individual messages within conversations
- Fields: conversationId, sender, content, timestamp, etc.

### chats (Legacy)
- Older chat system (may be deprecated)
- Fields: userId, characterId, messages, lastActivity, etc.

### comments
- User comments on characters
- Fields: characterId, userId, content, likes, replies, etc.

### creators
- Creator profiles and statistics
- Fields: userId, displayName, followerCount, characterCount, etc.

### follows
- User follow relationships
- Fields: followerId, followedId, createdAt, etc.

### subscriptions
- User subscription and billing data
- Fields: userId, planId, status, currentPeriodStart, etc.

### tags
- Character tags and categories
- Fields: name, displayName, category, color, isNSFW, etc.

### violations
- User violation tracking and moderation
- Fields: userId, violationType, severity, actionTaken, etc.

## Data Migration (Optional)

If you want to migrate data from your test database to MedusaFriendly:

```bash
# Export from test database
mongodump --db test --out ./backup

# Import to MedusaFriendly database
mongorestore --db MedusaFriendly ./backup/test
```

## Next Steps

1. **Test the Setup**: Run your application and verify it connects to MedusaFriendly
2. **Update Connection Strings**: Ensure all scripts use the MedusaFriendly database
3. **Verify Functionality**: Test character creation, conversations, and other features
4. **Backup**: Consider backing up your test database before making changes

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `brew services start mongodb-community` (macOS)
- Check connection string in your `.env` file
- Verify MongoDB is listening on port 27017

### Permission Issues
- Ensure your user has read/write permissions to the database
- Check MongoDB authentication if enabled

### Collection Already Exists
- The scripts will skip existing collections
- You can manually drop collections if needed: `db.collectionName.drop()`

## Support

If you encounter issues:
1. Check MongoDB logs for connection errors
2. Verify your `.env` file has the correct `MONGODB_URI`
3. Ensure all required environment variables are set
4. Test the connection using the scripts in the `scripts/` directory
