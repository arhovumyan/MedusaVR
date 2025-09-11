#!/usr/bin/env ts-node

/**
 * Delete User Character Images Script
 * 
 * This script deletes all images for a specific character from a user's Cloudinary folder.
 * It follows the structure: username/characters/characterName/images/
 * 
 * Usage:
 * - Delete specific character images: npm run delete-character-images -- --username=john --character=animeGirl
 * - Delete all character images for a user: npm run delete-character-images -- --username=john --all-characters
 * - List characters without deleting: npm run delete-character-images -- --username=john --list-only
 * 
 * Environment Variables Required:
 * - CLOUDINARY_CLOUD_NAME
 * - CLOUDINARY_API_KEY  
 * - CLOUDINARY_API_SECRET
 */

import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryFolderService } from '../services/CloudinaryFolderService.js';
import { CharacterModel } from '../db/models/CharacterModel.js';
import { UserModel } from '../db/models/UserModel.js';
import { connectDB } from '../lib/db.js';

// Load environment variables
dotenv.config();

interface DeleteOptions {
  username: string;
  character?: string;
  allCharacters?: boolean;
  listOnly?: boolean;
  dryRun?: boolean;
  force?: boolean;
}

class CharacterImageDeleter {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor() {
    this.cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
    this.apiKey = process.env.CLOUDINARY_API_KEY || '';
    this.apiSecret = process.env.CLOUDINARY_API_SECRET || '';

    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      throw new Error('Missing required Cloudinary environment variables. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET');
    }

    // Configure Cloudinary
    cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
    });
  }

  /**
   * Parse command line arguments
   */
  private parseArgs(): DeleteOptions {
    const args = process.argv.slice(2);
    const options: DeleteOptions = {
      username: '',
      character: undefined,
      allCharacters: false,
      listOnly: false,
      dryRun: false,
      force: false,
    };

    for (const arg of args) {
      if (arg.startsWith('--username=')) {
        options.username = arg.split('=')[1];
      } else if (arg.startsWith('--character=')) {
        options.character = arg.split('=')[1];
      } else if (arg === '--all-characters') {
        options.allCharacters = true;
      } else if (arg === '--list-only') {
        options.listOnly = true;
      } else if (arg === '--dry-run') {
        options.dryRun = true;
      } else if (arg === '--force') {
        options.force = true;
      } else if (arg === '--help' || arg === '-h') {
        this.showHelp();
        process.exit(0);
      }
    }

    if (!options.username) {
      throw new Error('Username is required. Use --username=yourUsername');
    }

    if (!options.character && !options.allCharacters && !options.listOnly) {
      throw new Error('Must specify either --character=name, --all-characters, or --list-only');
    }

    return options;
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    console.log(`
🗑️  Character Image Deletion Script

Usage:
  npm run delete-character-images -- --username=john --character=animeGirl
  npm run delete-character-images -- --username=john --all-characters
  npm run delete-character-images -- --username=john --list-only

Options:
  --username=<username>     Required: The username whose images to delete
  --character=<name>        Delete images for a specific character
  --all-characters          Delete images for all characters of the user
  --list-only               List characters without deleting (safe mode)
  --dry-run                 Show what would be deleted without actually deleting
  --force                   Skip confirmation prompts
  --help, -h               Show this help message

Examples:
  # Delete images for a specific character
  npm run delete-character-images -- --username=john --character=animeGirl

  # Delete all character images for a user
  npm run delete-character-images -- --username=john --all-characters

  # List characters without deleting
  npm run delete-character-images -- --username=john --list-only

  # Dry run to see what would be deleted
  npm run delete-character-images -- --username=john --all-characters --dry-run

Environment Variables Required:
  - CLOUDINARY_CLOUD_NAME
  - CLOUDINARY_API_KEY
  - CLOUDINARY_API_SECRET
`);
  }

  /**
   * Verify user exists in database
   */
  private async verifyUser(username: string): Promise<string> {
    try {
      const user = await UserModel.findOne({ username });
      if (!user) {
        throw new Error(`User '${username}' not found in database`);
      }
      console.log(`✅ User verified: ${username} (ID: ${user._id})`);
      return user._id.toString();
    } catch (error) {
      throw new Error(`Failed to verify user: ${error}`);
    }
  }

  /**
   * List all characters for a user
   */
  private async listUserCharacters(username: string, userId: string): Promise<string[]> {
    try {
      console.log(`\n🔍 Listing characters for user: ${username}`);
      
      // Get characters from database
      const dbCharacters = await CharacterModel.find({ creatorId: userId });
      console.log(`📊 Database characters: ${dbCharacters.length}`);
      
      // Get characters from Cloudinary
      const charactersFolder = `${username}/characters`;
      let cloudinaryCharacters: string[] = [];
      
      try {
        const characterFolders = await cloudinary.api.sub_folders(charactersFolder);
        cloudinaryCharacters = characterFolders.folders.map((folder: any) => folder.name);
        console.log(`☁️  Cloudinary characters: ${cloudinaryCharacters.length}`);
      } catch (error) {
        console.log(`⚠️  Could not fetch Cloudinary characters: ${error}`);
      }

      // Show character details
      if (dbCharacters.length > 0) {
        console.log('\n📋 Database Characters:');
        dbCharacters.forEach(char => {
          console.log(`  - ${char.name} (ID: ${char._id})`);
        });
      }

      if (cloudinaryCharacters.length > 0) {
        console.log('\n☁️  Cloudinary Characters:');
        cloudinaryCharacters.forEach(char => {
          console.log(`  - ${char}`);
        });
      }

      return cloudinaryCharacters;
    } catch (error) {
      throw new Error(`Failed to list characters: ${error}`);
    }
  }

  /**
   * Get image count for a character
   */
  private async getCharacterImageCount(username: string, characterName: string): Promise<number> {
    try {
      const imagesFolder = `${username}/characters/${characterName}/images`;
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: imagesFolder,
        max_results: 1000,
        resource_type: 'image'
      });
      return result.resources.length;
    } catch (error) {
      console.log(`⚠️  Could not get image count for ${characterName}: ${error}`);
      return 0;
    }
  }

  /**
   * Delete all images for a specific character
   */
  private async deleteCharacterImages(username: string, characterName: string, dryRun: boolean = false): Promise<number> {
    try {
      const imagesFolder = `${username}/characters/${characterName}/images`;
      console.log(`\n🗑️  Processing character: ${characterName}`);
      
      // Get all images in the folder
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: imagesFolder,
        max_results: 1000,
        resource_type: 'image'
      });

      const imageCount = result.resources.length;
      console.log(`  📸 Found ${imageCount} images in ${imagesFolder}`);

      if (imageCount === 0) {
        console.log(`  ℹ️  No images to delete for ${characterName}`);
        return 0;
      }

      if (dryRun) {
        console.log(`  🔍 DRY RUN: Would delete ${imageCount} images`);
        result.resources.forEach((resource: any) => {
          console.log(`    - ${resource.public_id}`);
        });
        return imageCount;
      }

      // Delete images in batches
      const batchSize = 10;
      let deletedCount = 0;
      
      for (let i = 0; i < result.resources.length; i += batchSize) {
        const batch = result.resources.slice(i, i + batchSize);
        const deletePromises = batch.map((resource: any) => 
          cloudinary.uploader.destroy(resource.public_id, { resource_type: 'image' })
        );
        
        try {
          await Promise.all(deletePromises);
          deletedCount += batch.length;
          console.log(`  ✅ Deleted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} images`);
        } catch (error) {
          console.log(`  ❌ Failed to delete batch ${Math.floor(i / batchSize) + 1}: ${error}`);
        }
      }

      console.log(`  🎯 Successfully deleted ${deletedCount}/${imageCount} images for ${characterName}`);
      return deletedCount;
    } catch (error) {
      console.log(`  ❌ Error deleting images for ${characterName}: ${error}`);
      return 0;
    }
  }

  /**
   * Delete character folder (optional - removes empty folder)
   */
  private async deleteCharacterFolder(username: string, characterName: string, dryRun: boolean = false): Promise<boolean> {
    try {
      const characterFolder = `${username}/characters/${characterName}`;
      
      // Check if folder is empty
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: characterFolder,
        max_results: 1,
        resource_type: 'image'
      });

      if (result.resources.length > 0) {
        console.log(`  ⚠️  Folder ${characterFolder} still contains resources, skipping folder deletion`);
        return false;
      }

      if (dryRun) {
        console.log(`  🔍 DRY RUN: Would delete empty folder ${characterFolder}`);
        return true;
      }

      // Try to delete the folder by uploading and then deleting a placeholder
      try {
        const placeholderBuffer = Buffer.from('placeholder', 'base64');
        await cloudinary.uploader.upload(`data:text/plain;base64,${placeholderBuffer.toString('base64')}`, {
          folder: characterFolder,
          public_id: ".placeholder",
          resource_type: "raw",
          overwrite: true,
        });
        
        await cloudinary.uploader.destroy(`${characterFolder}/.placeholder`, { resource_type: 'raw' });
        console.log(`  🗂️  Deleted empty folder: ${characterFolder}`);
        return true;
      } catch (error) {
        console.log(`  ⚠️  Could not delete folder ${characterFolder}: ${error}`);
        return false;
      }
    } catch (error) {
      console.log(`  ❌ Error checking/deleting folder: ${error}`);
      return false;
    }
  }

  /**
   * Main execution method
   */
  async run(): Promise<void> {
    try {
      console.log('🚀 Starting Character Image Deletion Script');
      console.log('=' .repeat(60));

      // Parse arguments
      const options = this.parseArgs();
      console.log(`📋 Options:`, options);

      // Verify Cloudinary configuration
      if (!CloudinaryFolderService.isConfigured()) {
        throw new Error('Cloudinary is not properly configured');
      }
      console.log('✅ Cloudinary configuration verified');

      // Connect to database
      await connectDB();
      console.log('✅ Database connected');

      // Verify user exists
      const userId = await this.verifyUser(options.username);

      if (options.listOnly) {
        // Just list characters
        await this.listUserCharacters(options.username, userId);
        console.log('\n✅ Character listing completed');
        return;
      }

      // Get characters to process
      let charactersToProcess: string[] = [];
      
      if (options.character) {
        charactersToProcess = [options.character];
      } else if (options.allCharacters) {
        const cloudinaryCharacters = await this.listUserCharacters(options.username, userId);
        charactersToProcess = cloudinaryCharacters;
      }

      if (charactersToProcess.length === 0) {
        console.log('ℹ️  No characters to process');
        return;
      }

      console.log(`\n🎯 Processing ${charactersToProcess.length} character(s): ${charactersToProcess.join(', ')}`);

      // Confirmation prompt (unless --force is used)
      if (!options.force && !options.dryRun) {
        const totalImages = await Promise.all(
          charactersToProcess.map(char => this.getCharacterImageCount(options.username, char))
        );
        const totalImageCount = totalImages.reduce((sum, count) => sum + count, 0);
        
        console.log(`\n⚠️  WARNING: This will delete ${totalImageCount} images across ${charactersToProcess.length} character(s)`);
        console.log('Type "DELETE" to confirm:');
        
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const answer = await new Promise<string>((resolve) => {
          rl.question('> ', resolve);
        });
        rl.close();

        if (answer !== 'DELETE') {
          console.log('❌ Operation cancelled');
          return;
        }
      }

      // Process each character
      let totalDeleted = 0;
      let totalCharacters = 0;

      for (const characterName of charactersToProcess) {
        try {
          const deletedCount = await this.deleteCharacterImages(options.username, characterName, options.dryRun);
          if (deletedCount > 0) {
            totalDeleted += deletedCount;
            totalCharacters++;
          }

          // Optionally delete empty folder
          if (!options.dryRun && deletedCount > 0) {
            await this.deleteCharacterFolder(options.username, characterName, options.dryRun);
          }
        } catch (error) {
          console.log(`❌ Failed to process character ${characterName}: ${error}`);
        }
      }

      // Summary
      console.log('\n' + '=' .repeat(60));
      if (options.dryRun) {
        console.log(`🔍 DRY RUN COMPLETED`);
        console.log(`📊 Would delete ${totalDeleted} images from ${totalCharacters} character(s)`);
      } else {
        console.log(`✅ DELETION COMPLETED`);
        console.log(`📊 Deleted ${totalDeleted} images from ${totalCharacters} character(s)`);
      }
      console.log('=' .repeat(60));

    } catch (error) {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    } finally {
      // Disconnect from database
      try {
        await require('mongoose').disconnect();
        console.log('✅ Database disconnected');
      } catch (error) {
        console.log('⚠️  Error disconnecting from database:', error);
      }
    }
  }
}

// Run the script if called directly
if (require.main === module) {
  const deleter = new CharacterImageDeleter();
  deleter.run().catch(console.error);
}

export default CharacterImageDeleter;
